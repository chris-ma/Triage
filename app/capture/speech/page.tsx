"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CameraPreview, type CameraPreviewHandle } from "@/components/capture/CameraPreview";
import { TaskOverlay } from "@/components/capture/TaskOverlay";
import { VideoRecorder, type VideoRecorderHandle } from "@/components/capture/VideoRecorder";
import { StepLayout } from "@/components/shared/StepLayout";
import { useSession } from "@/components/shared/SessionContext";
import { useMediaUpload } from "@/lib/hooks/useMediaUpload";
import { RefreshCw, Check, Square } from "lucide-react";

const SCRIPT = "The rain in Spain stays mainly in the plain. She sells seashells by the seashore.";

export default function SpeechCapturePage() {
  const router = useRouter();
  const { sessionId } = useSession();
  const { upload, uploading, error: uploadError } = useMediaUpload(sessionId);
  const cameraRef = useRef<CameraPreviewHandle>(null);
  const recorderRef = useRef<VideoRecorderHandle>(null);
  const [phase, setPhase] = useState<"ready" | "countdown" | "recording" | "review">("ready");
  const [countdown, setCountdown] = useState(5);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function startCountdown() { setCountdown(5); setPhase("countdown"); }

  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) { recorderRef.current?.start(); setPhase("recording"); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  function handleRecorded(recorded: Blob) {
    setBlob(recorded);
    setPreviewUrl(URL.createObjectURL(recorded));
    setPhase("review");
  }

  async function confirm() {
    if (!blob) return;
    const ok = await upload(blob, "video_speech");
    if (ok) router.push("/intake");
    else setError("Upload failed. Please try again.");
  }

  const stream = cameraRef.current?.getStream() ?? null;

  return (
    <StepLayout step={5} totalSteps={7} title="Read & speech test" subtitle="Read the sentence aloud, then tap the screen to start recording.">
      <div className="space-y-3">
        {/* Script card — stays above fold */}
        <div className="rounded-xl border border-gray-100 bg-white px-4 py-3">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gray-400 mb-1">Read aloud</p>
          <p className="text-sm text-gray-700 italic leading-relaxed">"{SCRIPT}"</p>
        </div>

        <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-black">
          {phase !== "review" ? (
            <>
              <CameraPreview ref={cameraRef} audio={true} className="absolute inset-0" />

              {phase === "recording" && (
                <>
                  <VideoRecorder ref={recorderRef} stream={stream} onRecorded={handleRecorded} maxSeconds={8} />
                  <TaskOverlay instruction="Read the sentence aloud" subtext="Speak clearly and face the camera" animate="none" />
                  <button
                    onClick={() => recorderRef.current?.stop()}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                    aria-label="Stop recording"
                  >
                    <span className="text-[11px] tracking-widest uppercase text-white/60 select-none">Tap to stop</span>
                    <span className="h-16 w-16 rounded-full border-4 border-red-400/80 bg-red-500/20 backdrop-blur-sm flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                      <Square className="h-6 w-6 text-red-300 fill-red-300" />
                    </span>
                  </button>
                </>
              )}

              {phase === "countdown" && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span
                    key={countdown}
                    className="text-white font-light drop-shadow-lg"
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
                  aria-label="Start recording"
                >
                  <span className="text-[11px] tracking-widest uppercase text-white/60 mb-3 select-none">Tap to record</span>
                  <span className="h-16 w-16 rounded-full border-4 border-white/80 bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                    <span className="h-6 w-6 rounded-full bg-red-400" />
                  </span>
                </button>
              )}
            </>
          ) : (
            <>
              {previewUrl && <video src={previewUrl} className="w-full h-full object-cover" controls playsInline />}
              <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3 px-6">
                <button
                  onClick={() => { setBlob(null); setPreviewUrl(null); setPhase("ready"); }}
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
      </div>
    </StepLayout>
  );
}
