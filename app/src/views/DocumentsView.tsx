import type { MoveMapData } from "../types/move-map";
import { formatDate, titleCase } from "../lib/formatters";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { StatusPill } from "../components/StatusPill";
export function DocumentsView({ data }: { data: MoveMapData }) { return <div className="view"><PageHeader eyebrow="Documents" title="Paperwork timing without private numbers">Track categories, due dates, apostille/translation needs, and purpose. Do not store sensitive identifiers.</PageHeader><section className="card-grid">{data.documents.map((d)=><SectionCard key={d.id} title={d.name} kicker={`${d.person} · ${titleCase(d.category)}`}><p>{d.needed_for}</p><p>{d.notes}</p><div className="card-meta"><StatusPill status={d.status}/><span>Due {formatDate(d.due_date)}</span>{d.needs_apostille && <span>Apostille</span>}{d.needs_translation && <span>Translation</span>}</div></SectionCard>)}</section></div>; }
