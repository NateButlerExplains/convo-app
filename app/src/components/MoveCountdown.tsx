import { useEffect, useState } from "react";
import { buildCountdownText, splitCountdownParts } from "../lib/move-countdown";

export function MoveCountdown({
  destinationLabel = "Barcelona - January 15th 2027",
  className = "",
  compact = false,
}: {
  destinationLabel?: string;
  className?: string;
  compact?: boolean;
}) {
  const [countdown, setCountdown] = useState(() => buildCountdownText());

  useEffect(() => {
    const tick = () => setCountdown(buildCountdownText());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!countdown) return null;

  return (
    <div className={`countdown-ticker ${compact ? "countdown-ticker-compact" : ""} ${className}`.trim()} aria-live="polite">
      <div className="countdown-head">
        <div className="flap-label">The Big Move Countdown</div>
        <div className="countdown-destination">{destinationLabel}</div>
      </div>
      <div className="countdown-rows">
        {splitCountdownParts(countdown).map(({ value, label }) => (
          <div key={label} className="countdown-row">
            <span className="countdown-value">{value}</span>
            <span className="countdown-label">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
