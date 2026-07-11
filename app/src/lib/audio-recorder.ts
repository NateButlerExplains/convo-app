// MediaRecorder wrapper with state machine
// States: idle → preparing → recording → paused/stopped

export type RecorderState = "idle" | "preparing" | "recording" | "paused" | "stopped";

export type RecorderOpts = {
  mimeType?: string;
  audioBitsPerSecond?: number;
  onDataAvailable?: (chunk: Blob) => void;
  onStop?: (blob: Blob, duration: number) => void;
  onError?: (err: DOMException | Error) => void;
};

export class AudioRecorder {
  private media: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private startTime = 0;
  private state_: RecorderState = "idle";
  private opts: RecorderOpts;

  constructor(opts: RecorderOpts = {}) {
    this.opts = opts;
  }

  get state(): RecorderState {
    return this.state_;
  }

  getStream(): MediaStream | null {
    return this.stream;
  }

  async start(): Promise<void> {
    if (this.state_ !== "idle") throw new Error(`Cannot start from state "${this.state_}"`);
    this.state_ = "preparing";

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      this.state_ = "idle";
      this.opts.onError?.(err as DOMException);
      throw err;
    }

    const mime = (this.opts.mimeType ?? (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm"));

    this.chunks = [];
    this.media = new MediaRecorder(this.stream, {
      mimeType: mime,
      audioBitsPerSecond: this.opts.audioBitsPerSecond ?? 16000,
    });

    this.media.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.chunks.push(e.data);
        this.opts.onDataAvailable?.(e.data);
      }
    };

    this.media.onstop = () => {
      const blob = new Blob(this.chunks, { type: mime });
      const dur = Date.now() - this.startTime;
      this.cleanup();
      this.state_ = "stopped";
      this.opts.onStop?.(blob, dur);
    };

    this.media.onerror = () => {
      const err = (this.media as any)?.error || new Error("MediaRecorder error");
      this.cleanup();
      this.state_ = "idle";
      this.opts.onError?.(err instanceof Error ? err : new Error(err));
    };

    this.media.start(250); // collect chunks every 250ms
    this.startTime = Date.now();
    this.state_ = "recording";
  }

  stop(): void {
    if (this.state_ !== "recording" && this.state_ !== "paused") return;
    this.media?.stop();
    // onstop handler transitions to "stopped" + calls onStop callback
  }

  pause(): void {
    if (this.state_ !== "recording") return;
    this.media?.pause();
    this.state_ = "paused";
  }

  resume(): void {
    if (this.state_ !== "paused") return;
    this.media?.resume();
    this.state_ = "recording";
  }

  private cleanup(): void {
    this.media = null;
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
  }
}