import type { MoveMapData } from "../types/move-map";
import { formatDate } from "../lib/formatters";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { StatusPill } from "../components/StatusPill";
export function TasksView({ data }: { data: MoveMapData }) { return <div className="view"><PageHeader eyebrow="Tasks" title="Practical next steps">Read-only task cards grouped by planning track through the local JSON file.</PageHeader><section className="card-grid">{data.tasks.map((t)=><SectionCard key={t.id} title={t.title} kicker={t.track}><p>{t.notes}</p><div className="card-meta"><StatusPill status={t.status}/><span>{t.owner}</span><span>Due {formatDate(t.due_date)}</span></div></SectionCard>)}</section></div>; }
