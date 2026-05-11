"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CameraPreview, type CameraPreviewHandle } from "@/components/capture/CameraPreview";
import { FaceOvalGuide } from "@/components/capture/FaceOvalGuide";
import { StepLayout } from "@/components/shared/StepLayout";
import { useSession } from "@/components/shared/SessionContext";
import { useMediaUpload } from "@/lib/hooks/useMediaUpload";
import { RefreshCw, Check } from "lucide-react";

export default function FaceCapturePage() {
  const router = useRouter();
  const { sessionId } = useSession();
  const { upload, uploading, error: uploadError } = useMediaUpload(sessionId);
  const cameraRef = useRef<CameraPreviewHandle>(null);
  const [phase, setPhase] = useState<"ready" | "countdown" | "review">("ready");
  const [countdown, setCountdown] = useState(5);
  const [preview, setPreview] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  function startCountdown() {
    setCountdown(5);
    setPhase("countdown");
  }

  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      doCapture();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  async function doCapture() {
    setError(null);
    const blob = await cameraRef.current?.capturePhoto();
    if (!blob) { setError("Capture failed. Please try again."); setPhase("ready"); return; }
    setCapturedBlob(blob);
    setPreview(URL.createObjectURL(blob));
    setPhase("review");
  }

  async function confirm() {
    if (!capturedBlob) return;
    const ok = await upload(capturedBlob, "photo_face");
    if (ok) router.push("/capture/flash");
  }

  return (
    <StepLayout step={2} totalSteps={7} title="Face-on photo" subtitle="Position your face within the oval and tap the screen to capture.">
      <div className="space-y-3">
        <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-black">
          {phase !== "review" ? (
            <>
              <CameraPreview ref={cameraRef} className="absolute inset-0" />
              <FaceOvalGuide />

              {phase === "countdown" && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span
                    key={countdown}
                    className="text-white font-light drop-shadow-lg animate-ping-once"
                    style={{ fontSize: "6rem", lineHeight: 1 }}
                  >
                    {countdown === 0 ? "" : countdown}
                  </span>
                </div>
              )}

              {phase === "ready" && (
                <button
                  onClick={startCountdown}
                  className="absolute inset-0 w-full h-full flex flex-col items-center justify-end pb-8"
                  aria-label="Start countdown"
                >
                  <span className="text-[11px] tracking-widest uppercase text-white/60 mb-3 select-none">Tap to capture</span>
                  <span className="h-16 w-16 rounded-full border-4 border-white/80 bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                    <span className="h-11 w-11 rounded-full bg-white/90" />
                  </span>
                </button>
              )}
            </>
          ) : (
            <>
              <img src={preview!} alt="Captured" className="w-full h-full object-cover" />
              <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3 px-6">
                <button
                  onClick={() => { setPreview(null); setCapturedBlob(null); setPhase("ready"); }}
                  className="flex-1 flex items-center justify-center gap-2 rounded-full bg-black/50 backdrop-blur-sm py-3 text-sm text-white"
                >
                  <RefreshCw className="h-4 w-4" /> Retake
                </button>
                <button
                  onClick={confirm}
                  disabled={uploading}
                  className="flex-1 flex items-center justify-center gap-2 rounded-full bg-white py-3 text-sm font-medium text-gray-900 disabled:opacity-50"
                >
                  {uploading ? "Uploading…" : <><Check className="h-4 w-4" /> Use this</>}
                </button>
              </div>
            </>
          )}
        </div>

        {(error || uploadError) && <p className="text-sm text-red-500">{error ?? uploadError}</p>}
        <p className="text-xs text-gray-400 text-center">Good lighting matters. Face a window or bright lamp if possible.</p>
      </div>
    </StepLayout>
  );
}
