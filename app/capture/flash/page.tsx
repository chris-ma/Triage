"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CameraPreview, type CameraPreviewHandle } from "@/components/capture/CameraPreview";
import { StepLayout } from "@/components/shared/StepLayout";
import { useSession } from "@/components/shared/SessionContext";
import { useMediaUpload } from "@/lib/hooks/useMediaUpload";
import type { AssetType } from "@/lib/inference/types";

const FLASH_ASSETS: AssetType[] = ["photo_flash_1", "photo_flash_2", "photo_flash_3"];

export default function FlashCapturePage() {
  const router = useRouter();
  const { sessionId } = useSession();
  const { upload } = useMediaUpload(sessionId);
  const cameraRef = useRef<CameraPreviewHandle>(null);
  const [status, setStatus] = useState<"waiting" | "countdown" | "flashing" | "done">("waiting");
  const [countdown, setCountdown] = useState(5);
  const [count, setCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function startCountdown() { setCountdown(5); setStatus("countdown"); }

  const runFlashSequence = useCallback(async () => {
    setStatus("flashing");
    setError(null);

    const originalBg = document.body.style.background;
    document.body.style.background = "#FFFFFF";
    await new Promise((r) => setTimeout(r, 300));

    const blobs: Blob[] = [];
    for (let i = 0; i < 3; i++) {
      await new Promise((r) => setTimeout(r, 400));
      const blob = await cameraRef.current?.capturePhoto();
      if (blob) blobs.push(blob);
      setCount(i + 1);
    }

    document.body.style.background = originalBg;

    for (let i = 0; i < blobs.length; i++) {
      const ok = await upload(blobs[i]!, FLASH_ASSETS[i]!);
      if (!ok) { setError("Upload failed. Please try again."); setStatus("waiting"); return; }
    }

    setStatus("done");
    setTimeout(() => router.push("/capture/scan"), 600);
  }, [upload, router]);

  useEffect(() => {
    if (status !== "countdown") return;
    if (countdown <= 0) { runFlashSequence(); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [status, countdown, runFlashSequence]);

  return (
    <StepLayout step={3} totalSteps={7} title="Screen-lit captures" subtitle="Hold still — the screen will flash and take 3 photos automatically.">
      <div className="space-y-3">
        <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-black">
          <CameraPreview ref={cameraRef} className="absolute inset-0" onReady={startCountdown} />

          {status === "countdown" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span
                key={countdown}
                className="text-white font-light drop-shadow-lg"
                style={{ fontSize: "6rem", lineHeight: 1 }}
              >
                {countdown > 0 ? countdown : ""}
              </span>
            </div>
          )}

          {status === "flashing" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/60 backdrop-blur-sm text-white rounded-2xl px-8 py-5 text-center">
                <p className="text-3xl font-light">{count} / 3</p>
                <p className="text-sm text-white/70 mt-1">Keep still…</p>
              </div>
            </div>
          )}

          {status === "done" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <p className="text-white text-lg font-light">Done ✓</p>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        <p className="text-xs text-gray-400 text-center">Maximise screen brightness beforehand. Look directly at the screen.</p>
      </div>
    </StepLayout>
  );
}
