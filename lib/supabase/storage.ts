import { createServiceClient } from "./server";
import type { AssetType } from "@/lib/inference/types";

export async function createSignedUploadUrl(
  sessionId: string,
  assetType: AssetType,
  mimeType: string
): Promise<{ signedUrl: string; path: string }> {
  const supabase = createServiceClient();
  const ext = mimeType.includes("video") ? "webm" : mimeType.includes("png") ? "png" : mimeType.includes("jpeg") ? "jpg" : "webp";
  const path = `${sessionId}/${assetType}-${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from("media")
    .createSignedUploadUrl(path);

  if (error || !data) {
    throw new Error(`Failed to create signed URL: ${error?.message}`);
  }

  return { signedUrl: data.signedUrl, path };
}

export async function deleteSessionMedia(sessionId: string): Promise<void> {
  const supabase = createServiceClient();
  const { data: files } = await supabase.storage.from("media").list(sessionId);
  if (files && files.length > 0) {
    const paths = files.map((f) => `${sessionId}/${f.name}`);
    await supabase.storage.from("media").remove(paths);
  }
}
