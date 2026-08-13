import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { gql } from "@/lib/nhost/client";

function notConfigured() {
  if (!process.env.NHOST_GRAPHQL_URL || !process.env.NHOST_ADMIN_SECRET) {
    return NextResponse.json(
      { error: "Service not configured — set NHOST_GRAPHQL_URL and NHOST_ADMIN_SECRET in Vercel dashboard" },
      { status: 503 }
    );
  }
  return null;
}

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
  const cfg = notConfigured();
  if (cfg) return cfg;
  try {
    const body = await req.json();
    const parsed = createSessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await gql<{ insert_sessions_one: { id: string } | null }>(
      `mutation CreateSession($consented_at: timestamptz!, $consent_version: String!, $expires_at: timestamptz!) {
        insert_sessions_one(object: {
          consented_at: $consented_at
          consent_version: $consent_version
          status: "pending"
          expires_at: $expires_at
        }) { id }
      }`,
      {
        consented_at: parsed.data.consented_at,
        consent_version: parsed.data.consent_version,
        expires_at: expiresAt,
      }
    );

    if (error || !data?.insert_sessions_one) {
      console.error("[sessions POST] GraphQL error:", error);
      return NextResponse.json({ error: "Failed to create session", detail: error }, { status: 500 });
    }

    return NextResponse.json({ sessionId: data.insert_sessions_one.id }, { status: 201 });
  } catch (err) {
    console.error("[sessions POST] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error", detail: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const cfg = notConfigured();
  if (cfg) return cfg;
  try {
    const body = await req.json();
    const parsed = updateSessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { error } = await gql(
      `mutation UpdateSession($id: uuid!, $intake_data: jsonb!, $status: String!, $now: timestamptz!) {
        update_sessions(
          where: { id: { _eq: $id }, expires_at: { _gt: $now } }
          _set: { intake_data: $intake_data, status: $status }
        ) { affected_rows }
      }`,
      {
        id: parsed.data.sessionId,
        intake_data: parsed.data.intake_data,
        status: parsed.data.status ?? "captured",
        now: new Date().toISOString(),
      }
    );

    if (error) {
      return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
