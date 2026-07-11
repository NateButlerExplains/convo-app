// Unified transcription interface
// Web Speech API implementation + Whisper API stub (Phase 2b)

import type { TranscriptSegment, TranscriptionMethod } from "../types/move-map";

// Re-export the canonical segment type so consumers import from one place.
export type { TranscriptSegment };

export type TranscriptionCallbacks = {
  onSegment?: (seg: TranscriptSegment) => void;
  onFinal?: (fullText: string) => void;
  onError?: (err: Error) => void;
  onStateChange?: (state: "idle" | "listening" | "transcribing" | "done" | "error") => void;
};

export interface ITranscriptionService {
  startTranscript(callbacks: TranscriptionCallbacks): void;
  stopTranscript(): void;
  readonly isRunning: boolean;
}

// ── Web Speech API implementation ──

// Minimal Web Speech API types (browser globals, not in all DOM libs)
type SpeechRecogCtor = new () => SpeechRecog;
type SpeechRecogEvent = {
  resultIndex: number;
  results: SpeechRecognitionResultList;
};
type SpeechRecogResult = {
  0: { transcript: string };
  isFinal: boolean;
  length: number;
};
type SpeechRecog = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (() => void) | null;
  onresult: ((e: SpeechRecogEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function getSpeechRecognitionCtor(): SpeechRecogCtor | null {
  if (typeof window === "undefined") return null;
  const ctor = (window as unknown as { SpeechRecognition?: SpeechRecogCtor }).SpeechRecognition ??
    (window as unknown as { webkitSpeechRecognition?: SpeechRecogCtor }).webkitSpeechRecognition;
  return ctor ?? null;
}

function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionCtor() !== null;
}

// Delay before restarting recognition after a silent pause / onend.
const RESTART_BACKOFF_MS = 250;

export class WebSpeechTranscription implements ITranscriptionService {
  private recognition: SpeechRecog | null = null;
  private running = false;
  private sessionStart = 0;
  private finalText = "";
  private segmentId = 0; // monotonic per-session counter for collision-free segment IDs
  private restartTimer: ReturnType<typeof setTimeout> | null = null;
  private callbacks: TranscriptionCallbacks = {};

  get isRunning(): boolean {
    return this.running;
  }

  startTranscript(callbacks: TranscriptionCallbacks): void {
    if (this.running) return;
    this.callbacks = callbacks;

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      this.callbacks.onError?.(new Error("Web Speech API not supported in this browser"));
      this.callbacks.onStateChange?.("error");
      return;
    }

    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.maxAlternatives = 1;

    this.sessionStart = Date.now();
    this.finalText = "";
    this.segmentId = 0;

    rec.onstart = () => {
      this.running = true;
      this.callbacks.onStateChange?.("listening");
    };

    rec.onresult = (e: SpeechRecogEvent) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        const offset = Date.now() - this.sessionStart;
        const transcript = result[0].transcript;
        const id = `seg-${this.segmentId++}`;
        if (result.isFinal) {
          this.finalText += transcript;
          this.callbacks.onSegment?.({
            id,
            speaker: "unknown",
            text: transcript,
            startOffset: offset,
            endOffset: offset,
            isFinal: true,
          });
          this.callbacks.onFinal?.(this.finalText.trim());
        } else {
          this.callbacks.onSegment?.({
            id,
            speaker: "unknown",
            text: transcript,
            startOffset: offset,
            // Interim segment has no known end yet — use a sentinel large
            // number so it sorts after all finalized segments.
            endOffset: Number.MAX_SAFE_INTEGER,
            isFinal: false,
          });
        }
      }
    };

    rec.onerror = (e: { error: string }) => {
      const err = e.error;
      // "no-speech" / "aborted" simply end the session — restart via onend.
      if (err === "no-speech" || err === "aborted") {
        return;
      }
      this.running = false;
      this.callbacks.onStateChange?.("error");
      this.callbacks.onError?.(new Error(`Web Speech error: ${err}`));
    };

    rec.onend = () => {
      // Restart-on-silence: if we're still meant to be running, kick it again
      // so transcription continues through natural pauses.
      if (this.running) {
        this.scheduleRestart();
      } else {
        this.running = false;
        this.callbacks.onStateChange?.("done");
      }
    };

    this.recognition = rec;
    try {
      rec.start();
    } catch (err) {
      this.running = false;
      this.callbacks.onStateChange?.("error");
      this.callbacks.onError?.(err instanceof Error ? err : new Error("Failed to start Web Speech recognition"));
    }
  }

  stopTranscript(): void {
    this.running = false;
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    if (this.recognition) {
      try {
        this.recognition.onend = null;
        this.recognition.stop();
      } catch {
        // already stopped
      }
    }
    this.recognition = null;
    this.callbacks.onStateChange?.("done");
  }

  private scheduleRestart(): void {
    if (this.restartTimer) clearTimeout(this.restartTimer);
    this.restartTimer = setTimeout(() => {
      this.restartTimer = null;
      if (!this.running || !this.recognition) return;
      try {
        this.recognition.start();
      } catch {
        // Recognition may already be starting; retry shortly.
        this.scheduleRestart();
      }
    }, RESTART_BACKOFF_MS);
  }
}

