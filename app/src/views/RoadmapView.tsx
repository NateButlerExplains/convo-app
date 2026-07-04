import type { MoveMapData } from "../types/move-map";
import { formatDate } from "../lib/formatters";
import { PageHeader } from "../components/PageHeader";
import { RouteLine } from "../components/RouteLine";
import { SectionCard } from "../components/SectionCard";
import { StatusPill } from "../components/StatusPill";
import { ConfidenceBadge } from "../components/ConfidenceBadge";
export function RoadmapView({ data }: { data: MoveMapData }) { return <div className="view"><PageHeader eyebrow="Roadmap" title="From research to arrival and stabilization">A quarter/month route toward January 2027, with dependencies and confidence visible.</PageHeader><RouteLine phases={data.roadmap_phases}/><section className="card-grid">{data.roadmap_phases.map((phase)=><SectionCard key={phase.id} title={phase.title} kicker={`${formatDate(phase.start_date)} - ${formatDate(phase.end_date)}`}><p>{phase.description}</p>{data.milestones.filter((m)=>phase.milestone_ids.includes(m.id)).map((m)=><article className="mini-card" key={m.id}><h3>{m.title}</h3><p>{m.notes}</p><div className="card-meta"><StatusPill status={m.status}/><ConfidenceBadge confidence={m.confidence}/><span>{formatDate(m.target_date)}</span></div></article>)}</SectionCard>)}</section></div>; }
