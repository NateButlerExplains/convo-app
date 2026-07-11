import { useEffect, useMemo, useState } from "react";
import type { BudgetItem, MoveMapData } from "../types/move-map";
import { formatCurrencyRange, formatDate, titleCase } from "../lib/formatters";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { ConfidenceBadge } from "../components/ConfidenceBadge";
import { notifyMoveMapStateChanged } from "../lib/state-events";

type BudgetDraft = {
  label: string;
  category: string;
  phase: string;
  estimateLow: string;
  estimateHigh: string;
  plannedAmount: string;
  actualAmount: string;
  currency: BudgetItem["currency"];
  frequency: BudgetItem["frequency"];
  confidence: BudgetItem["confidence"];
  dateChecked: string;
  notes: string;
};

type EditableBudgetItem = BudgetItem & { id: string; archived: boolean };

type BudgetStorageState = {
  items: EditableBudgetItem[];
  draft: BudgetDraft;
};

const STORAGE_KEY = "move-map:budget-view";

const blankDraft: BudgetDraft = {
  label: "",
  category: "",
  phase: "",
  estimateLow: "",
  estimateHigh: "",
  plannedAmount: "",
  actualAmount: "",
  currency: "USD",
  frequency: "one_time",
  confidence: "medium",
  dateChecked: "",
  notes: "",
};

function loadStoredState(): BudgetStorageState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<BudgetStorageState>;
    return {
      items: Array.isArray(parsed.items)
        ? parsed.items.map((item) => ({ ...item, archived: item.archived ?? false }))
        : [],
      draft: parsed.draft ?? blankDraft,
    };
  } catch {
    return null;
  }
}

function parseAmount(value: string) {
  if (!value.trim()) return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

function createBudgetItem(draft: BudgetDraft): EditableBudgetItem {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    category: draft.category.trim() || "Uncategorized",
    label: draft.label.trim() || "Untitled budget item",
    phase: draft.phase.trim() || "TBD",
    estimate_low: parseAmount(draft.estimateLow),
    estimate_high: parseAmount(draft.estimateHigh),
    planned_amount: parseAmount(draft.plannedAmount),
    actual_amount: parseAmount(draft.actualAmount),
    currency: draft.currency,
    frequency: draft.frequency,
    confidence: draft.confidence,
    date_checked: draft.dateChecked || new Date().toISOString().slice(0, 10),
    source_ids: [],
    related_risk_ids: [],
    notes: draft.notes.trim(),
    archived: false,
  };
}

function draftFromItem(item: EditableBudgetItem): BudgetDraft {
  return {
    label: item.label,
    category: item.category,
    phase: item.phase,
    estimateLow: item.estimate_low == null ? "" : String(item.estimate_low),
    estimateHigh: item.estimate_high == null ? "" : String(item.estimate_high),
    plannedAmount: item.planned_amount == null ? "" : String(item.planned_amount),
    actualAmount: item.actual_amount == null ? "" : String(item.actual_amount),
    currency: item.currency,
    frequency: item.frequency,
    confidence: item.confidence,
    dateChecked: item.date_checked,
    notes: item.notes,
  };
}

function sumRange(items: EditableBudgetItem[], frequency: BudgetItem["frequency"]) {
  return items
    .filter((item) => item.frequency === frequency)
    .reduce(
      (acc, item) => {
        acc.low += item.estimate_low ?? 0;
        acc.high += item.estimate_high ?? 0;
        return acc;
      },
      { low: 0, high: 0 },
    );
}

