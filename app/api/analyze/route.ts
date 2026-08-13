import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { gql } from "@/lib/nhost/client";
import { extractFeatures } from "@/lib/inference/mockEngine";
import { scoreConditions } from "@/lib/inference/scorer";
import { determineUrgency } from "@/lib/inference/triageRules";
import type { MediaAsset } from "@/lib/inference/types";

function notConfigured() {
  if (!process.env.NHOST_GRAPHQL_URL || !process.env.NHOST_ADMIN_SECRET) {
    return NextResponse.json({ error: "Service not configured" }, { status: 503 });
  }
  return null;
}

const schema = z.object({ sessionId: z.string().uuid() });

export async function POST(req: NextRequest) {
  const cfg = notConfigured();
  if (cfg) return cfg;
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { sessionId } = parsed.data;

    // Load session
    const { data: sessionData, error: sessionError } = await gql<{
      sessions_by_pk: { id: string; intake_data: Record<string, unknown>; status: string } | null;
    }>(
      `query GetSession($id: uuid!) {
        sessions_by_pk(id: $id) { id intake_data status }
      }`,
      { id: sessionId }
    );

    if (sessionError || !sessionData?.sessions_by_pk) {
      return NextResponse.json({ error: "Session not found or expired" }, { status: 404 });
    }

    // Check if already analyzed
    const { data: existingData } = await gql<{
      analysis_results: Array<{
        id: string;
        urgency_level: string;
        urgency_reason: string;
        red_flags: string[];
        condition_groups: unknown;
      }>;
    }>(
      `query GetAnalysis($session_id: uuid!) {
        analysis_results(where: { session_id: { _eq: $session_id } }, limit: 1) {
          id urgency_level urgency_reason red_flags condition_groups
        }
      }`,
      { session_id: sessionId }
    );

    const existing = existingData?.analysis_results?.[0];
    if (existing) {
      return NextResponse.json({
        urgencyLevel: existing.urgency_level,
        urgencyReason: existing.urgency_reason,
        redFlags: existing.red_flags ?? [],
        conditionGroups: existing.condition_groups,
        cached: true,
      });
    }

    // Load media assets
    const { data: assetsData } = await gql<{
      media_assets: Array<{ id: string; asset_type: string; storage_path: string; mime_type: string }>;
    }>(
      `query GetMediaAssets($session_id: uuid!) {
        media_assets(where: { session_id: { _eq: $session_id } }) {
          id asset_type storage_path mime_type
        }
      }`,
      { session_id: sessionId }
    );

    const session = sessionData.sessions_by_pk;
    const intakeData = (session.intake_data ?? {}) as Record<string, unknown>;

    // Run inference pipeline
    const rawFeatures = await extractFeatures(sessionId, (assetsData?.media_assets ?? []) as MediaAsset[]);
    const conditionScores = scoreConditions(rawFeatures, intakeData);
    const urgencyResult = determineUrgency(conditionScores, intakeData, rawFeatures.visualSignals);

    // Persist results
    const { error: insertError } = await gql(
      `mutation InsertAnalysis(
        $session_id: uuid!
        $urgency_level: String!
        $urgency_reason: String
        $red_flags: jsonb
        $condition_groups: jsonb
        $raw_features: jsonb
        $engine_version: String
      ) {
        insert_analysis_results_one(object: {
          session_id: $session_id
          urgency_level: $urgency_level
          urgency_reason: $urgency_reason
          red_flags: $red_flags
          condition_groups: $condition_groups
          raw_features: $raw_features
          engine_version: $engine_version
        }) { id }
      }`,
      {
        session_id: sessionId,
        urgency_level: urgencyResult.level,
        urgency_reason: urgencyResult.reason,
        red_flags: urgencyResult.redFlags,
        condition_groups: conditionScores,
        raw_features: rawFeatures,
        engine_version: rawFeatures.engineVersion,
      }
    );

    if (insertError) {
      return NextResponse.json({ error: "Failed to persist results" }, { status: 500 });
    }

    // Update session status
    await gql(
      `mutation UpdateSessionStatus($id: uuid!, $status: String!) {
        update_sessions_by_pk(pk_columns: { id: $id }, _set: { status: $status }) { id }
      }`,
      { id: sessionId, status: "analyzed" }
    );

    return NextResponse.json({
      urgencyLevel: urgencyResult.level,
      urgencyReason: urgencyResult.reason,
      redFlags: urgencyResult.redFlags,
      conditionGroups: conditionScores,
    });
  } catch (err) {
    console.error("Analyze error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
