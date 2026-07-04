import type { MoveMapData, Option } from "../types/move-map";
import { titleCase } from "../lib/formatters";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { ConfidenceBadge } from "../components/ConfidenceBadge";
import { StatusPill } from "../components/StatusPill";
const groups: Option["category"][]=["visa","neighborhood","school_childcare","healthcare","insurance","travel","housing","financial","other"];
export function OptionsView({ data }: { data: MoveMapData }) { return <div className="view"><PageHeader eyebrow="Options" title="Compare before deciding">Options connect to decisions, budget assumptions, risks, and professional-advice flags.</PageHeader>{groups.map((g)=>{ const items=data.options.filter((o)=>o.category===g); if(!items.length) return null; return <section key={g}><h2 className="section-heading">{titleCase(g)}</h2><div className="card-grid">{items.map((o)=><SectionCard key={o.id} title={o.name} kicker={o.professional_advice_required?"Professional advice required":"Planning option"}><p>{o.summary}</p><div className="pros-cons"><div><strong>Pros</strong><ul>{o.pros.map((p)=><li key={p}>{p}</li>)}</ul></div><div><strong>Cons</strong><ul>{o.cons.map((c)=><li key={c}>{c}</li>)}</ul></div></div><p className="small-text">Cost: {o.estimated_cost_label}</p><div className="card-meta"><ConfidenceBadge confidence={o.confidence}/><StatusPill status={o.risk_level}/></div></SectionCard>)}</div></section>})}</div>; }
