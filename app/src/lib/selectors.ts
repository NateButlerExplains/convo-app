import type { BudgetItem, Decision, DocumentItem, ID, Milestone, MoveMapData, Risk, RoadmapPhase, Task } from "../types/move-map";
import { formatDate } from "./formatters";
import type { CockpitLiveState } from "./live-snapshot";

export type CockpitWidgetDensity = "compact" | "balanced" | "expanded";

function byDate<T extends { due_date?: string; target_date?: string }>(items: T[]) {
  return [...items].sort((a, b) => (a.due_date || a.target_date || "9999").localeCompare(b.due_date || b.target_date || "9999"));
}

function workStatusRank(status: string) {
  if (status === "in_progress") return 0;
  if (status === "waiting") return 1;
  if (status === "blocked") return 2;
  if (status === "not_started") return 3;
  return 4;
}

function decisionRank(decision: Decision) {
  const status = decision.status === "proposed" ? 0 : decision.status === "revisiting" ? 1 : 2;
  const readiness = decision.readiness === "open_question" ? 0 : decision.readiness === "options_listed" ? 1 : decision.readiness === "comparing" ? 2 : decision.readiness === "leaning" ? 3 : 4;
  return status * 10 + readiness;
}

function ideaRank(priority: string) {
  if (priority === "high") return 0;
  if (priority === "medium") return 1;
  return 2;
}

function riskRank(risk: Risk) {
  const status = risk.status === "mitigating" ? 0 : risk.status === "watching" ? 1 : 2;
  const impact = risk.impact === "high" ? 0 : risk.impact === "medium" ? 1 : risk.impact === "low" ? 2 : 3;
  const likelihood = risk.likelihood === "high" ? 0 : risk.likelihood === "medium" ? 1 : risk.likelihood === "low" ? 2 : 3;

  return status * 100 + impact * 10 + likelihood;
}

function riskPressure(risk: Risk) {
  const statusWeight = risk.status === "mitigating" ? 3 : risk.status === "watching" ? 2 : 1;
  const impactWeight = risk.impact === "high" ? 3 : risk.impact === "medium" ? 2 : risk.impact === "low" ? 1 : 0;
  const likelihoodWeight = risk.likelihood === "high" ? 3 : risk.likelihood === "medium" ? 2 : risk.likelihood === "low" ? 1 : 0;

  return statusWeight + impactWeight + likelihoodWeight;
}

export function getByIds<T extends { id: ID }>(items: T[], ids: ID[]) {
  return ids.map((id) => items.find((item) => item.id === id)).filter(Boolean) as T[];
}

export function activeRoadmapPhases(data: MoveMapData): RoadmapPhase[] {
  return data.roadmap_phases.filter((phase) => phase.status === "in_progress");
}

export function currentRoadmapPhase(data: MoveMapData): RoadmapPhase | undefined {
  const activePhases = activeRoadmapPhases(data);
  if (activePhases.length === 0) return undefined;
  if (activePhases.length === 1) return activePhases[0];

  return [...activePhases].sort((a, b) => a.start_date.localeCompare(b.start_date) || a.end_date.localeCompare(b.end_date) || a.title.localeCompare(b.title))[0];
}

export function phaseMilestones(data: MoveMapData, phaseId: ID): Milestone[] {
  return data.milestones.filter((milestone) => milestone.phase_id === phaseId);
}

export function phaseMilestoneProgress(data: MoveMapData, phaseId: ID) {
  const milestones = phaseMilestones(data, phaseId);
  const completed = milestones.filter((milestone) => milestone.status === "done").length;
  const inProgress = milestones.filter((milestone) => milestone.status === "in_progress").length;
  const blocked = milestones.filter((milestone) => milestone.status === "blocked").length;
  const remaining = milestones.filter((milestone) => milestone.status !== "done").length;

  return { total: milestones.length, completed, inProgress, blocked, remaining };
}

export function openWorkTotals(data: MoveMapData) {
  const openTasks = data.tasks.filter((task) => task.status !== "done").length;
  const openDocuments = data.documents.filter((document) => document.status !== "done").length;
  const openDecisions = data.decisions.filter((decision) => decision.status !== "decided").length;
  const openRisks = data.risks.filter((risk) => risk.status !== "resolved").length;
  const openMilestones = data.milestones.filter((milestone) => milestone.status !== "done").length;

  return {
    openTasks,
    openDocuments,
    openDecisions,
    openRisks,
    openMilestones,
    total: openTasks + openDocuments + openDecisions + openRisks + openMilestones,
  };
}

export function topOpenDecisions(data: MoveMapData): Decision[] {
  return [...data.decisions]
    .filter((decision) => decision.status !== "decided")
    .sort((a, b) => decisionRank(a) - decisionRank(b) || a.title.localeCompare(b.title))
    .slice(0, 4);
}

export function upcomingTasks(data: MoveMapData): Task[] {
  return [...data.tasks]
    .filter((task) => task.status !== "done")
    .sort((a, b) => (a.due_date || "9999").localeCompare(b.due_date || "9999") || workStatusRank(a.status) - workStatusRank(b.status) || a.title.localeCompare(b.title))
    .slice(0, 5);
}

export function keyRisks(data: MoveMapData): Risk[] {
  return [...data.risks]
    .filter((risk) => risk.status !== "resolved")
    .sort((a, b) => riskRank(a) - riskRank(b) || b.source_ids.length - a.source_ids.length || a.title.localeCompare(b.title))
    .slice(0, 4);
}

