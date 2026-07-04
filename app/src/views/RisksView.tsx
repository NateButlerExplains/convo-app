import type { MoveMapData } from "../types/move-map";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { StatusPill } from "../components/StatusPill";
export function RisksView({ data }: { data: MoveMapData }) { return <div className="view"><PageHeader eyebrow="Risks" title="Uncertainty with a next action">Risks are shown with triggers and mitigations so they stay calm and useful.</PageHeader><section className="card-grid">{data.risks.map((r)=><SectionCard key={r.id} title={r.title} kicker={r.category}><p>{r.description}</p><dl className="detail-list"><dt>Trigger</dt><dd>{r.trigger}</dd><dt>Mitigation</dt><dd>{r.mitigation}</dd></dl><div className="card-meta"><StatusPill status={`likelihood-${r.likelihood}`}/><StatusPill status={`impact-${r.impact}`}/><StatusPill status={r.status}/>{r.professional_advice_required && <span>Professional review</span>}</div></SectionCard>)}</section></div>; }
