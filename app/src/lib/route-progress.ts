import type { MoveMapData, Task } from "../types/move-map";
import type { CockpitLiveState } from "./live-snapshot";

export type RoutePage = "tasks" | "decisions" | "budget" | "housing" | "calendar";
export type RoutePriority = "high" | "medium" | "low";
export type RouteComplexity = 1 | 2 | 3;

export type RouteRequirement = {
  label: string;
  page: RoutePage;
  complete: boolean;
  taskId?: string;
  priority: RoutePriority;
  complexity: RouteComplexity;
};

export type RouteCheckpointStatus = "future" | "current" | "blocked" | "complete";

export type RouteCheckpoint = {
  key: string;
  label: string;
  status: RouteCheckpointStatus;
  requirements: RouteRequirement[];
};

const priorityOrder: Record<RoutePriority, number> = { high: 0, medium: 1, low: 2 };

function byPriority(a: RouteRequirement, b: RouteRequirement) {
  return priorityOrder[a.priority] - priorityOrder[b.priority];
}

function priorityLabel(priority: RoutePriority) {
  if (priority === "high") return "Priority";
  if (priority === "medium") return "Track";
  return "Later";
}

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
        { label: "Discuss family priorities for the Barcelona move", taskId: "task-family-priorities", page: "tasks" as const, complete: taskDone(activeTasks, "task-family-priorities"), priority: "high" as RoutePriority, complexity: 1 as RouteComplexity },
        { label: "List family must-haves for housing and daily life", taskId: "task-family-must-haves", page: "tasks" as const, complete: taskDone(activeTasks, "task-family-must-haves"), priority: "high" as RoutePriority, complexity: 2 as RouteComplexity },
      ],
    },
    {
      key: "visa",
      label: "Visa Path",
      taskIds: ["task-visa-assumptions", "task-visa-compare-options"],
      requirements: [
        { label: "Write income/work assumptions for visa consult", taskId: "task-visa-assumptions", page: "tasks" as const, complete: taskDone(activeTasks, "task-visa-assumptions"), priority: "high" as RoutePriority, complexity: 2 as RouteComplexity },
        { label: "Compare telework vs non-lucrative assumptions", taskId: "task-visa-compare-options", page: "tasks" as const, complete: taskDone(activeTasks, "task-visa-compare-options"), priority: "high" as RoutePriority, complexity: 3 as RouteComplexity },
        { label: "Mark visa-path decision Decided", page: "decisions" as const, complete: decisionMade(activeDecisions, "decision-visa-path"), priority: "high" as RoutePriority, complexity: 3 as RouteComplexity },
      ],
    },
    {
      key: "budget",
      label: "Budget Confidence",
      taskIds: ["task-budget-ranges", "task-budget-buffer"],
      requirements: [
        { label: "Research current cost ranges for first budget pass", taskId: "task-budget-ranges", page: "tasks" as const, complete: taskDone(activeTasks, "task-budget-ranges"), priority: "high" as RoutePriority, complexity: 3 as RouteComplexity },
        { label: "Decide family emergency buffer target", taskId: "task-budget-buffer", page: "tasks" as const, complete: taskDone(activeTasks, "task-budget-buffer"), priority: "high" as RoutePriority, complexity: 2 as RouteComplexity },
        { label: "Enter a planned amount on the Budget page", page: "budget" as const, complete: hasPlannedBudget(activeBudgetItems), priority: "medium" as RoutePriority, complexity: 1 as RouteComplexity },
      ],
    },
    {
      key: "documents",
      label: "Documents",
      taskIds: ["task-document-inventory", "task-document-deadlines"],
      requirements: [
        { label: "Create document inventory and timing watch", taskId: "task-document-inventory", page: "tasks" as const, complete: taskDone(activeTasks, "task-document-inventory"), priority: "high" as RoutePriority, complexity: 2 as RouteComplexity },
        { label: "Turn document inventory into deadline calendar", taskId: "task-document-deadlines", page: "tasks" as const, complete: taskDone(activeTasks, "task-document-deadlines"), priority: "high" as RoutePriority, complexity: 3 as RouteComplexity },
        { label: "Update passport validity for each family member", page: "tasks" as const, complete: false, priority: "medium" as RoutePriority, complexity: 1 as RouteComplexity },
        { label: "Arrange apostilles and certified translations", page: "tasks" as const, complete: false, priority: "medium" as RoutePriority, complexity: 2 as RouteComplexity },
      ],
    },
    {
      key: "housing",
      label: "Housing & Schools",
      taskIds: ["task-neighborhood-shortlist", "task-neighborhood-housing-filters", "task-school-timing", "task-school-question-list"],
      requirements: [
        { label: "Pick 3-4 neighborhood candidates for comparison", taskId: "task-neighborhood-shortlist", page: "tasks" as const, complete: taskDone(activeTasks, "task-neighborhood-shortlist"), priority: "high" as RoutePriority, complexity: 2 as RouteComplexity },
        { label: "Turn shortlist into housing filters", taskId: "task-neighborhood-housing-filters", page: "tasks" as const, complete: taskDone(activeTasks, "task-neighborhood-housing-filters"), priority: "high" as RoutePriority, complexity: 2 as RouteComplexity },
        { label: "Map child age to preschool questions", taskId: "task-school-timing", page: "tasks" as const, complete: taskDone(activeTasks, "task-school-timing"), priority: "high" as RoutePriority, complexity: 2 as RouteComplexity },
        { label: "Write school and childcare question list", taskId: "task-school-question-list", page: "tasks" as const, complete: taskDone(activeTasks, "task-school-question-list"), priority: "high" as RoutePriority, complexity: 2 as RouteComplexity },
        { label: "Promote at least one housing lead to Gold", page: "housing" as const, complete: liveState.planning.housingActive > 0, priority: "medium" as RoutePriority, complexity: 3 as RouteComplexity },
        { label: "Research school enrollment timelines and forms", page: "tasks" as const, complete: false, priority: "medium" as RoutePriority, complexity: 2 as RouteComplexity },
      ],
    },
    {
      key: "travel",
      label: "Travel",
      taskIds: ["task-arrival-checklist", "task-arrival-packet"],
      requirements: [
        { label: "Draft first-week arrival checklist", taskId: "task-arrival-checklist", page: "tasks" as const, complete: taskDone(activeTasks, "task-arrival-checklist"), priority: "high" as RoutePriority, complexity: 2 as RouteComplexity },
        { label: "Assemble arrival packet and first-week routines", taskId: "task-arrival-packet", page: "tasks" as const, complete: taskDone(activeTasks, "task-arrival-packet"), priority: "high" as RoutePriority, complexity: 3 as RouteComplexity },
        { label: "Research flight options and seasonal pricing", page: "tasks" as const, complete: false, priority: "medium" as RoutePriority, complexity: 2 as RouteComplexity },
        { label: "Research temporary lodging options near arrival", page: "tasks" as const, complete: false, priority: "medium" as RoutePriority, complexity: 2 as RouteComplexity },
        { label: "Plan pet / belongings shipping if applicable", page: "tasks" as const, complete: false, priority: "medium" as RoutePriority, complexity: 2 as RouteComplexity },
      ],
    },
    {
      key: "arrival",
      label: "Arrival",
      taskIds: [],
      requirements: [
        { label: "Add a January 2027 move milestone to Calendar", page: "calendar" as const, complete: liveState.calendar.hasArrivalMilestone, priority: "medium" as RoutePriority, complexity: 1 as RouteComplexity },
        { label: "Identify first-priority padron registration documents", page: "tasks" as const, complete: false, priority: "medium" as RoutePriority, complexity: 2 as RouteComplexity },
        { label: "Confirm TSI healthcare card eligibility timeline", page: "tasks" as const, complete: false, priority: "medium" as RoutePriority, complexity: 2 as RouteComplexity },
        { label: "Check bank / SIM / utility foreign-resident options", page: "tasks" as const, complete: false, priority: "low" as RoutePriority, complexity: 2 as RouteComplexity },
      ],
    },
    {
      key: "stabilization",
      label: "Stabilization",
      taskIds: [],
      requirements: [
        { label: "Complete a stabilization-related task", page: "tasks" as const, complete: stabilizationTaskDone(activeTasks), priority: "low" as RoutePriority, complexity: 1 as RouteComplexity },
        { label: "Establish shared-purchase / shared-account systems", page: "tasks" as const, complete: false, priority: "low" as RoutePriority, complexity: 3 as RouteComplexity },
        { label: "Set up recurring budget check-in cadence", page: "tasks" as const, complete: false, priority: "low" as RoutePriority, complexity: 2 as RouteComplexity },
      ],
    },
  ] as const;

  const firstIncomplete = definitions.findIndex((checkpoint) => checkpoint.requirements.some((requirement) => !requirement.complete));
  const currentIndex = firstIncomplete === -1 ? definitions.length - 1 : firstIncomplete;
  const checkpoints: RouteCheckpoint[] = definitions.map((checkpoint) => {
    const complete = checkpoint.requirements.every((requirement) => requirement.complete);
    const blocked = checkpoint.taskIds.some((id) => taskBlocked(activeTasks, id));
    const status: RouteCheckpointStatus = complete
      ? "complete"
      : checkpoint.key === definitions[currentIndex].key
        ? blocked ? "blocked" : "current"
        : "future";
    return {
      key: checkpoint.key,
      label: checkpoint.label,
      status,
      requirements: [...checkpoint.requirements].sort(byPriority),
    };
  });

  return {
    checkpoints,
    currentIndex,
    current: checkpoints[currentIndex],
    next: checkpoints.slice(currentIndex + 1).find((checkpoint) => checkpoint.status !== "complete"),
    completedCount: checkpoints.filter((checkpoint) => checkpoint.status === "complete").length,
  };
}

export { priorityLabel };
