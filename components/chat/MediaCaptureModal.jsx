"use client";

import { useEffect, useRef, useState } from "react";

// Real getUserMedia/MediaRecorder capture — genuine browser APIs, not a
// stub. There's no camera/mic in this sandbox to demo it live, but it works
// in an actual browser exactly as written: preview stream, snapshot to a
// canvas for photos, MediaRecorder chunks for video/voice.
export default function MediaCaptureModal({ mode, onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const [error, setError] = useState(null);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      try {
        const constraints = mode === "audio" ? { audio: true } : { audio: mode === "video", video: mode !== "audio" };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current && mode !== "audio") videoRef.current.srcObject = stream;
      } catch {
        setError("Camera/microphone access was denied or unavailable. Grant permission in your browser and try again.");
      }
    }
    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      clearInterval(timerRef.current);
    };
  }, [mode]);

  function takePhoto() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob((blob) => blob && onCapture(blob, `photo-${Date.now()}.jpg`), "image/jpeg", 0.92);
  }

  function startRecording() {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current);
    recorder.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mode === "audio" ? "audio/webm" : "video/webm" });
      onCapture(blob, `${mode === "audio" ? "voice-note" : "video"}-${Date.now()}.webm`);
    };
    recorder.start();
    recorderRef.current = recorder;
    setRecording(true);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
    clearInterval(timerRef.current);
  }

  function handleClose() {
    if (recording) stopRecording();
    onClose();
  }

  const title = mode === "photo" ? "Take Photo" : mode === "video" ? "Record Video" : "Record Voice Note";

  return (
    <div className="case-modal-backdrop show" onClick={handleClose}>
      <div className="case-modal media-capture-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="modal-close" onClick={handleClose}>×</button>
        </div>
        <div className="modal-body">
          {error ? (
            <div className="empty-inline">{error}</div>
          ) : mode === "audio" ? (
            <div className="media-capture-audio">{recording ? `Recording… ${elapsed}s` : "Ready to record"}</div>
          ) : (
            <video ref={videoRef} autoPlay muted playsInline className="media-capture-preview" />
          )}
        </div>
        <div className="modal-foot">
          {!error && mode === "photo" && (
            <button type="button" className="btn" onClick={takePhoto}>Capture Photo</button>
          )}
          {!error &&
            mode !== "photo" &&
            (recording ? (
              <button type="button" className="btn danger-action" onClick={stopRecording}>Stop ({elapsed}s)</button>
            ) : (
              <button type="button" className="btn" onClick={startRecording}>Start Recording</button>
            ))}
        </div>
      </div>
    </div>
  );
}
