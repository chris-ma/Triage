import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { generateDoctorSummary } from "@/lib/claude/summaryGenerator";
import type { ConditionScore } from "@/lib/inference/types";

const schema = z.object({ sessionId: z.string().uuid() });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { sessionId } = parsed.data;
    const supabase = createServiceClient();

    // Check for cached summary
    const { data: cached } = await supabase
      .from("doctor_summaries")
      .select("summary_text, model_used")
      .eq("session_id", sessionId)
      .single();

    if (cached) {
      return NextResponse.json({ summaryText: cached.summary_text, cached: true });
    }

    // Load analysis results
    const { data: analysis, error: analysisError } = await supabase
      .from("analysis_results")
      .select("urgency_level, urgency_reason, red_flags, condition_groups, engine_version, created_at")
      .eq("session_id", sessionId)
      .single();

    if (analysisError || !analysis) {
      return NextResponse.json({ error: "Analysis not found — run analysis first" }, { status: 404 });
    }

    // Load session intake data
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("intake_data, created_at")
      .eq("id", sessionId)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found or expired" }, { status: 404 });
    }

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
    await supabase.from("doctor_summaries").insert({
      session_id: sessionId,
      summary_text: summaryText,
      model_used: modelUsed,
      prompt_hash: promptHash,
    });

    // Mark session complete
    await supabase
      .from("sessions")
      .update({ status: "complete" })
      .eq("id", sessionId);

    return NextResponse.json({ summaryText });
  } catch (err) {
    console.error("Summary error:", err);
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
  }
}
