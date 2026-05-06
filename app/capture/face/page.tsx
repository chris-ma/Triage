"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CameraPreview, type CameraPreviewHandle } from "@/components/capture/CameraPreview";
import { FaceOvalGuide } from "@/components/capture/FaceOvalGuide";
import { StepLayout } from "@/components/shared/StepLayout";
import { Button } from "@/components/ui/button";
import { useSession } from "@/components/shared/SessionContext";
import { useMediaUpload } from "@/lib/hooks/useMediaUpload";
import { Camera, RefreshCw, Check } from "lucide-react";

export default function FaceCapturePage() {
  const router = useRouter();
  const { sessionId } = useSession();
  const { upload, uploading, error: uploadError } = useMediaUpload(sessionId);
  const cameraRef = useRef<CameraPreviewHandle>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function capture() {
    setError(null);
    const blob = await cameraRef.current?.capturePhoto();
    if (!blob) { setError("Capture failed. Please try again."); return; }
    setCapturedBlob(blob);
    setPreview(URL.createObjectURL(blob));
  }

  async function confirm() {
    if (!capturedBlob) return;
    const ok = await upload(capturedBlob, "photo_face");
    if (ok) router.push("/capture/flash");
  }

  function retake() {
    setPreview(null);
    setCapturedBlob(null);
  }

  return (
    <StepLayout
      step={2}
      totalSteps={7}
      title="Face-on photo"
      subtitle="Position your face within the oval. Look directly at the camera with a neutral expression."
    >
      <div className="space-y-4">
        <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-black">
          {!preview ? (
            <>
              <CameraPreview ref={cameraRef} className="absolute inset-0" />
              <FaceOvalGuide />
            </>
          ) : (
            <img src={preview} alt="Captured" className="w-full h-full object-cover" />
          )}
        </div>

        {(error || uploadError) && (
          <p className="text-sm text-red-600">{error ?? uploadError}</p>
        )}

        {!preview ? (
          <Button className="w-full gap-2" onClick={capture}>
            <Camera className="h-4 w-4" /> Take photo
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 gap-2" onClick={retake}>
              <RefreshCw className="h-4 w-4" /> Retake
            </Button>
            <Button className="flex-1 gap-2" onClick={confirm} disabled={uploading}>
              {uploading ? "Uploading…" : <><Check className="h-4 w-4" /> Use this photo</>}
            </Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Good lighting matters. Face a window or a bright lamp if possible.
        </p>
      </div>
    </StepLayout>
  );
}
