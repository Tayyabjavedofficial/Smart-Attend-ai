"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, RefreshCw, VideoOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Props {
  /** Called with a base64 JPEG data URL when the user captures a frame. */
  onCapture: (dataUrl: string) => void;
  /** Optional: called when the captured image is cleared (retake). */
  onClear?: () => void;
  captureLabel?: string;
}

/**
 * Live webcam preview + still capture. Requests the camera via getUserMedia,
 * draws the current frame to a canvas, and emits a compressed JPEG data URL.
 * Stops the camera track on unmount and after capture to release the device.
 */
export function WebcamCapture({ onCapture, onClear, captureLabel = "Capture" }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<"idle" | "starting" | "live" | "denied" | "error" | "unsupported">("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    setErrorMsg("");
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      return;
    }
    setStatus("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setStatus("live");
    } catch (e: unknown) {
      const name = (e as { name?: string })?.name;
      if (name === "NotAllowedError" || name === "SecurityError") {
        setStatus("denied");
      } else {
        setStatus("error");
        setErrorMsg(name === "NotFoundError" ? "No camera found on this device." : "Could not access the camera.");
      }
    }
  }, []);

  useEffect(() => {
    start();
    return () => stop();
  }, [start, stop]);

  const capture = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    const canvas = document.createElement("canvas");
    // Keep it modest so the base64 payload stays small.
    const maxW = 480;
    const scale = Math.min(1, maxW / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setPreview(dataUrl);
    stop();
    onCapture(dataUrl);
  };

  const retake = () => {
    setPreview(null);
    onClear?.();
    start();
  };

  return (
    <div className="space-y-3">
      <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-ink-900 relative grid place-items-center">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Captured" className="size-full object-cover" />
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className="size-full object-cover"
              style={{ transform: "scaleX(-1)" }}  // mirror like a selfie
            />
            {status !== "live" ? (
              <div className="absolute inset-0 grid place-items-center text-center px-6 bg-ink-900/80">
                {status === "starting" ? (
                  <div className="text-white/70">
                    <Loader2 className="size-7 animate-spin mx-auto mb-2" />
                    <p className="text-sm">Starting camera…</p>
                  </div>
                ) : status === "denied" ? (
                  <div className="text-white/80">
                    <VideoOff className="size-7 mx-auto mb-2 text-rose-300" />
                    <p className="text-sm font-medium">Camera permission denied</p>
                    <p className="text-xs text-white/50 mt-1">Allow camera access in your browser&apos;s site settings, then retry.</p>
                    <Button variant="secondary" size="sm" className="mt-3" onClick={start}>Retry</Button>
                  </div>
                ) : status === "unsupported" ? (
                  <div className="text-white/80">
                    <VideoOff className="size-7 mx-auto mb-2" />
                    <p className="text-sm">Camera not supported in this browser.</p>
                  </div>
                ) : status === "error" ? (
                  <div className="text-white/80">
                    <VideoOff className="size-7 mx-auto mb-2 text-amber-300" />
                    <p className="text-sm">{errorMsg}</p>
                    <Button variant="secondary" size="sm" className="mt-3" onClick={start}>Retry</Button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </div>

      <div className="flex gap-2">
        {preview ? (
          <Button variant="secondary" className="flex-1" onClick={retake}>
            <RefreshCw className="size-4" /> Retake
          </Button>
        ) : (
          <Button className="flex-1" onClick={capture} disabled={status !== "live"}>
            <Camera className="size-4" /> {captureLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
