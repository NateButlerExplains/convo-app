import { useCallback, useEffect, useRef, useState } from "react";
import { AudioRecorder } from "../lib/audio-recorder";
import { saveAudio, saveAudioMeta } from "../lib/audio-store";
import type { RecordedAudio, RecordingState } from "../types/move-map";

function isRecordingSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices?.getUserMedia === "function"
  );
}

function newRecordingId(): string {
  return `rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export type UseRecording = {
  supported: boolean;
  recordingState: RecordingState;
  durationSeconds: number;
  stream: MediaStream | null;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
};

export function useRecording(): UseRecording {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);

  const supported = isRecordingSupported();

  // Tick the duration while actively recording (paused state freezes the clock).
  useEffect(() => {
    if (recordingState !== "recording") return;
    const timer = window.setInterval(() => {
      setDurationSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [recordingState]);

  // Release the mic if the component unmounts mid-recording (prevents leak).
  useEffect(() => {
    return () => {
      recorderRef.current?.stop();
      recorderRef.current = null;
      setStream(null);
    };
  }, []);

  const startRecording = useCallback(async () => {
    if (!supported) return;
    setError(null);
    setDurationSeconds(0);
    setRecordingState("preparing");

    const recorder = new AudioRecorder({
      onStop: async (_blob, _durationMs) => {
        const id = newRecordingId();
        const meta: RecordedAudio = {
          id,
          mimeType: _blob.type,
          durationSeconds: Math.max(0, Math.round(_durationMs / 1000)),
          createdAt: new Date().toISOString(),
          dbKey: id,
        };
        setRecordingState("stopped");
        try {
          await saveAudio(id, _blob);
          await saveAudioMeta(meta);
          setRecordingState("done");
        } catch (e) {
          setError(e instanceof Error ? e.message : "Failed to save recording");
          setRecordingState("error");
        } finally {
          setStream(null);
        }
      },
      onError: (err) => {
        setError(err instanceof Error ? err.message : "Recording error");
        setRecordingState("error");
        setStream(null);
      },
    });

    recorderRef.current = recorder;

    try {
      await recorder.start();
      setRecordingState("recording");
      setStream(recorder.getStream());
    } catch (e) {
      recorderRef.current = null;
      setStream(null);
      setError(describeStartError(e));
      setRecordingState("error");
    }
  }, [supported]);

// Map a getUserMedia failure to a user-facing message.
function describeStartError(e: unknown): string {
  const err = e instanceof Error ? e : new Error("Could not start recording");
  if (
    err.name === "NotAllowedError" ||
    err.name === "SecurityError" ||
    err.name === "PermissionDeniedError"
  ) {
    return "Microphone access denied — enable in browser settings";
  }
  if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
    return "No microphone found — connect a mic and try again";
  }
  if (err.name === "NotReadableError" || err.name === "TrackStartError") {
    return "Microphone is busy or unavailable — close other apps using it";
  }
  return err.message || "Could not start recording";
}

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setStream(null);
  }, []);

  const pauseRecording = useCallback(() => {
    recorderRef.current?.pause();
    setRecordingState("paused");
  }, []);

  const resumeRecording = useCallback(() => {
    recorderRef.current?.resume();
    setRecordingState("recording");
  }, []);

  return {
    supported,
    recordingState,
    durationSeconds,
    stream,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
  };
}

// 60-minute soft limit (in seconds).
export const RECORDING_SOFT_LIMIT_SECONDS = 60 * 60;
