"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CameraPreview, type CameraPreviewHandle } from "@/components/capture/CameraPreview";
import { TaskOverlay } from "@/components/capture/TaskOverlay";
import { VideoRecorder, type VideoRecorderHandle } from "@/components/capture/VideoRecorder";
import { StepLayout } from "@/components/shared/StepLayout";
import { Button } from "@/components/ui/button";
import { useSession } from "@/components/shared/SessionContext";
import { useMediaUpload } from "@/lib/hooks/useMediaUpload";
import { Video, RefreshCw, Check } from "lucide-react";

export default function ScanCapturePage() {
  const router = useRouter();
  const { sessionId } = useSession();
  const { upload, uploading, error: uploadError } = useMediaUpload(sessionId);
  const cameraRef = useRef<CameraPreviewHandle>(null);
  const recorderRef = useRef<VideoRecorderHandle>(null);
  const [phase, setPhase] = useState<"ready" | "recording" | "review">("ready");
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function startRecording() {
    recorderRef.current?.start();
    setPhase("recording");
  }

  function handleRecorded(recorded: Blob) {
    setBlob(recorded);
    setPreviewUrl(URL.createObjectURL(recorded));
    setPhase("review");
  }

  function retake() {
    setBlob(null);
    setPreviewUrl(null);
    setPhase("ready");
  }

  async function confirm() {
    if (!blob) return;
    const ok = await upload(blob, "video_scan");
    if (ok) router.push("/capture/speech");
    else setError("Upload failed. Please try again.");
  }

  const stream = cameraRef.current?.getStream() ?? null;

  return (
    <StepLayout
      step={4}
      totalSteps={7}
      title="Ear-to-ear scan"
      subtitle="Record yourself slowly turning your head from left to right and back. Keep a steady pace."
    >
      <div className="space-y-4">
        <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-black">
          {phase !== "review" ? (
            <>
              <CameraPreview
                ref={cameraRef}
                className="absolute inset-0"
                onReady={() => {}}
              />
              {phase === "recording" && (
                <>
                  <VideoRecorder
                    ref={recorderRef}
                    stream={stream}
                    onRecorded={handleRecorded}
                    maxSeconds={10}
                  />
                  <TaskOverlay
                    instruction="Slowly turn head left → right → left"
                    subtext="Keep your eyes facing the camera"
                    animate="arrow-left"
                  />
                </>
              )}
              {phase === "ready" && (
                <TaskOverlay
                  instruction="When ready, tap Record and slowly turn your head"
                  animate="none"
                />
              )}
            </>
          ) : (
            previewUrl && (
              <video
                src={previewUrl}
                className="w-full h-full object-cover"
                controls
                playsInline
              />
            )
          )}
        </div>

        {(error || uploadError) && (
          <p className="text-sm text-red-600">{error ?? uploadError}</p>
        )}

        {phase === "ready" && (
          <Button className="w-full gap-2" onClick={startRecording}>
            <Video className="h-4 w-4" /> Start recording (10s max)
          </Button>
        )}
        {phase === "recording" && (
          <Button variant="destructive" className="w-full" onClick={() => recorderRef.current?.stop()}>
            Stop recording
          </Button>
        )}
        {phase === "review" && (
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 gap-2" onClick={retake}>
              <RefreshCw className="h-4 w-4" /> Retake
            </Button>
            <Button className="flex-1 gap-2" onClick={confirm} disabled={uploading}>
              {uploading ? "Uploading…" : <><Check className="h-4 w-4" /> Use this video</>}
            </Button>
          </div>
        )}
      </div>
    </StepLayout>
  );
}
