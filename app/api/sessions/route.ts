import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";

const createSessionSchema = z.object({
  consented_at: z.string(),
  consent_version: z.string().default("1.0"),
});

const updateSessionSchema = z.object({
  sessionId: z.string().uuid(),
  intake_data: z.record(z.string(), z.unknown()),
  status: z.enum(["pending", "captured", "analyzed", "complete", "abandoned"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createSessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("sessions")
      .insert({
        consented_at: parsed.data.consented_at,
        consent_version: parsed.data.consent_version,
        status: "pending",
      })
      .select("id")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }

    return NextResponse.json({ sessionId: data.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = updateSessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { error } = await supabase
      .from("sessions")
      .update({
        intake_data: parsed.data.intake_data,
        status: parsed.data.status ?? "captured",
      })
      .eq("id", parsed.data.sessionId)
      .gt("expires_at", new Date().toISOString());

    if (error) {
      return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
