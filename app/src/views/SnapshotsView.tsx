import type { MoveMapData } from "../types/move-map";
import { formatDate } from "../lib/formatters";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { PrintActions } from "../components/PrintActions";
export function SnapshotsView({ data }: { data: MoveMapData }) { return <div className="view"><PageHeader eyebrow="Snapshots" title="Preserve today’s version of the plan">Use browser print/save-as-PDF or download a local JSON snapshot. Nothing uploads anywhere.</PageHeader><section className="hero-card"><div><h2>Local export actions</h2><p>Snapshots are dated family planning artifacts, not final advice or cloud backups.</p></div><PrintActions data={data}/></section><section className="card-grid">{data.snapshots.map((s)=><SectionCard key={s.id} title={s.title} kicker={s.type}><p>{s.notes}</p><p className="small-text">Created {formatDate(s.created_at)} · Includes {s.included_sections.join(", ")}</p></SectionCard>)}</section></div>; }
