import { FileText, Flag, Home, PiggyBank, Plane, Search, Shield, ShieldCheck } from "lucide-react";
import { loadIdeas } from "../views/IdeasView";
import type { CockpitLiveState } from "../lib/live-snapshot";
import { deriveRouteProgress, type RouteRequirement } from "../lib/route-progress";
import { titleCase } from "../lib/formatters";
import type { MoveMapData, Idea } from "../types/move-map";
import { PageHeader } from "../components/PageHeader";
import { RouteLine } from "../components/RouteLine";
import { SectionCard } from "../components/SectionCard";

const LANDMARKS = [
  { key: "research", label: "Research", icon: Search },
  { key: "visa", label: "Visa Path", icon: ShieldCheck },
  { key: "budget", label: "Budget Confidence", icon: PiggyBank },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "housing", label: "Housing & Schools", icon: Home },
  { key: "travel", label: "Travel", icon: Plane },
  { key: "arrival", label: "Arrival", icon: Flag },
  { key: "stabilization", label: "Stabilization", icon: Shield },
];

const money = (value: number) => value.toLocaleString("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
const triggerSectionSlugByCheckpoint: Record<string, string> = {
  research: "research-and-feasibility",
  visa: "visa-and-residency",
  budget: "budget-and-savings",
  documents: "documents",
  housing: "housing-and-neighborhoods",
  travel: "travel-and-arrival",
};

type HomeIdea = Idea & { archived?: boolean };

function normalizeHomeIdea(idea: HomeIdea): Required<Pick<HomeIdea, "archived">> & Omit<HomeIdea, "archived"> {
  return { ...idea, archived: Boolean(idea.archived) };
}

function requirementHref(checkpointKey: string, requirement: RouteRequirement) {
  if (requirement.taskId) return `#tasks-trigger-${triggerSectionSlugByCheckpoint[checkpointKey] ?? checkpointKey}-${requirement.taskId}`;
  if (requirement.page === "housing") return "#housing";
  return `#${requirement.page}`;
}

export function HomeView({ data, liveState }: { data: MoveMapData; liveState: CockpitLiveState }) {
  const routeProgress = deriveRouteProgress(data, liveState);
  const currentCheckpoint = routeProgress.current;
  const conversationRadarTasks = data.tasks
    .filter((task) => task.status !== "done" && task.track.toLowerCase().includes("ad hoc conversation"))
    .sort((a, b) => (a.priority === b.priority ? a.title.localeCompare(b.title) : a.priority === "high" ? -1 : b.priority === "high" ? 1 : 0));
  const openIdeas = (loadIdeas() ?? data.ideas)
    .map((idea) => normalizeHomeIdea(idea as HomeIdea))
    .filter((idea) => !idea.archived && !idea.discussed)
    .sort((a, b) => (a.priority === b.priority ? a.topic.localeCompare(b.topic) : a.priority === "high" ? -1 : b.priority === "high" ? 1 : 0));
  const openRisks = data.risks
    .filter((risk) => !((risk as { archived?: boolean }).archived) && risk.status !== "resolved")
    .sort((a, b) => (a.impact === b.impact ? a.title.localeCompare(b.title) : a.impact === "high" ? -1 : b.impact === "high" ? 1 : 0));
  const landmarks = LANDMARKS.map((landmark, index) => ({
    ...landmark,
    status: routeProgress.checkpoints[index].status,
    phaseIndex: index,
  }));
  const orderedCheckpoints = routeProgress.checkpoints
    .slice()
    .sort((a, b) => {
      const rank = (status: string) => status === "current" || status === "blocked" ? 0 : status === "future" ? 1 : 2;
      return rank(a.status) - rank(b.status);
    });

  return (
    <div className="view roadmap-home">
      <PageHeader title="Dashboard">
        Live snapshot of debt, expenses, ideas, risks, and the route map that moves as you plan.
      </PageHeader>

      <section className="home-widget-grid" aria-label="Move overview">
        <SectionCard title="Debt" kicker="Debt radar" className="home-widget-card">
          <div className="home-widget-metric">
            <strong>{money(liveState.debt.totalBalance)}</strong>
            <span>{liveState.debt.activeCount} open debts  {liveState.debt.overdueCount} past due</span>
          </div>
          <p className="small-text">Next due: {liveState.debt.nextDueLabel}</p>
          <a className="home-widget-link" href="#debt">Open debt ledger <span aria-hidden="true"></span></a>
        </SectionCard>

        <SectionCard title="Expenses" kicker="Nate + Shae monthly" className="home-widget-card">
          <div className="home-widget-metric">
            <strong>{money(liveState.expenses.currentTotal + liveState.expenses.spainForecast)}</strong>
            <span>{liveState.expenses.currentCount + liveState.expenses.spainCount} active rows across both people</span>
          </div>
          <p className="small-text">Next row: {liveState.expenses.nextLabel}</p>
          <a className="home-widget-link" href="#expenses">Open expense ledgers <span aria-hidden="true"></span></a>
        </SectionCard>

        <SectionCard title="Ideas" kicker="Still worth discussing" className="home-widget-card">
          <div className="home-widget-list">
            {openIdeas.length > 0 ? openIdeas.slice(0, 3).map((idea) => (
              <a key={idea.id} href="#ideas">
                <strong>{titleCase(idea.topic)}</strong>
                <span className={`home-list-badge status-${idea.priority}`}>{titleCase(idea.priority)}</span>
              </a>
            )) : <p className="home-widget-empty">No open ideas.</p>}
          </div>
          <a className="home-widget-link" href="#ideas">Review ideas <span aria-hidden="true"></span></a>
        </SectionCard>

        <SectionCard title="Risks" kicker="Watch closely" className="home-widget-card">
          <div className="home-widget-list">
            {openRisks.length > 0 ? openRisks.slice(0, 3).map((risk) => (
              <a key={risk.id} href="#risks">
                <strong>{risk.title}</strong>
                <span className={`home-list-badge status-impact-${risk.impact}`}>{titleCase(risk.impact)}</span>
              </a>
            )) : <p className="home-widget-empty">No active risks.</p>}
          </div>
          <a className="home-widget-link" href="#risks">Review risk register <span aria-hidden="true"></span></a>
        </SectionCard>
      </section>

      <section className="home-primary-grid">
        <SectionCard title="Route map" className="route-map-card">
          <div className="route-map-summary">
            <span className="route-progress-pill">{routeProgress.completedCount}/{LANDMARKS.length} phases complete</span>
          </div>

          <RouteLine
            landmarks={landmarks}
            currentPhaseIndex={Math.max(0, routeProgress.currentIndex)}
            totalPhases={LANDMARKS.length}
          />

          <div className="route-guidance route-guidance-compact" aria-label="What moves the route map">
            <div className="route-guidance-groups">
              <details className="route-guidance-group conversation-radar-group" open={conversationRadarTasks.length > 0}>
                <summary><span>Conversation Radar</span><small>{conversationRadarTasks.length}</small></summary>
                <ul className="route-guidance-list">
                  {conversationRadarTasks.length > 0 ? conversationRadarTasks.map((task) => (
                    <li key={task.id} className={task.priority === "high" ? "is-current-route-item" : "is-future-route-item"}>
                      <span className="route-item-marker" aria-hidden="true">{task.priority === "high" ? "!" : ""}</span>
                      <a href={`#tasks-trigger-ad-hoc-conversation-tasks-${task.id}`}>{task.title}</a>
                      <small>{task.priority === "high" ? "Priority" : "Ad hoc"}</small>
                    </li>
                  )) : (
                    <li className="is-future-route-item">
                      <span className="route-item-marker" aria-hidden="true"></span>
                      <span>No conversation-generated tasks yet.</span>
                      <small>Empty</small>
                    </li>
                  )}
                </ul>
              </details>

              {orderedCheckpoints.map((checkpoint) => (
                <details key={checkpoint.key} className={`route-guidance-group ${checkpoint.key === currentCheckpoint.key ? "is-focus-group" : ""} ${checkpoint.status === "complete" ? "is-complete-group" : ""}`} open={checkpoint.key === currentCheckpoint.key}>
                  <summary>
                    <span>{checkpoint.label}</span>
                    <small>{checkpoint.requirements.filter((item) => item.complete).length}/{checkpoint.requirements.length}</small>
                  </summary>
                  <ul className="route-guidance-list">
                    {checkpoint.requirements
                      .slice()
                      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
                      .map((requirement) => (
                      <li key={requirement.label} className={`${requirement.complete ? "is-complete" : ""} ${checkpoint.key === currentCheckpoint.key ? "is-current-route-item" : "is-future-route-item"}`}>
                        <span className="route-item-marker" aria-hidden="true">{requirement.complete ? "\u2713" : ""}</span>
                        <a href={requirementHref(checkpoint.key, requirement)}>{requirement.label}</a>
                        <span className={`route-priority-badge priority-${requirement.priority}`}>{requirement.complete ? "Done" : requirement.priority === "high" ? "Priority" : requirement.priority === "medium" ? "Track" : "Later"}</span>
                        <span className="route-complexity" aria-label={`Complexity ${requirement.complexity} out of 3`}>
                          {[1, 2, 3].map((bar) => <span key={bar} className={`complexity-bar${bar <= requirement.complexity ? " is-filled" : ""}`} />)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </div>
        </SectionCard>
      </section>
    </div>
  );
}
