"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CameraPreview, type CameraPreviewHandle } from "@/components/capture/CameraPreview";
import { TaskOverlay } from "@/components/capture/TaskOverlay";
import { VideoRecorder, type VideoRecorderHandle } from "@/components/capture/VideoRecorder";
import { StepLayout } from "@/components/shared/StepLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSession } from "@/components/shared/SessionContext";
import { useMediaUpload } from "@/lib/hooks/useMediaUpload";
import { Mic, RefreshCw, Check } from "lucide-react";

const SCRIPT = "The rain in Spain stays mainly in the plain. She sells seashells by the seashore.";

export default function SpeechCapturePage() {
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
    const ok = await upload(blob, "video_speech");
    if (ok) router.push("/intake");
    else setError("Upload failed. Please try again.");
  }

  const stream = cameraRef.current?.getStream() ?? null;

  return (
    <StepLayout
      step={5}
      totalSteps={7}
      title="Read & speech test"
      subtitle="Read the sentence below aloud, clearly and at a natural pace. Your face and voice are both recorded."
    >
      <div className="space-y-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm font-medium text-blue-900 italic">"{SCRIPT}"</p>
          </CardContent>
        </Card>

        <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-black">
          {phase !== "review" ? (
            <>
              <CameraPreview
                ref={cameraRef}
                audio={true}
                className="absolute inset-0"
              />
              {phase === "recording" && (
                <>
                  <VideoRecorder
                    ref={recorderRef}
                    stream={stream}
                    onRecorded={handleRecorded}
                    maxSeconds={8}
                  />
                  <TaskOverlay
                    instruction="Read the sentence aloud"
                    subtext="Speak clearly and face the camera"
                    animate="none"
                  />
                </>
              )}
              {phase === "ready" && (
                <TaskOverlay instruction="Tap Record, then read the sentence aloud" animate="none" />
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
            <Mic className="h-4 w-4" /> Start recording (8s max)
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
              {uploading ? "Uploading…" : <><Check className="h-4 w-4" /> Use this recording</>}
            </Button>
          </div>
        )}
      </div>
    </StepLayout>
  );
}
