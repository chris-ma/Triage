import { NextRequest, NextResponse } from "next/server";
import { gql, storageUpload } from "@/lib/nhost/client";
import type { AssetType } from "@/lib/inference/types";

function notConfigured() {
  if (!process.env.NHOST_GRAPHQL_URL || !process.env.NHOST_ADMIN_SECRET || !process.env.NHOST_STORAGE_URL) {
    return NextResponse.json({ error: "Service not configured" }, { status: 503 });
  }
  return null;
}

function extFromMime(mimeType: string): string {
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("video")) return "webm";
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("jpeg")) return "jpg";
  return "webp";
}

const VALID_ASSET_TYPES = new Set([
  "photo_face",
  "photo_flash_1",
  "photo_flash_2",
  "photo_flash_3",
  "video_scan",
  "video_speech",
]);

export async function POST(req: NextRequest) {
  const cfg = notConfigured();
  if (cfg) return cfg;
  try {
    const form = await req.formData();
    const sessionId = form.get("sessionId") as string | null;
    const assetType = form.get("assetType") as string | null;
    const file = form.get("file") as Blob | null;

    if (!sessionId || !assetType || !file) {
      return NextResponse.json({ error: "Missing sessionId, assetType, or file" }, { status: 400 });
    }

    if (!VALID_ASSET_TYPES.has(assetType)) {
      return NextResponse.json({ error: "Invalid assetType" }, { status: 400 });
    }

    const mimeType = file.type || "application/octet-stream";
    const ext = extFromMime(mimeType);
    const filename = `${sessionId}/${assetType}-${Date.now()}.${ext}`;

    // Verify session exists and isn't expired
    const { data: sessionData, error: sessionError } = await gql<{
      sessions_by_pk: { id: string } | null;
    }>(
      `query GetSession($id: uuid!, $now: timestamptz!) {
        sessions_by_pk(id: $id) { id }
      }`,
      { id: sessionId, now: new Date().toISOString() }
    );

    if (sessionError || !sessionData?.sessions_by_pk) {
      return NextResponse.json({ error: "Session not found or expired" }, { status: 404 });
    }

    // Upload file to Nhost Storage
    const stored = await storageUpload(file, filename);
    if (!stored) {
      return NextResponse.json({ error: "Storage upload failed" }, { status: 500 });
    }

    // Register media asset in DB
    const { data: assetData, error: assetError } = await gql<{
      insert_media_assets_one: { id: string } | null;
    }>(
      `mutation InsertMediaAsset($session_id: uuid!, $asset_type: String!, $storage_path: String!, $mime_type: String!, $size_bytes: bigint) {
        insert_media_assets_one(object: {
          session_id: $session_id
          asset_type: $asset_type
          storage_path: $storage_path
          mime_type: $mime_type
          size_bytes: $size_bytes
        }) { id }
      }`,
      {
        session_id: sessionId,
        asset_type: assetType as AssetType,
        storage_path: stored.id,
        mime_type: mimeType,
        size_bytes: file.size ?? null,
      }
    );

    if (assetError || !assetData?.insert_media_assets_one) {
      return NextResponse.json({ error: "Failed to register media asset" }, { status: 500 });
    }

    return NextResponse.json({ assetId: assetData.insert_media_assets_one.id }, { status: 201 });
  } catch (err) {
    console.error("[media/upload] error:", err);
    return NextResponse.json({ error: "Internal server error", detail: String(err) }, { status: 500 });
  }
}
