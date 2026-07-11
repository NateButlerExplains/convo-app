import type { BudgetItem, Decision, DebtItem, DocumentItem, ExpenseItem, Idea, Milestone, MoveMapData, Option, Risk, SnapshotRecord, Task } from "../types/move-map";

export type CockpitLiveState = {
  calendar: {
    totalEvents: number;
    nextLabel: string;
    nextDate: string;
    hasArrivalMilestone: boolean;
  };
  planning: {
    total: number;
    incomeActive: number;
    incomePlanned: number;
    housingActive: number;
    housingPlanned: number;
  };
  debt: {
    totalItems: number;
    totalBalance: number;
    activeCount: number;
    overdueCount: number;
    nextDueLabel: string;
  };
  expenses: {
    currentCount: number;
    currentTotal: number;
    spainCount: number;
    spainForecast: number;
    nextLabel: string;
  };
};

const STORAGE_KEYS = {
  milestones: "barcelona-move-map.milestones.v1",
  calendar: "barcelona-relocation-calendar-events",
  budget: "move-map:budget-view",
  decisions: "move-map:decisions-view",
  tasks: "move-map:tasks-view",
  options: "barcelona-options-v1",
  ideas: "barcelona-ideas-v1",
  risks: "barcelona-risks-v1",
  documents: "barcelona-move-map.documents.v1",
  snapshots: "barcelona-move-map.snapshots.v1",
  m4: "barcelona-m4-planning-v2",
  debt: "barcelona-debt-v1",
  expenses: "barcelona-expenses-v1",
} as const;

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readStoredJson(key: string): unknown | null {
  if (!canUseLocalStorage()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function readArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value.filter((item): item is T => !!item && typeof item === "object") : [];
}

function loadArrayFromStorage<T>(key: string, fallback: T[]): T[] {
  const stored = readStoredJson(key);
  if (stored === null) return fallback;
  return readArray<T>(stored);
}

function loadArrayFromWrapper<T>(key: string, prop: string, fallback: T[]): T[] {
  const stored = readStoredJson(key);
  if (stored === null) return fallback;
  if (Array.isArray(stored)) return readArray<T>(stored);
  if (stored && typeof stored === "object") {
    const value = (stored as Record<string, unknown>)[prop];
    if (Array.isArray(value)) return readArray<T>(value);
  }
  return fallback;
}

function loadM4State() {
  const stored = readStoredJson(STORAGE_KEYS.m4);
  if (stored === null) return { incomeRows: [] as Array<{ status?: string; archived?: boolean }>, housingRows: [] as Array<{ rank?: string; archived?: boolean }> };
  if (!stored || typeof stored !== "object") return { incomeRows: [] as Array<{ status?: string; archived?: boolean }>, housingRows: [] as Array<{ rank?: string; archived?: boolean }> };
  const source = stored as Record<string, unknown>;
  return {
    incomeRows: readArray<{ status?: string; archived?: boolean }>(source.incomeRows),
    housingRows: readArray<{ rank?: string; archived?: boolean }>(source.housingRows),
  };
}

function summarizeCalendarEvents(events: { date: string; label: string; type?: string }[]): CockpitLiveState["calendar"] {
  const ordered = [...events].sort((a, b) => a.date.localeCompare(b.date) || a.label.localeCompare(b.label));
  const next = ordered[0] ?? null;
  return {
    totalEvents: ordered.length,
    nextLabel: next?.label ?? "No calendar entries",
    nextDate: next?.date ?? "",
    hasArrivalMilestone: events.some((event) => event.type === "move milestone" && event.date.startsWith("2027-01")),
  };
}

function summarizePlanningState(m4State: { incomeRows: Array<{ status?: string; archived?: boolean }>; housingRows: Array<{ rank?: string; archived?: boolean }> }): CockpitLiveState["planning"] {
  const incomeRows = m4State.incomeRows.filter((row) => !row.archived);
  const housingRows = m4State.housingRows.filter((row) => !row.archived);
  const incomeActive = incomeRows.filter((row) => row.status === "Active").length;
  const incomePlanned = incomeRows.filter((row) => row.status === "Planned").length;
  const housingActive = housingRows.filter((row) => row.rank === "Gold").length;
  const housingPlanned = housingRows.filter((row) => row.rank !== "Gold").length;

  return {
    total: incomeRows.length + housingRows.length,
    incomeActive,
    incomePlanned,
    housingActive,
    housingPlanned,
  };
}

function summarizeDebtState(debtRows: DebtItem[]): CockpitLiveState["debt"] {
  const today = new Date().toISOString().slice(0, 10);
  const activeRows = debtRows.filter((row) => !row.archived && row.status !== "done");
  const totalBalance = activeRows.reduce((sum, row) => sum + (row.balance ?? 0), 0);
  const nextDue = [...activeRows]
    .filter((row) => row.due_date >= today)
    .sort((a, b) => a.due_date.localeCompare(b.due_date) || a.person.localeCompare(b.person))[0] ?? null;
  const overdueCount = activeRows.filter((row) => row.due_date < today).length;

  return {
    totalItems: activeRows.length,
    totalBalance,
    activeCount: activeRows.length,
    overdueCount,
    nextDueLabel: nextDue ? `${nextDue.person}  ${nextDue.label}` : "No upcoming debt due dates",
  };
}

function resolveExpensePerson(row: ExpenseItem): "Nate" | "Shae" {
  if (row.person) return row.person;
  return row.scope === "spain" ? "Shae" : "Nate";
}

function summarizeExpensesState(expenseRows: ExpenseItem[]): CockpitLiveState["expenses"] {
  const activeRows = expenseRows.filter((row) => !row.archived);
  const nateRows = activeRows.filter((row) => resolveExpensePerson(row) === "Nate");
  const shaeRows = activeRows.filter((row) => resolveExpensePerson(row) === "Shae");
  const nateTotal = nateRows.reduce((sum, row) => sum + (row.amount ?? 0), 0);
  const shaeTotal = shaeRows.reduce((sum, row) => sum + (row.amount ?? 0), 0);
  const nextRow = [...activeRows].sort((a, b) => resolveExpensePerson(a).localeCompare(resolveExpensePerson(b)) || a.kind.localeCompare(b.kind) || a.label.localeCompare(b.label))[0] ?? null;

  return {
    currentCount: nateRows.length,
    currentTotal: nateTotal,
    spainCount: shaeRows.length,
    spainForecast: shaeTotal,
    nextLabel: nextRow ? `${nextRow.label} · ${resolveExpensePerson(nextRow)}` : "No person expense rows yet",
  };
}

export function loadLiveSnapshot(baseData: MoveMapData, milestones: Milestone[]) {
  const budgetItems = loadArrayFromWrapper<BudgetItem>(STORAGE_KEYS.budget, "items", baseData.budget_items);
  const debtItems = loadArrayFromWrapper<DebtItem>(STORAGE_KEYS.debt, "debtItems", baseData.debt_items);
  const expenseItems = loadArrayFromWrapper<ExpenseItem>(STORAGE_KEYS.expenses, "expenseItems", baseData.expense_items);
  const decisions = loadArrayFromWrapper<Decision>(STORAGE_KEYS.decisions, "decisions", baseData.decisions);
  const tasks = loadArrayFromWrapper<Task>(STORAGE_KEYS.tasks, "tasks", baseData.tasks);
  const options = loadArrayFromStorage<Option>(STORAGE_KEYS.options, baseData.options);
  const ideas = loadArrayFromStorage<Idea>(STORAGE_KEYS.ideas, baseData.ideas);
  const risks = loadArrayFromStorage<Risk>(STORAGE_KEYS.risks, baseData.risks);
  const documents = loadArrayFromStorage<DocumentItem>(STORAGE_KEYS.documents, baseData.documents);
  const snapshots = loadArrayFromStorage<SnapshotRecord>(STORAGE_KEYS.snapshots, baseData.snapshots);
  const calendarEvents = loadArrayFromStorage<{ date: string; label: string } & Record<string, unknown>>(STORAGE_KEYS.calendar, []);
  const m4State = loadM4State();

  const roadmapData: MoveMapData = {
    ...baseData,
    milestones,
    roadmap_phases: baseData.roadmap_phases.map((phase) => ({
      ...phase,
      milestone_ids: milestones.filter((milestone) => milestone.phase_id === phase.id).map((milestone) => milestone.id),
    })),
    budget_items: budgetItems,
    debt_items: debtItems,
    expense_items: expenseItems,
    decisions,
    tasks,
    options,
    ideas,
    risks,
    documents,
    snapshots,
  };

  return {
    roadmapData,
    liveState: {
      calendar: summarizeCalendarEvents(calendarEvents),
      planning: summarizePlanningState(m4State),
      debt: summarizeDebtState(debtItems),
      expenses: summarizeExpensesState(expenseItems),
    },
  };
}
