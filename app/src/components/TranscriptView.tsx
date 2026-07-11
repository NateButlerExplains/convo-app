import { useEffect, useRef } from "react";
import type { TranscriptSegment } from "../types/move-map";

export type TranscriptViewProps = {
  segments: TranscriptSegment[];
  isLive: boolean;
};

function formatOffset(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function TranscriptView({ segments, isLive }: TranscriptViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastCount = useRef(0);

  // Auto-scroll to the bottom whenever new content arrives.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (segments.length !== lastCount.current) {
      lastCount.current = segments.length;
      el.scrollTop = el.scrollHeight;
    }
  }, [segments]);

  return (
    <div className="transcript-view" ref={scrollRef} aria-live={isLive ? "polite" : "off"}>
      {segments.length === 0 ? (
        <div className="transcript-empty">
          {isLive ? "Listening… transcription will appear here." : "No transcript yet."}
        </div>
      ) : (
        segments.map((seg) => (
          <div
            key={seg.id}
            className={`transcript-segment${seg.isFinal ? "" : " interim"}`}
          >
            <span className="transcript-speaker">{seg.speaker || "Unknown"}</span>
            <span className="transcript-text">{seg.text}</span>
            <span className="transcript-time">{formatOffset(seg.startOffset)}</span>
          </div>
        ))
      )}
    </div>
  );
}
