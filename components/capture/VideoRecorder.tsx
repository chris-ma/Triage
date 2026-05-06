"use client";

import { useRef, useState, forwardRef, useImperativeHandle } from "react";

export interface VideoRecorderHandle {
  start: () => void;
  stop: () => void;
}

interface VideoRecorderProps {
  stream: MediaStream | null;
  onRecorded: (blob: Blob) => void;
  maxSeconds?: number;
}

export const VideoRecorder = forwardRef<VideoRecorderHandle, VideoRecorderProps>(
  ({ stream, onRecorded, maxSeconds = 10 }, ref) => {
    const recorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [recording, setRecording] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(maxSeconds);

    useImperativeHandle(ref, () => ({
      start: () => {
        if (!stream || recording) return;
        chunksRef.current = [];
        const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
          ? "video/webm;codecs=vp9"
          : "video/webm";
        const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 1_500_000 });
        recorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          onRecorded(blob);
        };

        recorder.start(100);
        setRecording(true);
        setSecondsLeft(maxSeconds);

        let elapsed = 0;
        const interval = setInterval(() => {
          elapsed++;
          setSecondsLeft(maxSeconds - elapsed);
          if (elapsed >= maxSeconds) {
            clearInterval(interval);
            recorder.stop();
            setRecording(false);
          }
        }, 1000);
        timerRef.current = interval as unknown as ReturnType<typeof setTimeout>;
      },
      stop: () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        recorderRef.current?.stop();
        setRecording(false);
      },
    }));

    if (!recording) return null;

    return (
      <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/70 text-white text-sm px-3 py-1.5 rounded-full">
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        {secondsLeft}s
      </div>
    );
  }
);
VideoRecorder.displayName = "VideoRecorder";
