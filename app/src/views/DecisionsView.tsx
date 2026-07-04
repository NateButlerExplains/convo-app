import type { MoveMapData } from "../types/move-map";
import { PageHeader } from "../components/PageHeader";
import { DecisionPostcard } from "../components/DecisionPostcard";
export function DecisionsView({ data }: { data: MoveMapData }) { return <div className="view"><PageHeader eyebrow="Decisions" title="What we are proposing, leaning toward, or revisiting">Decision postcards preserve rationale without pretending everything is settled.</PageHeader><section className="postcard-grid">{data.decisions.map((decision)=><DecisionPostcard key={decision.id} decision={decision} options={data.options}/>)}</section></div>; }
