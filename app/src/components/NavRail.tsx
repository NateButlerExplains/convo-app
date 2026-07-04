import type { ViewKey } from "../types/move-map";
import { titleCase } from "../lib/formatters";
const items: ViewKey[] = ["home", "roadmap", "budget", "decisions", "options", "ideas", "tasks", "risks", "documents", "snapshots"];
export function NavRail({ active }: { active: ViewKey }) { return <nav className="nav-rail" aria-label="Primary navigation"><a className="brand" href="#home"><span>BCN</span><b>Move Map</b></a>{items.map((item) => <a key={item} href={`#${item}`} aria-current={active === item ? "page" : undefined} className={active === item ? "active" : ""}>{titleCase(item)}</a>)}</nav>; }
