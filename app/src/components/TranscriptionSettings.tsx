import { useEffect, useState } from "react";
import type { TranscriptionMethod } from "../types/move-map";
import { isTranscriptionSupported } from "../lib/transcription-service";

const STORAGE_KEY = "barcelona-relocation-transcription-method";

function loadMethod(): TranscriptionMethod {
  if (typeof window === "undefined") return "web-speech";
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "whisper" || raw === "web-speech") return raw;
  } catch {
    /* ignore */
  }
  return "web-speech";
}

function saveMethod(method: TranscriptionMethod) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, method);
  } catch {
    /* ignore */
  }
}

export type TranscriptionSettingsProps = {
  method: TranscriptionMethod;
  onChange: (method: TranscriptionMethod) => void;
};

export function TranscriptionSettings({ method, onChange }: TranscriptionSettingsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Re-read persisted choice once on mount.
  useEffect(() => {
    const persisted = loadMethod();
    if (persisted !== method) onChange(persisted);
    // Only run on first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const webSpeechAvailable = mounted ? isTranscriptionSupported("web-speech") : false;
  const whisperAvailable = isTranscriptionSupported("whisper"); // false until Phase 2b

  const handleSelect = (next: TranscriptionMethod) => {
    if (next === "whisper" && !whisperAvailable) return; // disabled until Phase 2b
    saveMethod(next);
    onChange(next);
  };

  return (
    <div className="transcription-settings">
      <span className="transcription-settings-label">Transcription</span>
      <div className="transcription-toggle" role="radiogroup" aria-label="Transcription method">
        <button
          type="button"
          role="radio"
          aria-checked={method === "web-speech"}
          className={`status-control${method === "web-speech" ? " status-active" : ""}`}
          onClick={() => handleSelect("web-speech")}
        >
          <span
            className={`transcription-status-dot${webSpeechAvailable ? " is-available" : " is-unavailable"}`}
            aria-hidden="true"
          />
          Web Speech
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={method === "whisper"}
          className={`status-control${method === "whisper" ? " status-active" : ""}`}
          disabled
          title="Local Whisper transcription arrives in Phase 2b"
          onClick={() => handleSelect("whisper")}
        >
          <span
            className={`transcription-status-dot${whisperAvailable ? " is-available" : " is-unavailable"}`}
            aria-hidden="true"
          />
          Local Whisper (soon)
        </button>
      </div>
    </div>
  );
}
