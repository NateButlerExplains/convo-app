import type { MoveMapData } from "../types/move-map";
import { PageHeader } from "../components/PageHeader";
import { ConversationCard } from "../components/ConversationCard";
export function IdeasView({ data }: { data: MoveMapData }) { return <div className="view"><PageHeader eyebrow="Ideas" title="Questions worth keeping warm">A friendly list of prompts for future family conversations.</PageHeader><section className="card-grid">{data.ideas.map((idea)=><ConversationCard key={idea.id} idea={idea}/>)}</section></div>; }
