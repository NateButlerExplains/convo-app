import { useEffect, useMemo, useState } from "react";
import rawData from "./data/move-map-data.json";
import type { MoveMapData, ViewKey } from "./types/move-map";
import { AppShell } from "./components/AppShell";
import { HomeView } from "./views/HomeView";
import { RoadmapView } from "./views/RoadmapView";
import { BudgetView } from "./views/BudgetView";
import { DecisionsView } from "./views/DecisionsView";
import { OptionsView } from "./views/OptionsView";
import { IdeasView } from "./views/IdeasView";
import { TasksView } from "./views/TasksView";
import { RisksView } from "./views/RisksView";
import { DocumentsView } from "./views/DocumentsView";
import { SnapshotsView } from "./views/SnapshotsView";

const data = rawData as MoveMapData;
const views: ViewKey[] = ["home", "roadmap", "budget", "decisions", "options", "ideas", "tasks", "risks", "documents", "snapshots"];
function fromHash(): ViewKey { const key = window.location.hash.replace("#", "") as ViewKey; return views.includes(key) ? key : "home"; }

export default function App() {
  const [view, setView] = useState<ViewKey>(fromHash());
  useEffect(() => { const onHash = () => setView(fromHash()); window.addEventListener("hashchange", onHash); return () => window.removeEventListener("hashchange", onHash); }, []);
  const content = useMemo(() => {
    switch (view) {
      case "roadmap": return <RoadmapView data={data} />;
      case "budget": return <BudgetView data={data} />;
      case "decisions": return <DecisionsView data={data} />;
      case "options": return <OptionsView data={data} />;
      case "ideas": return <IdeasView data={data} />;
      case "tasks": return <TasksView data={data} />;
      case "risks": return <RisksView data={data} />;
      case "documents": return <DocumentsView data={data} />;
      case "snapshots": return <SnapshotsView data={data} />;
      default: return <HomeView data={data} />;
    }
  }, [view]);
  return <AppShell data={data} view={view}>{content}</AppShell>;
}
