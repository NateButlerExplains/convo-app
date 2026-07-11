import { useEffect, useMemo, useState } from "react";
import rawData from "./data/move-map-data.json";
import type { Milestone, MoveMapData, ViewKey } from "./types/move-map";
import { AppShell } from "./components/AppShell";
import { MOVE_MAP_STATE_CHANGED_EVENT } from "./lib/state-events";
import { loadLiveSnapshot } from "./lib/live-snapshot";
import { HomeView } from "./views/HomeView";
import { ConversationView } from "./views/ConversationView";
import { FamilyTimelineView } from "./views/FamilyTimelineView";
import { BudgetView } from "./views/BudgetView";
import { DebtView } from "./views/DebtView";
import { ExpensesView } from "./views/ExpensesView";
import { M4PlanningView } from "./views/M4PlanningView";
import { DecisionsView } from "./views/DecisionsView";
import { AlonsSkillsView } from "./views/AlonsSkillsView";
import { OptionsView } from "./views/OptionsView";
import { IdeasView } from "./views/IdeasView";
import { TasksView } from "./views/TasksView";
import { RisksView } from "./views/RisksView";

const data = rawData as MoveMapData;
const views: ViewKey[] = ["home", "conversation", "calendar", "budget", "debt", "expenses", "income", "housing", "decisions", "alons-skills", "options", "ideas", "tasks", "risks"];
const STORAGE_KEY = "barcelona-move-map.milestones.v1";
function fromHash(): ViewKey {
  const key = window.location.hash.replace("#", "") as ViewKey;
  if (key.startsWith("tasks-trigger-")) return "tasks";
  return views.includes(key) ? key : "home";
}
function loadMilestones(): Milestone[] { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) as Milestone[] : data.milestones; } catch { return data.milestones; } }

export default function App() {
  const [view, setView] = useState<ViewKey>(fromHash());
  const [milestones, setMilestones] = useState<Milestone[]>(loadMilestones);
  const [syncTick, setSyncTick] = useState(0);
  useEffect(() => {
    const onStateChanged = () => setSyncTick((current) => current + 1);
    window.addEventListener(MOVE_MAP_STATE_CHANGED_EVENT, onStateChanged);
    window.addEventListener("storage", onStateChanged);

    const onHash = () => {
      setView(fromHash());
    };
    window.addEventListener("hashchange", onHash);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener(MOVE_MAP_STATE_CHANGED_EVENT, onStateChanged);
      window.removeEventListener("storage", onStateChanged);
    };
  }, []);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(milestones)); }, [milestones]);
  const { roadmapData, liveState } = useMemo(() => loadLiveSnapshot(data, milestones), [data, milestones, syncTick]);
  const content = useMemo(() => {
    switch (view) {
      case "conversation": return <ConversationView data={roadmapData} />;
      case "calendar": return <FamilyTimelineView data={roadmapData} />;
      case "budget": return <BudgetView data={roadmapData} />;
      case "debt": return <DebtView data={roadmapData} />;
      case "expenses": return <ExpensesView data={roadmapData} />;
      case "income": return <M4PlanningView data={roadmapData} initialKind="income" />;
      case "housing": return <M4PlanningView data={roadmapData} initialKind="housing" />;

      case "decisions": return <DecisionsView data={roadmapData} />;
      case "alons-skills": return <AlonsSkillsView />;
      case "options": return <OptionsView data={roadmapData} />;
      case "ideas": return <IdeasView data={roadmapData} />;
      case "tasks": return <TasksView data={roadmapData} />;
      case "risks": return <RisksView data={roadmapData} />;
      default: return <HomeView data={roadmapData} liveState={liveState} />;
    }
  }, [milestones, roadmapData, view]);
  return <AppShell data={roadmapData} view={view}>{content}</AppShell>;
}
