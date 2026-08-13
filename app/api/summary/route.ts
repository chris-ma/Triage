import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { gql } from "@/lib/nhost/client";
import { generateDoctorSummary } from "@/lib/claude/summaryGenerator";
import type { ConditionScore } from "@/lib/inference/types";

function notConfigured() {
  if (!process.env.NHOST_GRAPHQL_URL || !process.env.NHOST_ADMIN_SECRET) {
    return NextResponse.json({ error: "Nhost not configured" }, { status: 503 });
  }
  if (!process.env.DEEPSEEK_API_KEY) {
    return NextResponse.json({ error: "DEEPSEEK_API_KEY is not set — add it in Vercel environment variables" }, { status: 503 });
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

    // Check for cached summary
    const { data: cachedData } = await gql<{
      doctor_summaries: Array<{ summary_text: string; model_used: string }>;
    }>(
      `query GetSummary($session_id: uuid!) {
        doctor_summaries(where: { session_id: { _eq: $session_id } }, limit: 1) {
          summary_text model_used
        }
      }`,
      { session_id: sessionId }
    );

    const cached = cachedData?.doctor_summaries?.[0];
    if (cached) {
      return NextResponse.json({ summaryText: cached.summary_text, cached: true });
    }

    // Load analysis results
    const { data: analysisData, error: analysisError } = await gql<{
      analysis_results: Array<{
        urgency_level: string;
        urgency_reason: string;
        red_flags: string[];
        condition_groups: unknown;
        engine_version: string;
        created_at: string;
      }>;
    }>(
      `query GetAnalysisForSummary($session_id: uuid!) {
        analysis_results(where: { session_id: { _eq: $session_id } }, limit: 1) {
          urgency_level urgency_reason red_flags condition_groups engine_version created_at
        }
      }`,
      { session_id: sessionId }
    );

    const analysis = analysisData?.analysis_results?.[0];
    if (analysisError || !analysis) {
      return NextResponse.json({ error: "Analysis not found — run analysis first" }, { status: 404 });
    }

    // Load session intake data
    const { data: sessionData, error: sessionError } = await gql<{
      sessions_by_pk: { intake_data: Record<string, unknown>; created_at: string } | null;
    }>(
      `query GetSessionIntake($id: uuid!) {
        sessions_by_pk(id: $id) { intake_data created_at }
      }`,
      { id: sessionId }
    );

    if (sessionError || !sessionData?.sessions_by_pk) {
      return NextResponse.json({ error: "Session not found or expired" }, { status: 404 });
    }

    const session = sessionData.sessions_by_pk;

    const { summaryText, modelUsed, promptHash } = await generateDoctorSummary({
      sessionId,
      urgencyLevel: analysis.urgency_level as "emergency" | "urgent" | "routine" | "informational",
      urgencyReason: analysis.urgency_reason ?? "",
      redFlags: analysis.red_flags ?? [],
      conditionGroups: (analysis.condition_groups ?? []) as ConditionScore[],
      intake: (session.intake_data ?? {}) as Record<string, unknown>,
      engineVersion: analysis.engine_version,
      captureDate: analysis.created_at,
    });

    // Persist summary
    await gql(
      `mutation InsertSummary($session_id: uuid!, $summary_text: String!, $model_used: String!, $prompt_hash: String!) {
        insert_doctor_summaries_one(object: {
          session_id: $session_id
          summary_text: $summary_text
          model_used: $model_used
          prompt_hash: $prompt_hash
        }) { id }
      }`,
      {
        session_id: sessionId,
        summary_text: summaryText,
        model_used: modelUsed,
        prompt_hash: promptHash,
      }
    );

    // Mark session complete
    await gql(
      `mutation UpdateSessionStatus($id: uuid!, $status: String!) {
        update_sessions_by_pk(pk_columns: { id: $id }, _set: { status: $status }) { id }
      }`,
      { id: sessionId, status: "complete" }
    );

    return NextResponse.json({ summaryText });
  } catch (err) {
    console.error("Summary error:", err);
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
  }
}
