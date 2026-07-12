import { useEffect, useMemo, useState } from "react";
import type { DebtCategory, DebtItem, DebtPerson, MoveMapData, WorkStatus } from "../types/move-map";
import { PageHeader } from "../components/PageHeader";
import { notifyMoveMapStateChanged } from "../lib/state-events";
import { titleCase, todayStamp } from "../lib/formatters";

type DebtDraft = {
  person: DebtPerson;
  category: DebtCategory;
  label: string;
  lender: string;
  balance: string;
  apr: string;
  minPayment: string;
  dueDate: string;
  status: WorkStatus;
  notes: string;
};

type EditableDebtItem = DebtItem & { id: string };
type DebtStorageState = { debtItems: EditableDebtItem[] };

const STORAGE_KEY = "barcelona-debt-v1";
const categories: DebtCategory[] = ["credit_cards", "personal_loans", "student_loans", "collections"];
const workStatuses: WorkStatus[] = ["not_started", "in_progress", "waiting", "done", "blocked"];
const blankDraft: DebtDraft = {
  person: "Nate",
  category: "credit_cards",
  label: "",
  lender: "",
  balance: "",
  apr: "",
  minPayment: "",
  dueDate: todayStamp(),
  status: "not_started",
  notes: "",
};

function canUseLocalStorage() { return typeof window !== "undefined" && typeof window.localStorage !== "undefined"; }
function parseAmount(value: string) { if (!value.trim()) return null; const amount = Number(value); return Number.isFinite(amount) ? amount : null; }

function loadState(): DebtStorageState | null {
  if (!canUseLocalStorage()) return null;
  try { const raw = window.localStorage.getItem(STORAGE_KEY); if (!raw) return null; const parsed = JSON.parse(raw) as Partial<DebtStorageState>; return { debtItems: Array.isArray(parsed.debtItems) ? parsed.debtItems : [], }; }
  catch { return null; }
}