export function documentWatch(data: MoveMapData): DocumentItem[] {
  return [...data.documents]
    .filter((document) => document.status !== "done")
    .sort((a, b) => (a.due_date || "9999").localeCompare(b.due_date || "9999") || workStatusRank(a.status) - workStatusRank(b.status) || a.name.localeCompare(b.name))
    .slice(0, 5);
}

export function conversationFocus(data: MoveMapData) {
  return [...data.ideas]
    .filter((idea) => !idea.discussed)
    .sort((a, b) => ideaRank(a.priority) - ideaRank(b.priority) || a.topic.localeCompare(b.topic) || a.prompt.localeCompare(b.prompt))
    .slice(0, 4);
}

export function budgetTotals(items: BudgetItem[], frequency: BudgetItem["frequency"]) {
  return items.filter((i) => i.frequency === frequency).reduce((sum, item) => ({ low: sum.low + (item.estimate_low || 0), high: sum.high + (item.estimate_high || 0) }), { low: 0, high: 0 });
}

function formatPhaseState(phaseCount: number, aggregateProgress: { completed: number; total: number; inProgress: number; blocked: number; remaining: number }) {
  if (phaseCount === 0) return "No roadmap phase is marked in progress";
  if (phaseCount === 1) return `${aggregateProgress.completed}/${aggregateProgress.total} milestones complete`;
  return `${phaseCount} active phases · ${aggregateProgress.completed}/${aggregateProgress.total} milestones complete`;
}

function summarizeActivePhases(activePhases: RoadmapPhase[]) {
  return activePhases.map((phase) => phase.title).join(" · ");
}

export function cockpitSignals(data: MoveMapData, liveState?: CockpitLiveState) {
  const activePhases = activeRoadmapPhases(data);
  const currentPhase = currentRoadmapPhase(data);
  const openWork = openWorkTotals(data);
  const aggregateProgress = activePhases.reduce(
    (sum, phase) => {
      const progress = phaseMilestoneProgress(data, phase.id);
      return {
        total: sum.total + progress.total,
        completed: sum.completed + progress.completed,
        inProgress: sum.inProgress + progress.inProgress,
        blocked: sum.blocked + progress.blocked,
        remaining: sum.remaining + progress.remaining,
      };
    },
    { total: 0, completed: 0, inProgress: 0, blocked: 0, remaining: 0 },
  );
  const tasks = upcomingTasks(data);
  const decisions = topOpenDecisions(data);
  const risks = keyRisks(data);
  const docs = documentWatch(data);
  const activePhaseLabel = activePhases.length > 0 ? summarizeActivePhases(activePhases) : "No active phases";
  const calendarLabel = liveState?.calendar.totalEvents ? liveState.calendar.nextLabel : "No calendar entries";
  const calendarDetail = liveState?.calendar.totalEvents
    ? `${liveState.calendar.totalEvents} events · next ${formatDate(liveState.calendar.nextDate)}`
    : "Timeline activity appears here when the calendar changes";
  const planningLabel = liveState?.planning.total
    ? `${liveState.planning.incomeActive} active income · ${liveState.planning.housingActive} housing leads`
    : "No planning rows yet";
  const planningDetail = liveState?.planning.total
    ? `${liveState.planning.incomePlanned} planned income · ${liveState.planning.housingPlanned} planned housing`
    : "The income and housing lanes will show up here once they are added";

  return [
    {
      label: "Active phases",
      value: activePhaseLabel,
      detail: formatPhaseState(activePhases.length, aggregateProgress),
    },
    {
      label: "Open load",
      value: `${openWork.total} unresolved items`,
      detail: `${openWork.openMilestones} milestones · ${openWork.openTasks} tasks · ${openWork.openDecisions} decisions · ${openWork.openRisks} risks · ${openWork.openDocuments} documents`,
    },
    {
      label: "Visible load",
      value: `${aggregateProgress.remaining} open milestones`,
      detail: `${aggregateProgress.inProgress} in progress · ${aggregateProgress.blocked} blocked · ${aggregateProgress.completed} complete`,
    },
    {
      label: "Next queued item",
      value: tasks[0]?.title ?? decisions[0]?.title ?? "Nothing urgent",
      detail: tasks[0]
        ? `${tasks[0].track} · due ${tasks[0].due_date}`
        : decisions[0]
          ? `${decisions[0].readiness} · ${decisions[0].status}`
          : activePhases.length > 0
            ? `Queued against ${currentPhase?.title ?? "the active phases"}`
            : "No queued item is ahead of the current checkpoint",
    },
    {
      label: "Watchlist",
      value: `${risks.length} risks, ${docs.length} documents`,
      detail: activePhases.length > 0 ? `Signals grouped across ${activePhases.length} active phases` : "Signals grouped from the current snapshot",
    },
    {
      label: "Calendar pulse",
      value: calendarLabel,
      detail: calendarDetail,
    },
    {
      label: "Planning lane",
      value: planningLabel,
      detail: planningDetail,
    },
  ];
}

export function cockpitWidgetDensity(data: MoveMapData, liveState?: CockpitLiveState): CockpitWidgetDensity {
  const activePhases = activeRoadmapPhases(data);
  const backlog = openWorkTotals(data);
  const livePressure = Math.ceil(((liveState?.calendar.totalEvents ?? 0) + (liveState?.planning.total ?? 0)) / 4);

  if (activePhases.length === 0) {
    if (backlog.total + livePressure >= 24) return "expanded";
    if (backlog.total + livePressure >= 12) return "balanced";
    return "compact";
  }

  const phaseComplexity = Math.max(0, activePhases.length - 1) * 2;
  const pressure = backlog.total + phaseComplexity + livePressure;

  if (pressure >= 24) return "expanded";
  if (pressure >= 12) return "balanced";
  return "compact";
}
