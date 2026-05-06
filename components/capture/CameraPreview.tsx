"use client";

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";

export interface CameraPreviewHandle {
  capturePhoto: () => Promise<Blob | null>;
  getStream: () => MediaStream | null;
  videoEl: HTMLVideoElement | null;
}

interface CameraPreviewProps {
  audio?: boolean;
  onReady?: () => void;
  onError?: (err: string) => void;
  className?: string;
}

export const CameraPreview = forwardRef<CameraPreviewHandle, CameraPreviewProps>(
  ({ audio = false, onReady, onError, className }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [status, setStatus] = useState<"initialising" | "ready" | "error">("initialising");

    useImperativeHandle(ref, () => ({
      capturePhoto: async () => {
        const video = videoRef.current;
        if (!video) return null;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d")!.drawImage(video, 0, 0);
        return new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/webp", 0.92)
        );
      },
      getStream: () => streamRef.current,
      videoEl: videoRef.current,
    }));

    useEffect(() => {
      let active = true;
      (async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
            audio,
          });
          if (!active) { stream.getTracks().forEach((t) => t.stop()); return; }
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
          }
          setStatus("ready");
          onReady?.();
        } catch (err) {
          if (!active) return;
          setStatus("error");
          onError?.((err as Error).message);
        }
      })();
      return () => {
        active = false;
        streamRef.current?.getTracks().forEach((t) => t.stop());
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [audio]);

    return (
      <div className={`relative overflow-hidden rounded-xl bg-black ${className ?? ""}`}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          aria-label="Camera preview"
        />
        {status === "initialising" && (
          <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
            Starting camera…
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white text-sm p-4 text-center">
            Camera unavailable. Please allow camera access and use Chrome or Firefox.
          </div>
        )}
      </div>
    );
  }
);
CameraPreview.displayName = "CameraPreview";