function createDebtItem(draft: DebtDraft): EditableDebtItem {
  return { id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`, person: draft.person, category: draft.category, label: draft.label.trim() || `${draft.person} ${titleCase(draft.category)}`, lender: draft.lender.trim() || "TBD", balance: parseAmount(draft.balance), apr: draft.apr.trim(), min_payment: draft.minPayment.trim(), due_date: draft.dueDate || todayStamp(), status: draft.status, notes: draft.notes.trim(), archived: false };
}

function draftFromItem(item: EditableDebtItem): DebtDraft {
  return { person: item.person, category: item.category, label: item.label, lender: item.lender, balance: item.balance == null ? "" : String(item.balance), apr: item.apr, minPayment: item.min_payment, dueDate: item.due_date, status: item.status, notes: item.notes };
}

function currency(value: number | null) { if (value == null) return "TBD"; return `$${value.toLocaleString()}`; }
function resetDraft(person: DebtPerson = "Nate"): DebtDraft { return { ...blankDraft, person }; }

export function DebtView({ data: _data }: { data: MoveMapData }) {
  const [state, setState] = useState<DebtStorageState>(() => loadState() ?? { debtItems: [] });
  const [draft, setDraft] = useState<DebtDraft>(blankDraft);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { debtItems } = state;

  useEffect(() => { if (!canUseLocalStorage()) return; window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); notifyMoveMapStateChanged(); }, [state]);

  const visible = useMemo(() => debtItems.filter((item) => !item.archived), [debtItems]);
  const archived_ = useMemo(() => debtItems.filter((item) => item.archived), [debtItems]);

  const totals = useMemo(() => ({
    Nate: visible.filter((item) => item.person === "Nate").reduce((sum, item) => sum + (item.balance ?? 0), 0),
    Shae: visible.filter((item) => item.person === "Shae").reduce((sum, item) => sum + (item.balance ?? 0), 0),
  }), [visible]);

  const persons: DebtPerson[] = ["Nate", "Shae"];
  const personItems = useMemo(() => ({
    Nate: visible.filter((item) => item.person === "Nate"),
    Shae: visible.filter((item) => item.person === "Shae"),
  }), [visible]);
  const archivedPersonItems = useMemo(() => ({
    Nate: archived_.filter((item) => item.person === "Nate"),
    Shae: archived_.filter((item) => item.person === "Shae"),
  }), [archived_]);

  const openCreateModal = (person: DebtPerson = "Nate") => { setEditingId(null); setDraft(resetDraft(person)); setIsModalOpen(true); };
  const openEditModal = (item: EditableDebtItem) => { setEditingId(item.id); setDraft(draftFromItem(item)); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setEditingId(null); setDraft(resetDraft()); };

  const submitDraft = () => {
    if (!draft.label.trim()) return;
    if (editingId) { setState((current) => ({ ...current, debtItems: current.debtItems.map((item) => item.id === editingId ? { ...item, ...createDebtItem(draft), id: item.id, archived: item.archived } : item) })); }
    else { setState((current) => ({ ...current, debtItems: [createDebtItem(draft), ...current.debtItems] })); }
    closeModal();
  };

  const archiveRow = (id: string) => { setState((current) => ({ ...current, debtItems: current.debtItems.map((item) => (item.id === id ? { ...item, archived: true } : item)) })); if (editingId === id) closeModal(); };
  const restoreRow = (id: string) => { setState((current) => ({ ...current, debtItems: current.debtItems.map((item) => (item.id === id ? { ...item, archived: false } : item)) })); };
  const deleteRow = (id: string) => { setState((current) => ({ ...current, debtItems: current.debtItems.filter((item) => item.id !== id) })); if (editingId === id) closeModal(); };
  const deleteArchivedRows = (person?: DebtPerson) => { setState((current) => ({ ...current, debtItems: current.debtItems.filter((item) => !(item.archived && (!person || item.person === person))) })); if (editingId) { const edited = debtItems.find((item) => item.id === editingId); if (edited?.archived && (!person || edited.person === person)) closeModal(); } };
  const duplicateRow = (id: string) => setState((current) => { const source = current.debtItems.find((item) => item.id === id); if (!source) return current; const copy: EditableDebtItem = { ...source, id: `${source.id}-copy-${Date.now()}`, label: `${source.label} copy`, archived: false }; return { ...current, debtItems: [copy, ...current.debtItems] }; });

  const renderTable = (rows: EditableDebtItem[], archivedRows = false) => (
    <div className="expense-table-wrap">
      <table className="planning-table editable-table debt-table">
        <thead>
          <tr>
            <th>Label</th><th>Lender</th><th>Balance</th><th>APR</th><th>Min</th><th>Due</th><th>Status</th><th>Notes</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={9} className="empty-state">No rows yet.</td></tr>
          ) : rows.map((row) => (
            <tr key={row.id}>
              <td>{row.label}</td>
              <td>{row.lender}</td>
              <td>{currency(row.balance)}</td>
              <td>{row.apr || ""}</td>
              <td>{row.min_payment || ""}</td>
              <td>{row.due_date}</td>
              <td>{titleCase(row.status)}</td>
              <td>{row.notes || ""}</td>
              <td className="row-actions">
                <details className="row-actions-menu">
                  <summary aria-label="Row actions" title="Row actions"></summary>
                  <div className="row-actions-popover" role="menu">
                    <button type="button" role="menuitem" onClick={() => openEditModal(row)}>Edit</button>
                    <button type="button" role="menuitem" onClick={() => duplicateRow(row.id)}>Duplicate</button>
                    <button type="button" role="menuitem" onClick={() => (archivedRows ? restoreRow(row.id) : archiveRow(row.id))}>{archivedRows ? "Restore" : "Archive"}</button>
                    <button type="button" role="menuitem" onClick={() => deleteRow(row.id)}>Delete</button>
                  </div>
                </details>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="view spreadsheet-view">
      <PageHeader title="Debt">
        Editable debt ledger for Nate and Shae balances, minimums, due dates, and payoff attention.
      </PageHeader>

      <section className="summary-strip debt-summary">
        <div><span>Nate total</span><strong>{currency(totals.Nate)}</strong></div>
        <div>
          <span>Shae total</span>
          <strong>{currency(totals.Shae)}</strong>
        </div>
      </section>

      <section className="expenses-panels">
        {persons.map((person) => {
          const rows = personItems[person];
          const archivedRows = archivedPersonItems[person];
          return (
            <div key={person} className="expense-column-card section-card">
              <div className="expense-column-meta">
                <strong>{person}</strong>
                <button className="chip button-primary" type="button" style={{ padding: ".35rem .65rem", fontSize: ".78rem" }} onClick={() => openCreateModal(person)}>
                  New debt item
                </button>
              </div>
              {renderTable(rows)}
              <details className="archive-list">
                <summary>Archived rows ({archivedRows.length})</summary>
                <div className="archive-body">
                  {archivedRows.length === 0 ? (
                    <p className="empty-state">No archived rows for {person}.</p>
                  ) : (
                    <>
                      {renderTable(archivedRows, true)}
                      <div className="archive-row archive-row-summary" style={{ marginTop: ".5rem" }}>
                        <div>
                          <strong>Delete all archived {person.toLowerCase()} rows</strong>
                          <span>Wipe this archived debt history once you are confident you no longer need it for comparison.</span>
                        </div>
                        <div className="page-actions archive-actions">
                          <button type="button" className="chip modal-delete" onClick={() => deleteArchivedRows(person)}>Delete all</button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </details>
            </div>
          );
        })}
      </section>

      {isModalOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={closeModal}>
          <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="debt-modal-title" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div>
                <p className="card-kicker">{editingId ? "Edit entry" : "New entry"}</p>
                <h2 id="debt-modal-title">{editingId ? draft.label || "Edit debt row" : "Add a row to the ledger"}</h2>
              </div>
              <div className="modal-actions">
                <button type="button" className="chip modal-close" onClick={closeModal}>Close</button>
                {editingId && <button type="button" className="chip modal-delete" onClick={() => deleteRow(editingId)}>Delete</button>}
              </div>
            </div>
            <div className="modal-body">
              <label>Person
                <select value={draft.person} onChange={(e) => setDraft((c) => ({ ...c, person: e.target.value as DebtPerson }))}>
                  {persons.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </label>
              <label>Category
                <select value={draft.category} onChange={(e) => setDraft((c) => ({ ...c, category: e.target.value as DebtCategory }))}>
                  {categories.map((cat) => <option key={cat} value={cat}>{titleCase(cat)}</option>)}
                </select>
              </label>
              <label>Label <input value={draft.label} onChange={(e) => setDraft((c) => ({ ...c, label: e.target.value }))} placeholder="e.g. Chase Sapphire" /></label>
              <label>Lender <input value={draft.lender} onChange={(e) => setDraft((c) => ({ ...c, lender: e.target.value }))} placeholder="e.g. Chase" /></label>
              <label>Balance <input type="number" value={draft.balance} onChange={(e) => setDraft((c) => ({ ...c, balance: e.target.value }))} /></label>
              <label>APR <input value={draft.apr} onChange={(e) => setDraft((c) => ({ ...c, apr: e.target.value }))} placeholder="18.2%" /></label>
              <label>Minimum payment <input value={draft.minPayment} onChange={(e) => setDraft((c) => ({ ...c, minPayment: e.target.value }))} placeholder="$150" /></label>
              <label>Due date <input type="date" value={draft.dueDate} onChange={(e) => setDraft((c) => ({ ...c, dueDate: e.target.value }))} /></label>
              <label>Status
                <select value={draft.status} onChange={(e) => setDraft((c) => ({ ...c, status: e.target.value as WorkStatus }))}>
                  {workStatuses.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
                </select>
              </label>
              <label>Notes <input value={draft.notes} onChange={(e) => setDraft((c) => ({ ...c, notes: e.target.value }))} placeholder="Anything to remember" /></label>
            </div>
            <div className="modal-actions" style={{ marginTop: "1rem" }}>
              <button className="primary-button" type="button" onClick={submitDraft}>{editingId ? "Save row" : "Create row"}</button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
