import { NextResponse } from "next/server";

const TABLES = ["sessions", "media_assets", "analysis_results", "doctor_summaries"];

const CREATE_SQL = `
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  consented_at timestamptz NOT NULL,
  consent_version text NOT NULL DEFAULT '1.0',
  intake_data jsonb,
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS media_assets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  asset_type text NOT NULL,
  storage_path text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analysis_results (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  urgency_level text NOT NULL,
  urgency_reason text,
  red_flags jsonb DEFAULT '[]',
  condition_groups jsonb DEFAULT '[]',
  raw_features jsonb,
  engine_version text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS doctor_summaries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  summary_text text NOT NULL,
  model_used text,
  prompt_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);
`;

export async function GET() {
  const graphqlUrl = process.env.NHOST_GRAPHQL_URL;
  const adminSecret = process.env.NHOST_ADMIN_SECRET;

  if (!graphqlUrl || !adminSecret) {
    return NextResponse.json(
      { error: "NHOST_GRAPHQL_URL and NHOST_ADMIN_SECRET must be set in Vercel env vars" },
      { status: 503 }
    );
  }

  // Derive base Hasura URL from GraphQL URL
  // e.g. https://xxx.hasura.ap-southeast-1.nhost.run/v1/graphql → https://xxx.hasura.ap-southeast-1.nhost.run
  const baseUrl = graphqlUrl.replace(/\/v1\/graphql$/, "");

  // Step 1: create tables via Hasura SQL API
  const sqlRes = await fetch(`${baseUrl}/v2/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": adminSecret,
    },
    body: JSON.stringify({
      type: "run_sql",
      args: { source: "default", sql: CREATE_SQL, cascade: false, read_only: false },
    }),
  });

  if (!sqlRes.ok) {
    const body = await sqlRes.text();
    return NextResponse.json({ error: "SQL failed", detail: body }, { status: 500 });
  }

  // Step 2: track each table in Hasura so they appear in the GraphQL schema
  const trackErrors: string[] = [];
  for (const table of TABLES) {
    const res = await fetch(`${baseUrl}/v1/metadata`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hasura-admin-secret": adminSecret,
      },
      body: JSON.stringify({
        type: "pg_track_table",
        args: { source: "default", table: { name: table, schema: "public" } },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      // "already tracked" is fine — skip it
      if (!body.includes("already tracked") && !body.includes("already exists")) {
        trackErrors.push(`${table}: ${body.slice(0, 200)}`);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    message: "Tables created and tracked successfully",
    tables: TABLES,
    trackErrors: trackErrors.length ? trackErrors : null,
  });
}
