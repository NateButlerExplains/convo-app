import type { MoveMapData, Task } from "../types/move-map";
import type { CockpitLiveState } from "./live-snapshot";

export type RoutePage = "tasks" | "decisions" | "budget" | "housing" | "calendar";
export type RouteRequirement = { label: string; page: RoutePage; complete: boolean; taskId?: string };
export type RouteCheckpointStatus = "future" | "current" | "blocked" | "complete";
export type RouteCheckpoint = {
  key: string;
  label: string;
  status: RouteCheckpointStatus;
  requirements: RouteRequirement[];
};

function isActive(record: { archived?: boolean } | object) {
  return !("archived" in record && record.archived === true);
}

function taskDone(tasks: Task[], id: string) {
  return tasks.some((task) => isActive(task) && task.id === id && task.status === "done");
}

function taskBlocked(tasks: Task[], id: string) {
  return tasks.some((task) => isActive(task) && task.id === id && task.status === "blocked");
}

function decisionMade(decisions: MoveMapData["decisions"], id: string) {
  return decisions.some((decision) => isActive(decision) && decision.id === id && decision.status === "decided");
}

function hasPlannedBudget(items: MoveMapData["budget_items"]) {
  return items.some((item) => isActive(item) && (item.planned_amount ?? 0) > 0);
}

function stabilizationTaskDone(tasks: Task[]) {
  return tasks.some((task) => {
    const text = `${task.track} ${task.title}`.toLowerCase();
    return task.status === "done" && text.includes("stabilization");
  });
}

export function deriveRouteProgress(data: MoveMapData, liveState: CockpitLiveState) {
  const activeTasks = data.tasks.filter(isActive);
  const activeDecisions = data.decisions.filter(isActive);
  const activeBudgetItems = data.budget_items.filter(isActive);
  const definitions = [
    {
      key: "research",
      label: "Research",
      taskIds: ["task-family-priorities", "task-family-must-haves"],
      requirements: [
        { label: "Discuss family priorities for the Barcelona move", taskId: "task-family-priorities", page: "tasks", complete: taskDone(activeTasks, "task-family-priorities") },
        { label: "List family must-haves for housing and daily life", taskId: "task-family-must-haves", page: "tasks", complete: taskDone(activeTasks, "task-family-must-haves") },
      ],
    },
    {
      key: "visa",
      label: "Visa Path",
      taskIds: ["task-visa-assumptions", "task-visa-compare-options"],
      requirements: [
        { label: "Complete visa work/income assumptions task", taskId: "task-visa-assumptions", page: "tasks", complete: taskDone(activeTasks, "task-visa-assumptions") },
        { label: "Compare telework vs non-lucrative assumptions", taskId: "task-visa-compare-options", page: "tasks", complete: taskDone(activeTasks, "task-visa-compare-options") },
        { label: "Mark visa-path decision Decided", page: "decisions", complete: decisionMade(activeDecisions, "decision-visa-path") },
      ],
    },
    {
      key: "budget",
      label: "Budget Confidence",
      taskIds: ["task-budget-ranges", "task-budget-buffer"],
      requirements: [
        { label: "Complete budget-range research task", taskId: "task-budget-ranges", page: "tasks", complete: taskDone(activeTasks, "task-budget-ranges") },
        { label: "Decide family emergency buffer target", taskId: "task-budget-buffer", page: "tasks", complete: taskDone(activeTasks, "task-budget-buffer") },
        { label: "Enter a planned amount on the Budget page", page: "budget", complete: hasPlannedBudget(activeBudgetItems) },
      ],
    },
    {
      key: "documents",
      label: "Documents",
      taskIds: ["task-document-inventory", "task-document-deadlines"],
      requirements: [
        { label: "Complete document inventory and timing watch", taskId: "task-document-inventory", page: "tasks", complete: taskDone(activeTasks, "task-document-inventory") },
        { label: "Turn document inventory into deadline calendar", taskId: "task-document-deadlines", page: "tasks", complete: taskDone(activeTasks, "task-document-deadlines") },
      ],
    },
    {
      key: "housing",
      label: "Housing & Schools",
      taskIds: ["task-neighborhood-shortlist", "task-neighborhood-housing-filters", "task-school-timing", "task-school-question-list"],
      requirements: [
        { label: "Pick neighborhood candidates for comparison", taskId: "task-neighborhood-shortlist", page: "tasks", complete: taskDone(activeTasks, "task-neighborhood-shortlist") },
        { label: "Turn shortlist into housing filters", taskId: "task-neighborhood-housing-filters", page: "tasks", complete: taskDone(activeTasks, "task-neighborhood-housing-filters") },
        { label: "Map child age to preschool questions", taskId: "task-school-timing", page: "tasks", complete: taskDone(activeTasks, "task-school-timing") },
        { label: "Write school and childcare question list", taskId: "task-school-question-list", page: "tasks", complete: taskDone(activeTasks, "task-school-question-list") },
        { label: "Promote at least one housing lead to Gold", page: "housing", complete: liveState.planning.housingActive > 0 },
      ],
    },
    {
      key: "travel",
      label: "Travel",
      taskIds: ["task-arrival-checklist", "task-arrival-packet"],
      requirements: [
        { label: "Complete first-week arrival checklist", taskId: "task-arrival-checklist", page: "tasks", complete: taskDone(activeTasks, "task-arrival-checklist") },
        { label: "Assemble arrival packet and first-week routines", taskId: "task-arrival-packet", page: "tasks", complete: taskDone(activeTasks, "task-arrival-packet") },
      ],
    },
    {
      key: "arrival",
      label: "Arrival",
      taskIds: [],
      requirements: [
        { label: "Add a January 2027 move milestone to Calendar", page: "calendar", complete: liveState.calendar.hasArrivalMilestone },
      ],
    },
    {
      key: "stabilization",
      label: "Stabilization",
      taskIds: [],
      requirements: [
        { label: "Complete a task whose title or track includes stabilization", page: "tasks", complete: stabilizationTaskDone(activeTasks) },
      ],
    },
  ] as const;

  const firstIncomplete = definitions.findIndex((checkpoint) => checkpoint.requirements.some((requirement) => !requirement.complete));
  const currentIndex = firstIncomplete === -1 ? definitions.length - 1 : firstIncomplete;
  const checkpoints: RouteCheckpoint[] = definitions.map((checkpoint, index) => {
    const complete = checkpoint.requirements.every((requirement) => requirement.complete);
    const blocked = checkpoint.taskIds.some((id) => taskBlocked(activeTasks, id));
    const status: RouteCheckpointStatus = complete
      ? "complete"
      : index === currentIndex
        ? blocked ? "blocked" : "current"
        : "future";
    return { key: checkpoint.key, label: checkpoint.label, status, requirements: [...checkpoint.requirements] };
  });

  return {
    checkpoints,
    currentIndex,
    current: checkpoints[currentIndex],
    next: checkpoints.slice(currentIndex + 1).find((checkpoint) => checkpoint.status !== "complete"),
    completedCount: checkpoints.filter((checkpoint) => checkpoint.status === "complete").length,
  };
}
