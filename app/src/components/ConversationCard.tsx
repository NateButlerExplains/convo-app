import type { Idea } from "../types/move-map";
import { StatusPill } from "./StatusPill";
export function ConversationCard({ idea }: { idea: Idea }) { return <article className="conversation-card"><p className="card-kicker">Conversation card</p><h3>{idea.prompt}</h3><p>{idea.notes}</p><div className="card-meta"><StatusPill status={idea.priority} /><span>{idea.topic}</span><span>{idea.discussed ? "Discussed" : "Open"}</span></div></article>; }
