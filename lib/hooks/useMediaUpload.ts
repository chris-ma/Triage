"use client";

import { useState } from "react";
import type { AssetType } from "@/lib/inference/types";

export function useMediaUpload(sessionId: string | null) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(blob: Blob, assetType: AssetType): Promise<boolean> {
    if (!sessionId) { setError("No session found — please start again."); return false; }
    setUploading(true);
    setError(null);
    try {
      // Get signed URL
      const res = await fetch("/api/media/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          assetType,
          mimeType: blob.type,
          sizeBytes: blob.size,
        }),
      });
      if (!res.ok) throw new Error("Failed to get upload URL");
      const { signedUrl } = await res.json();

      // Upload blob directly to Supabase Storage
      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        body: blob,
        headers: { "Content-Type": blob.type },
      });
      if (!uploadRes.ok) throw new Error("Upload failed");
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setUploading(false);
    }
  }

  return { upload, uploading, error };
}
