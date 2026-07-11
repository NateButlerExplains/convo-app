import { Flag } from "lucide-react";

interface RouteLandmark {
  key: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  status: 'future' | 'current' | 'ready' | 'blocked' | 'complete';
  phaseIndex: number;
}

interface RouteLineProps {
  landmarks: RouteLandmark[];
  currentPhaseIndex: number;
  totalPhases: number;
  destinationLabel?: string;
}


export function RouteLine({ landmarks, currentPhaseIndex, totalPhases, destinationLabel = "Barcelona — January 2027" }: RouteLineProps) {
  const progress = totalPhases > 0 ? ((currentPhaseIndex + 1) / totalPhases) * 100 : 0;

  return (
    <div
      className="route-line"
      role="img"
      aria-label="Family route line from Malden to Barcelona"
      style={{ '--progress': `${progress}%` } as React.CSSProperties}
    >
      <div className="route-landmarks">
        {landmarks.map((landmark, index) => (
          <div
            key={landmark.key}
            className={`route-landmark is-${landmark.status} ${index === currentPhaseIndex ? 'is-current' : ''}`}
            style={{ '--index': index } as React.CSSProperties}
          >
            {landmark.status === 'current' && <span className="route-status-chip is-current route-now-chip">Now</span>}
            <div className="route-landmark-circle">
              <landmark.icon size={index === currentPhaseIndex ? 20 : 18} className="route-landmark-icon" />
            </div>
            <div className="route-landmark-label">
              <span className="route-landmark-name">{landmark.label}</span>
              {landmark.status === 'ready' && <span className="route-status-chip is-ready">Ready</span>}
              {landmark.status === 'blocked' && <span className="route-status-chip is-blocked">Blocked</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="route-line-connector" />

      <div className="route-destination">
        <Flag className="route-destination-icon" size={20} />
        <span className="route-destination-label">{destinationLabel}</span>
      </div>
    </div>
  );
}