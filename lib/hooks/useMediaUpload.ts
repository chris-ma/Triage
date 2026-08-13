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
      const form = new FormData();
      form.append("sessionId", sessionId);
      form.append("assetType", assetType);
      form.append("file", blob);

      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(body.error ?? `Upload failed (${res.status})`);
      }

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
