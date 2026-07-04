import type { Decision, Option } from "../types/move-map";
import { formatDate } from "../lib/formatters";
import { StatusPill } from "./StatusPill";
export function DecisionPostcard({ decision, options }: { decision: Decision; options: Option[] }) { const linked = options.filter((o) => decision.options_considered.includes(o.id)); return <article className="decision-postcard"><div className="postmark">Decision</div><h3>{decision.title}</h3><p>{decision.rationale}</p><div className="card-meta"><StatusPill status={decision.status} /><StatusPill status={decision.readiness} /><span>Revisit {formatDate(decision.revisit_date)}</span></div>{linked.length > 0 && <p className="small-text">Options: {linked.map((o) => o.name).join(", ")}</p>}</article>; }
