import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";

function notConfigured() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: "Service not configured" }, { status: 503 });
  }
  return null;
}
import { extractFeatures } from "@/lib/inference/mockEngine";
import { scoreConditions } from "@/lib/inference/scorer";
import { determineUrgency } from "@/lib/inference/triageRules";
import type { MediaAsset } from "@/lib/inference/types";

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
    const supabase = createServiceClient();

    // Load session
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("id, intake_data, status")
      .eq("id", sessionId)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found or expired" }, { status: 404 });
    }

    // Check if already analyzed
    const { data: existing } = await supabase
      .from("analysis_results")
      .select("id, urgency_level, urgency_reason, red_flags, condition_groups")
      .eq("session_id", sessionId)
      .single();

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
    const { data: assets } = await supabase
      .from("media_assets")
      .select("id, asset_type, storage_path, mime_type")
      .eq("session_id", sessionId);

    const intakeData = (session.intake_data ?? {}) as Record<string, unknown>;

    // Run inference pipeline
    const rawFeatures = await extractFeatures(sessionId, (assets ?? []) as MediaAsset[]);
    const conditionScores = scoreConditions(rawFeatures, intakeData);
    const urgencyResult = determineUrgency(conditionScores, intakeData, rawFeatures.visualSignals);

    // Persist results
    const { error: insertError } = await supabase.from("analysis_results").insert({
      session_id: sessionId,
      urgency_level: urgencyResult.level,
      urgency_reason: urgencyResult.reason,
      red_flags: urgencyResult.redFlags,
      condition_groups: conditionScores,
      raw_features: rawFeatures,
      engine_version: rawFeatures.engineVersion,
    });

    if (insertError) {
      return NextResponse.json({ error: "Failed to persist results" }, { status: 500 });
    }

    // Update session status
    await supabase
      .from("sessions")
      .update({ status: "analyzed" })
      .eq("id", sessionId);

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
