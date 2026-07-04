import type { PlanningTrack, RoadmapPhase } from "../types/move-map";
import { StatusPill } from "./StatusPill";
export function RouteLine({ tracks, phases }: { tracks?: PlanningTrack[]; phases?: RoadmapPhase[] }) {
  const items = phases ? phases.map((p) => ({ id: p.id, title: p.title, status: p.status })) : (tracks || []).map((t) => ({ id: t.id, title: t.title, status: t.readiness }));
  return <div className="route-line" aria-label="Family route line">{items.map((item, index) => <div className="route-stop" key={item.id}><div className="route-marker">{index + 1}</div><strong>{item.title}</strong><StatusPill status={item.status} /></div>)}</div>;
}
