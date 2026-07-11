import type { RecordingState } from "../types/move-map";
import { RECORDING_SOFT_LIMIT_SECONDS } from "../hooks/useRecording";

function formatMMSS(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export type RecordingControlsProps = {
  recordingState: RecordingState;
  durationSeconds: number;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  supported?: boolean;
  error?: string | null;
};

const STATUS_TEXT: Record<RecordingState, string> = {
  idle: "Idle",
  preparing: "Preparing to record",
  recording: "Recording in progress",
  paused: "Recording paused",
  stopped: "Recording stopped",
  transcribing: "Transcribing audio",
  done: "Recording saved",
  error: "Recording error",
};

export function RecordingControls({
  recordingState,
  durationSeconds,
  onStart,
  onStop,
  onPause,
  onResume,
  supported = true,
  error = null,
}: RecordingControlsProps) {
  const isRecording = recordingState === "recording";
  const isPaused = recordingState === "paused";
  const isActive = isRecording || isPaused;
  const isBusy = recordingState === "preparing" || recordingState === "transcribing";
  const busyLabel =
    recordingState === "transcribing" ? "Transcribing…" : "Preparing…";
  const isOverLimit = isActive && durationSeconds > RECORDING_SOFT_LIMIT_SECONDS;
  const statusText = STATUS_TEXT[recordingState];

  if (!supported) {
    return (
      <div className="recording-controls recording-unsupported">
        <span className="recording-dot is-off" aria-hidden="true" />
        <span>Audio recording isn&apos;t supported in this browser.</span>
      </div>
    );
  }

  return (
    <div className="recording-controls">
      {isActive && (
        <span
          className={`recording-dot ${isRecording ? "is-live" : "is-paused"}`}
          aria-hidden="true"
        />
      )}
      <span className="recording-timer" aria-live="polite">
        {formatMMSS(durationSeconds)}
      </span>

      <button
        type="button"
        onClick={onStart}
        disabled={isActive || isBusy}
        aria-label={isBusy ? busyLabel : "Start recording"}
      >
        {isBusy ? busyLabel : "Record"}
      </button>
      <button
        type="button"
        onClick={isPaused ? onResume : onPause}
        disabled={!isActive}
        aria-label={isPaused ? "Resume recording" : "Pause recording"}
      >
        {isPaused ? "Resume" : "Pause"}
      </button>
      <button
        type="button"
        onClick={onStop}
        disabled={!isActive}
        aria-label="Stop recording"
      >
        Stop
      </button>

      {/* Polite live region so screen readers hear status changes. */}
      <span className="sr-only" role="status" aria-live="polite">
        {statusText}
      </span>

      {error && (
        <div className="mic-error-banner" role="alert">
          {error}
        </div>
      )}

      {isOverLimit && (
        <div className="recording-warning" role="status">
          Recording is long — consider stopping
        </div>
      )}
    </div>
  );
}

