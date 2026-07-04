import type { Confidence, DateString, WorkStatus } from "../types/move-map";

export function titleCase(value: string) { return value.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()); }
export function formatDate(value: DateString) { if (!value) return "TBD"; if (/^\d{4}-\d{2}$/.test(value)) return new Date(`${value}-02T00:00:00`).toLocaleString("en-US", { month: "short", year: "numeric" }); return value; }
export function formatCurrencyRange(low: number | null, high: number | null, currency: "USD" | "EUR") { const symbol = currency === "EUR" ? "€" : "$"; const fmt = (n: number) => `${symbol}${n.toLocaleString()}`; if (low == null && high == null) return "Range TBD"; if (low != null && high != null) return low === high ? fmt(low) : `${fmt(low)}-${fmt(high)}`; return low != null ? `from ${fmt(low)}` : `up to ${fmt(high as number)}`; }
export function confidenceLabel(confidence: Confidence) { return confidence === "low" ? "Early estimate" : confidence === "medium" ? "Some research" : "Source checked"; }
export function statusLabel(status: WorkStatus | string) { return titleCase(status); }
export function todayStamp() { return new Date().toISOString().slice(0, 10); }