export function BudgetView({ data }: { data: MoveMapData }) {
  const [items, setItems] = useState<EditableBudgetItem[]>(() => loadStoredState()?.items ?? data.budget_items.map((item) => ({ ...item, archived: false })));
  const [draft, setDraft] = useState<BudgetDraft>(blankDraft);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const state: BudgetStorageState = { items, draft };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, draft }));
    notifyMoveMapStateChanged();
  }, [items, draft]);

  const activeItems = useMemo(() => items.filter((item) => !item.archived), [items]);
  const archivedItems = useMemo(() => items.filter((item) => item.archived), [items]);
  const oneTime = useMemo(() => sumRange(activeItems, "one_time"), [activeItems]);
  const monthly = useMemo(() => sumRange(activeItems, "monthly"), [activeItems]);
  const annual = useMemo(() => sumRange(activeItems, "annual"), [activeItems]);

  const openCreateModal = () => {
    setEditingId(null);
    setDraft(blankDraft);
    setIsModalOpen(true);
  };

  const openEditModal = (item: EditableBudgetItem) => {
    setEditingId(item.id);
    setDraft(draftFromItem(item));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setDraft(blankDraft);
  };

  const saveDraft = () => {
    if (!draft.label.trim()) return;

    if (editingId) {
      setItems((current) =>
        current.map((item) =>
          item.id === editingId ? { ...item, ...createBudgetItem(draft), id: item.id, archived: item.archived } : item,
        ),
      );
    } else {
      setItems((current) => [createBudgetItem(draft), ...current]);
    }

    closeModal();
  };

  const archiveItem = (id: string, archived: boolean) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, archived } : item)));
    if (editingId === id && archived) closeModal();
  };

  const removeItem = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
    if (editingId === id) closeModal();
  };

  const deleteArchivedItems = () => {
    setItems((current) => current.filter((item) => !item.archived));
    if (editingId && items.find((item) => item.id === editingId)?.archived) closeModal();
  };

  return (
    <div className="view spreadsheet-view">
      <PageHeader eyebrow="Budget" title="Budget planner">
        Start from a blank slate, add the items you want to test, and archive old ranges when you want the live board to stay focused.
      </PageHeader>

      <section className="hero-card">
        <div>
          <h2>Budget planner</h2>
          <p>Keep active cost ranges in the ledger, then move older assumptions into the archive instead of leaving them in the main table.</p>
        </div>
        <div className="page-actions" aria-label="Budget actions">
          <button className="chip button-primary" type="button" onClick={openCreateModal}>
            New budget item
          </button>
        </div>
      </section>

      <section className="summary-strip">
        <div>
          <span>One-time</span>
          <strong>{formatCurrencyRange(oneTime.low, oneTime.high, "USD")}</strong>
        </div>
        <div>
          <span>Monthly</span>
          <strong>{formatCurrencyRange(monthly.low, monthly.high, "USD")}</strong>
        </div>
        <div>
          <span>Annual</span>
          <strong>{formatCurrencyRange(annual.low, annual.high, "USD")}</strong>
        </div>
      </section>

      <SectionCard title="Budget ledger" kicker="Editable planning rows">
        <div className="expense-table-wrap">
          <table className="planning-table expense-table budget-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Label</th>
                <th>Phase</th>
                <th>Estimate</th>
                <th>Planned</th>
                <th>Actual</th>
                <th>Frequency</th>
                <th>Confidence</th>
                <th>Checked</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeItems.length === 0 ? (
                <tr>
                  <td colSpan={11} className="empty-state">No active budget items yet.</td>
                </tr>
              ) : (
                activeItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.category}</td>
                    <td>{item.label}</td>
                    <td>{item.phase}</td>
                    <td>{formatCurrencyRange(item.estimate_low, item.estimate_high, item.currency)}</td>
                    <td>{item.planned_amount == null ? "—" : formatCurrencyRange(item.planned_amount, item.planned_amount, item.currency)}</td>
                    <td>{item.actual_amount == null ? "—" : formatCurrencyRange(item.actual_amount, item.actual_amount, item.currency)}</td>
                    <td>{titleCase(item.frequency)}</td>
                    <td><ConfidenceBadge confidence={item.confidence} /></td>
                    <td>{formatDate(item.date_checked)}</td>
                    <td>{item.notes || "—"}</td>
                    <td className="row-actions">
                      <details className="row-actions-menu">
                        <summary aria-label="Row actions" title="Row actions">⋯</summary>
                        <div className="row-actions-popover" role="menu">
                          <button type="button" role="menuitem" onClick={() => openEditModal(item)}>Edit</button>
                          <button type="button" role="menuitem" onClick={() => archiveItem(item.id, true)}>Archive</button>
                          <button type="button" role="menuitem" onClick={() => removeItem(item.id)}>Delete</button>
                        </div>
                      </details>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <details className="archive-list">
        <summary>Archived budget items ({archivedItems.length})</summary>
        <div className="archive-body">
          {archivedItems.length === 0 ? (
            <p className="empty-state">No archived budget items yet.</p>
          ) : (
            <>
              {archivedItems.map((item) => (
                <div key={item.id} className="archive-row">
                  <div>
                    <strong>{item.label}</strong>
                    <span>{item.category} · {formatCurrencyRange(item.estimate_low, item.estimate_high, item.currency)}</span>
                  </div>
                  <div className="page-actions archive-actions">
                    <button type="button" className="chip" onClick={() => openEditModal(item)}>Edit</button>
                    <button type="button" className="chip" onClick={() => archiveItem(item.id, false)}>Restore</button>
                    <button type="button" className="chip modal-delete" onClick={() => removeItem(item.id)}>Delete</button>
                  </div>
                </div>
              ))}
              <div className="archive-row archive-row-summary">
                <div>
                  <strong>Delete all archived budget items</strong>
                  <span>Clear old planning ranges once you no longer need them for comparison.</span>
                </div>
                <div className="page-actions archive-actions">
                  <button type="button" className="chip modal-delete" onClick={deleteArchivedItems}>
                    Delete all
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </details>

      {isModalOpen && (
        <div className="modal-backdrop" role="presentation" onClick={closeModal}>
          <div className="modal-card" role="dialog" aria-modal="true" aria-label={editingId ? "Edit budget item" : "Add new budget item"} onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div>
                <p className="card-kicker">{editingId ? "Edit entry" : "New entry"}</p>
                <h3>{editingId ? draft.label || "Edit budget item" : "Add a budget item"}</h3>
              </div>
              <div className="modal-actions">
                <button type="button" className="chip modal-close" onClick={closeModal}>Close</button>
                {editingId && <button type="button" className="chip modal-delete" onClick={() => removeItem(editingId)}>Delete</button>}
              </div>
            </div>
            <div className="modal-body expense-modal-body">
              <label>
                Label
                <input value={draft.label} onChange={(e) => setDraft((current) => ({ ...current, label: e.target.value }))} placeholder="Move cost, rent, flights, school fees" />
              </label>
              <label>
                Category
                <input value={draft.category} onChange={(e) => setDraft((current) => ({ ...current, category: e.target.value }))} placeholder="housing, travel, legal" />
              </label>
              <label>
                Phase
                <input value={draft.phase} onChange={(e) => setDraft((current) => ({ ...current, phase: e.target.value }))} placeholder="research, move, settle" />
              </label>
              <label>
                Estimate low
                <input type="number" value={draft.estimateLow} onChange={(e) => setDraft((current) => ({ ...current, estimateLow: e.target.value }))} />
              </label>
              <label>
                Estimate high
                <input type="number" value={draft.estimateHigh} onChange={(e) => setDraft((current) => ({ ...current, estimateHigh: e.target.value }))} />
              </label>
              <label>
                Planned amount
                <input type="number" value={draft.plannedAmount} onChange={(e) => setDraft((current) => ({ ...current, plannedAmount: e.target.value }))} />
              </label>
              <label>
                Actual amount
                <input type="number" value={draft.actualAmount} onChange={(e) => setDraft((current) => ({ ...current, actualAmount: e.target.value }))} />
              </label>
              <label>
                Currency
                <select value={draft.currency} onChange={(e) => setDraft((current) => ({ ...current, currency: e.target.value as BudgetItem["currency"] }))}>
                  <option value="USD">USD</option>
                </select>
              </label>
              <label>
                Frequency
                <select value={draft.frequency} onChange={(e) => setDraft((current) => ({ ...current, frequency: e.target.value as BudgetItem["frequency"] }))}>
                  <option value="one_time">one_time</option>
                  <option value="monthly">monthly</option>
                  <option value="annual">annual</option>
                  <option value="unknown">unknown</option>
                </select>
              </label>
              <label>
                Confidence
                <select value={draft.confidence} onChange={(e) => setDraft((current) => ({ ...current, confidence: e.target.value as BudgetItem["confidence"] }))}>
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </select>
              </label>
              <label>
                Last estimated
                <input type="date" value={draft.dateChecked} onChange={(e) => setDraft((current) => ({ ...current, dateChecked: e.target.value }))} />
              </label>
              <label>
                Notes
                <textarea rows={4} value={draft.notes} onChange={(e) => setDraft((current) => ({ ...current, notes: e.target.value }))} placeholder="Anything worth remembering about the range" />
              </label>
              <button className="primary-button" type="button" onClick={saveDraft}>{editingId ? "Save budget item" : "Add budget item"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
