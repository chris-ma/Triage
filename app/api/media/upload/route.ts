import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { createSignedUploadUrl } from "@/lib/supabase/storage";
import type { AssetType } from "@/lib/inference/types";

function notConfigured() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: "Service not configured" }, { status: 503 });
  }
  return null;
}

const schema = z.object({
  sessionId: z.string().uuid(),
  assetType: z.enum([
    "photo_face",
    "photo_flash_1",
    "photo_flash_2",
    "photo_flash_3",
    "video_scan",
    "video_speech",
  ]),
  mimeType: z.string(),
  sizeBytes: z.number().optional(),
});

export async function POST(req: NextRequest) {
  const cfg = notConfigured();
  if (cfg) return cfg;
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { sessionId, assetType, mimeType, sizeBytes } = parsed.data;
    const supabase = createServiceClient();

    // Verify session exists and isn't expired
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("id")
      .eq("id", sessionId)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found or expired" }, { status: 404 });
    }

    const { signedUrl, path } = await createSignedUploadUrl(
      sessionId,
      assetType as AssetType,
      mimeType
    );

    const { data: asset, error: assetError } = await supabase
      .from("media_assets")
      .insert({
        session_id: sessionId,
        asset_type: assetType,
        storage_path: path,
        mime_type: mimeType,
        size_bytes: sizeBytes ?? null,
      })
      .select("id")
      .single();

    if (assetError || !asset) {
      return NextResponse.json({ error: "Failed to register media asset" }, { status: 500 });
    }

    return NextResponse.json({ signedUrl, assetId: asset.id, path }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