// ── Whisper API stub (to be completed in Phase 2b) ──

export type WhisperOpts = {
  endpoint?: string; // default: http://localhost:1234/v1/audio/transcriptions
  model?: string;
  language?: string;
};

// A single Whisper word/phrase segment with real audio timestamps (seconds).
export type WhisperSegment = { start: number; end: number; text: string };

export class WhisperTranscription implements ITranscriptionService {
  private running = false;
  private callbacks: TranscriptionCallbacks = {};
  private opts: WhisperOpts;

  constructor(opts: WhisperOpts = {}) {
    this.opts = opts;
  }

  get isRunning(): boolean {
    return this.running;
  }

  startTranscript(callbacks: TranscriptionCallbacks): void {
    // Stub — Whisper will run post-recording on the full audio blob (Phase 2b).
    this.callbacks = callbacks;
    this.running = false;
    this.callbacks.onError?.(new Error("Local Whisper transcription not yet available — coming in Phase 2b"));
    this.callbacks.onStateChange?.("error");
  }

  stopTranscript(): void {
    this.running = false;
  }

  /**
   * Post-recording transcription of a full audio blob.
   * Sends the blob to the Whisper API endpoint and returns the transcript text.
   */
  async transcribeAudio(blob: Blob): Promise<string> {
    const { text } = await this.transcribeWithSegments(blob);
    return text;
  }

  /**
   * Post-recording transcription of a full audio blob.
   * Returns the full transcript text AND the per-segment breakdown with real
   * audio timestamps (seconds). Defensive against a partial/malformed response.
   */
  async transcribeWithSegments(
    blob: Blob,
  ): Promise<{ text: string; segments: WhisperSegment[] }> {
    const endpoint = this.opts.endpoint ?? "http://localhost:8000/transcribe";
    const formData = new FormData();
    formData.append("file", blob, "recording.webm");
    const res = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Whisper transcription failed (HTTP ${res.status}): ${errText}`);
    }
    const json = (await res.json()) as {
      text?: unknown;
      segments?: unknown;
    };

    // Defensive: coerce each segment, tolerating missing/empty segments.
    let segments: WhisperSegment[] = [];
    if (Array.isArray(json.segments)) {
      segments = json.segments
        .filter((s): s is Record<string, unknown> => s != null && typeof s === "object")
        .map((s) => ({
          start: typeof s.start === "number" ? s.start : Number(s.start) || 0,
          end: typeof s.end === "number" ? s.end : Number(s.end) || 0,
          text: typeof s.text === "string" ? s.text : String(s.text ?? ""),
        }));
    }

    if (typeof json.text !== "string") {
      throw new Error("Whisper response missing 'text' field");
    }
    return { text: json.text, segments };
  }
}

// ── Service factory + capability helpers ──

export async function transcribeRecording(blob: Blob): Promise<string> {
  const service = new WhisperTranscription({ endpoint: "http://localhost:8000/transcribe" });
  return service.transcribeAudio(blob);
}

export async function transcribeRecordingWithSegments(
  blob: Blob,
): Promise<{ text: string; segments: WhisperSegment[] }> {
  const service = new WhisperTranscription({ endpoint: "http://localhost:8000/transcribe" });
  return service.transcribeWithSegments(blob);
}

export function isTranscriptionSupported(method: TranscriptionMethod): boolean {
  if (method === "whisper") return true;
  return isSpeechRecognitionSupported();
}

export function createTranscriptionService(method: TranscriptionMethod): ITranscriptionService {
  if (method === "whisper") return new WhisperTranscription();
  return new WebSpeechTranscription();
}
