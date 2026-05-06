"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CameraPreview, type CameraPreviewHandle } from "@/components/capture/CameraPreview";
import { StepLayout } from "@/components/shared/StepLayout";
import { Button } from "@/components/ui/button";
import { useSession } from "@/components/shared/SessionContext";
import { useMediaUpload } from "@/lib/hooks/useMediaUpload";
import { Zap } from "lucide-react";
import type { AssetType } from "@/lib/inference/types";

const FLASH_ASSETS: AssetType[] = ["photo_flash_1", "photo_flash_2", "photo_flash_3"];

export default function FlashCapturePage() {
  const router = useRouter();
  const { sessionId } = useSession();
  const { upload, uploading } = useMediaUpload(sessionId);
  const cameraRef = useRef<CameraPreviewHandle>(null);
  const [status, setStatus] = useState<"ready" | "flashing" | "done">("ready");
  const [count, setCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const runFlashSequence = useCallback(async () => {
    setStatus("flashing");
    setError(null);

    // Set background white for illumination
    const originalBg = document.body.style.background;
    document.body.style.background = "#FFFFFF";

    await new Promise((r) => setTimeout(r, 300)); // let screen adjust

    const blobs: Blob[] = [];
    for (let i = 0; i < 3; i++) {
      await new Promise((r) => setTimeout(r, 400));
      const blob = await cameraRef.current?.capturePhoto();
      if (blob) blobs.push(blob);
      setCount(i + 1);
    }

    document.body.style.background = originalBg;

    // Upload all three
    for (let i = 0; i < blobs.length; i++) {
      const ok = await upload(blobs[i]!, FLASH_ASSETS[i]!);
      if (!ok) { setError("Upload failed. Please try again."); setStatus("ready"); return; }
    }

    setStatus("done");
    setTimeout(() => router.push("/capture/scan"), 600);
  }, [upload, router]);

  return (
    <StepLayout
      step={3}
      totalSteps={7}
      title="Screen-lit captures"
      subtitle="When you tap the button, your screen will flash white and take 3 quick photos to capture skin colour accurately."
    >
      <div className="space-y-4">
        <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-black">
          <CameraPreview ref={cameraRef} className="absolute inset-0" />
          {status === "flashing" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/70 text-white rounded-xl px-6 py-4 text-center">
                <p className="text-2xl font-bold">{count} / 3</p>
                <p className="text-sm mt-1">Keep still…</p>
              </div>
            </div>
          )}
          {status === "done" && (
            <div className="absolute inset-0 flex items-center justify-center bg-green-900/80 text-white text-lg font-semibold">
              Done!
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button
          className="w-full gap-2"
          onClick={runFlashSequence}
          disabled={status !== "ready" || uploading}
        >
          <Zap className="h-4 w-4" />
          {status === "ready" ? "Start flash capture" : status === "flashing" ? "Capturing…" : "Uploading…"}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Look directly at the screen. Maximise your screen brightness beforehand for best results.
        </p>
      </div>
    </StepLayout>
  );
}
