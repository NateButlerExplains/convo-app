import type { BudgetItem, Decision, DocumentItem, ID, MoveMapData, Risk, Task } from "../types/move-map";

function byDate<T extends { due_date?: string; target_date?: string }>(items: T[]) {
  return [...items].sort((a, b) => (a.due_date || a.target_date || "9999").localeCompare(b.due_date || b.target_date || "9999"));
}
export function getByIds<T extends { id: ID }>(items: T[], ids: ID[]) { return ids.map((id) => items.find((item) => item.id === id)).filter(Boolean) as T[]; }
export function topOpenDecisions(data: MoveMapData): Decision[] { return data.decisions.filter((d) => d.status !== "decided").slice(0, 4); }
export function upcomingTasks(data: MoveMapData): Task[] { return byDate(data.tasks.filter((t) => t.status !== "done")).slice(0, 5); }
export function keyRisks(data: MoveMapData): Risk[] { return data.risks.filter((r) => r.status !== "resolved").slice(0, 4); }
export function documentWatch(data: MoveMapData): DocumentItem[] { return byDate(data.documents.filter((d) => d.status !== "done")).slice(0, 5); }
export function conversationFocus(data: MoveMapData) { return data.ideas.filter((i) => !i.discussed).sort((a, b) => (a.priority === "high" ? -1 : 0) - (b.priority === "high" ? -1 : 0)).slice(0, 4); }
export function budgetTotals(items: BudgetItem[], frequency: BudgetItem["frequency"]) { return items.filter((i) => i.frequency === frequency).reduce((sum, item) => ({ low: sum.low + (item.estimate_low || 0), high: sum.high + (item.estimate_high || 0) }), { low: 0, high: 0 }); }
