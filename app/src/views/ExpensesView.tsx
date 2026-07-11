import { useEffect, useMemo, useState } from "react";
import type { ExpenseItem, ExpenseKind, ExpensePerson, MoveMapData, WorkStatus } from "../types/move-map";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { notifyMoveMapStateChanged } from "../lib/state-events";
import { titleCase } from "../lib/formatters";

type ExpenseDraft = {
  person: ExpensePerson;
  kind: ExpenseKind;
  label: string;
  cadence: string;
  amount: string;
  currency: "USD";
  status: WorkStatus;
  forecast: string;
  notes: string;
};

type EditableExpenseItem = ExpenseItem & { id: string };
type ExpenseStorageState = { expenseItems: EditableExpenseItem[]; draft: ExpenseDraft };

type ExpenseEditorMode = "create" | "edit";
type ExpenseEditorState = {
  mode: ExpenseEditorMode;
  sourceId: string | null;
};

const STORAGE_KEY = "barcelona-expenses-v1";
const kinds: ExpenseKind[] = ["housing", "utilities", "transport", "food", "health", "school", "travel", "insurance", "misc"];
const people: ExpensePerson[] = ["Nate", "Shae"];
const statuses: WorkStatus[] = ["not_started", "in_progress", "waiting", "done", "blocked"];
const blankDraft: ExpenseDraft = { person: "Nate", kind: "housing", label: "", cadence: "monthly", amount: "", currency: "USD", status: "not_started", forecast: "", notes: "" };

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function parseAmount(value: string) {
  if (!value.trim()) return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

function loadState(): ExpenseStorageState | null {
  if (!canUseLocalStorage()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ExpenseStorageState>;
    return {
      expenseItems: Array.isArray(parsed.expenseItems) ? parsed.expenseItems : [],
      draft: parsed.draft ?? blankDraft,
    };
  } catch {
    return null;
  }
}

function createExpenseItem(draft: ExpenseDraft): EditableExpenseItem {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    person: draft.person,
    kind: draft.kind,
    label: draft.label.trim() || `${draft.person} ${titleCase(draft.kind)}`,
    cadence: draft.cadence.trim() || "monthly",
    amount: parseAmount(draft.amount),
    currency: draft.currency,
    status: draft.status,
    forecast: draft.forecast.trim(),
    notes: draft.notes.trim(),
    archived: false,
  };
}

function draftFromItem(item: EditableExpenseItem): ExpenseDraft {
  return {
    person: item.person,
    kind: item.kind,
    label: item.label,
    cadence: item.cadence,
    amount: item.amount == null ? "" : String(item.amount),
    currency: "USD" as const,
    status: item.status,
    forecast: item.forecast,
    notes: item.notes,
  };
}

function money(value: number | null) {
  if (value == null) return "TBD";
  return `$${value.toLocaleString()}`;
}

export function ExpensesView({ data: _data }: { data: MoveMapData }) {
  const [state, setState] = useState<ExpenseStorageState>(() => loadState() ?? { expenseItems: [], draft: blankDraft });
  const [editor, setEditor] = useState<ExpenseEditorState | null>(null);
  const { expenseItems, draft } = state;

  useEffect(() => {
    if (!canUseLocalStorage()) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    notifyMoveMapStateChanged();
  }, [state]);

  const activeRows = useMemo(() => expenseItems.filter((item) => !item.archived), [expenseItems]);
  const archivedRows = useMemo(() => expenseItems.filter((item) => item.archived), [expenseItems]);
  const personRows = useMemo(
    () => ({
      Nate: activeRows.filter((item) => item.person === "Nate"),
      Shae: activeRows.filter((item) => item.person === "Shae"),
    }),
    [activeRows],
  );
  const archivedByPerson = useMemo(
    () => ({
      Nate: archivedRows.filter((item) => item.person === "Nate"),
      Shae: archivedRows.filter((item) => item.person === "Shae"),
    }),
    [archivedRows],
  );
  const personTotals = useMemo(
    () => ({
      Nate: personRows.Nate.reduce((sum, item) => sum + (item.amount ?? 0), 0),
      Shae: personRows.Shae.reduce((sum, item) => sum + (item.amount ?? 0), 0),
    }),
    [personRows],
  );

  const setDraft = (patch: Partial<ExpenseDraft>) => setState((current) => ({ ...current, draft: { ...current.draft, ...patch } }));

  const openCreateModal = () => {
    setState((current) => ({ ...current, draft: blankDraft }));
    setEditor({ mode: "create", sourceId: null });
  };

  const openEditModal = (item: EditableExpenseItem) => {
    setState((current) => ({ ...current, draft: draftFromItem(item) }));
    setEditor({ mode: "edit", sourceId: item.id });
  };

  const closeModal = () => setEditor(null);

  const saveDraft = () => {
    if (!draft.label.trim()) return;

    setState((current) => {
      if (editor?.mode === "edit" && editor.sourceId) {
        return {
          ...current,
          expenseItems: current.expenseItems.map((item) =>
            item.id === editor.sourceId
              ? { ...item, ...createExpenseItem(draft), id: item.id, archived: item.archived }
              : item,
          ),
          draft: blankDraft,
        };
      }

      return {
        ...current,
        expenseItems: [createExpenseItem(draft), ...current.expenseItems],
        draft: blankDraft,
      };
    });

    setEditor(null);
  };

  const archiveRow = (id: string, archived: boolean) => {
    setState((current) => ({
      ...current,
      expenseItems: current.expenseItems.map((item) => (item.id === id ? { ...item, archived } : item)),
    }));
    if (editor?.sourceId === id && archived) setEditor(null);
  };

  const deleteRow = (id: string) => {
    setState((current) => ({
      ...current,
      expenseItems: current.expenseItems.filter((item) => item.id !== id),
    }));
    if (editor?.sourceId === id) setEditor(null);
  };

  const deleteArchivedRows = (person?: ExpensePerson) => {
    setState((current) => ({
      ...current,
      expenseItems: current.expenseItems.filter((item) => !(item.archived && (!person || item.person === person))),
    }));

    if (editor?.sourceId) {
      const editedRow = expenseItems.find((item) => item.id === editor.sourceId);
      if (editedRow?.archived && (!person || editedRow.person === person)) setEditor(null);
    }
  };

  const renderColumn = (person: ExpensePerson) => {
    const rows = personRows[person];
    const archived = archivedByPerson[person];
    const total = personTotals[person];

    return (
      <SectionCard title={person} kicker="Editable expense ledger" className="expense-column-card">
        <div className="expense-column-meta">
          <div>
            <span>Active rows</span>
            <strong>{rows.length}</strong>
          </div>
          <div>
            <span>Total</span>
            <strong>{money(total)}</strong>
          </div>
        </div>
        <div className="expense-table-wrap">
          <table className="planning-table expense-table">
            <thead>
              <tr>
                <th>Kind</th>
                <th>Label</th>
                <th>Cadence</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Forecast</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-state">No active rows yet.</td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>{titleCase(row.kind)}</td>
                    <td>{row.label}</td>
                    <td>{row.cadence}</td>
                    <td>{money(row.amount)}</td>
                    <td>{titleCase(row.status)}</td>
                    <td>{row.forecast || "—"}</td>
                    <td>{row.notes || "—"}</td>
                    <td className="row-actions">
                      <details className="row-actions-menu">
                        <summary aria-label="Row actions" title="Row actions">⋯</summary>
                        <div className="row-actions-popover" role="menu">
                          <button type="button" role="menuitem" onClick={() => openEditModal(row)}>Edit</button>
                          <button type="button" role="menuitem" onClick={() => archiveRow(row.id, true)}>Archive</button>
                          <button type="button" role="menuitem" onClick={() => deleteRow(row.id)}>Delete</button>
                        </div>
                      </details>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <details className="archive-list">
          <summary>Archived rows ({archived.length})</summary>
          <div className="archive-body">
            {archived.length === 0 ? (
              <p className="empty-state">No archived rows for {person}.</p>
            ) : (
              <>
                {archived.map((row) => (
                  <div key={row.id} className="archive-row">
                    <div>
                      <strong>{row.label}</strong>
                      <span>{titleCase(row.kind)} · {money(row.amount)}</span>
                    </div>
                    <div className="page-actions archive-actions">
                      <button type="button" className="chip" onClick={() => openEditModal(row)}>Edit</button>
                      <button type="button" className="chip" onClick={() => archiveRow(row.id, false)}>Restore</button>
                      <button type="button" className="chip modal-delete" onClick={() => deleteRow(row.id)}>Delete</button>
                    </div>
                  </div>
                ))}
                <div className="archive-row archive-row-summary">
                  <div>
                    <strong>Delete all archived {person.toLowerCase()} rows</strong>
                    <span>Remove this archived set permanently when you no longer need the history.</span>
                  </div>
                  <div className="page-actions archive-actions">
                    <button type="button" className="chip modal-delete" onClick={() => deleteArchivedRows(person)}>Delete all</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </details>
      </SectionCard>
    );
  };

  const editorSourceId = editor?.sourceId ?? null;

  return (
    <div className="view spreadsheet-view expenses-view">
      <PageHeader eyebrow="Expenses" title="Editable expense surface">
        Track each person in their own column and manage entries from a modal so the table stays readable.
      </PageHeader>

      <section className="hero-card">
        <div>
          <h2>Expense ledger</h2>
          <p>Keep each person's active rows visible, then move older items into the archive when you want a cleaner working table.</p>
        </div>
        <div className="page-actions" aria-label="Expense actions">
          <button type="button" className="chip button-primary" onClick={openCreateModal}>New expense</button>
        </div>
      </section>

      <section className="summary-strip expense-summary">
        <div><span>Nate total</span><strong>{money(personTotals.Nate)}</strong></div>
        <div><span>Shae total</span><strong>{money(personTotals.Shae)}</strong></div>
      </section>

      <section className="expenses-panels">
        {people.map((person) => <div key={person}>{renderColumn(person)}</div>)}
      </section>

      {editor && (
        <div className="modal-backdrop" role="presentation" onClick={closeModal}>
          <div className="modal-card" role="dialog" aria-modal="true" aria-label={editor.mode === "create" ? "Add new expense" : "Edit expense"} onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div>
                <p className="card-kicker">{editor.mode === "create" ? "New entry" : "Edit entry"}</p>
                <h3>{editor.mode === "create" ? "Add an expense" : draft.label || "Edit expense"}</h3>
              </div>
              <div className="modal-actions">
                <button type="button" className="chip modal-close" onClick={closeModal}>Close</button>
                {editor.mode === "edit" && editorSourceId != null && (
                  <button type="button" className="chip modal-delete" onClick={() => deleteRow(editorSourceId!)}>Delete</button>
                )}
              </div>
            </div>

            <div className="modal-body expense-modal-body">
              <label>
                Person
                <select value={draft.person} onChange={(event) => setDraft({ person: event.target.value as ExpensePerson })}>
                  {people.map((person) => <option key={person} value={person}>{person}</option>)}
                </select>
              </label>
              <label>
                Kind
                <select value={draft.kind} onChange={(event) => setDraft({ kind: event.target.value as ExpenseKind })}>
                  {kinds.map((kind) => <option key={kind} value={kind}>{titleCase(kind)}</option>)}
                </select>
              </label>
              <label>
                Label
                <input value={draft.label} onChange={(event) => setDraft({ label: event.target.value })} placeholder="Rent, phone bill, groceries..." />
              </label>
              <label>
                Cadence
                <input value={draft.cadence} onChange={(event) => setDraft({ cadence: event.target.value })} placeholder="monthly" />
              </label>
              <label>
                Amount
                <input type="number" value={draft.amount} onChange={(event) => setDraft({ amount: event.target.value })} placeholder="0" />
              </label>
              <label>
                Currency
                <select value={draft.currency} onChange={(event) => setDraft({ currency: event.target.value as ExpenseDraft["currency"] })}>
                  <option value="USD">USD</option>
                </select>
              </label>
              <label>
                Status
                <select value={draft.status} onChange={(event) => setDraft({ status: event.target.value as WorkStatus })}>
                  {statuses.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}
                </select>
              </label>
              <label>
                Forecast
                <input value={draft.forecast} onChange={(event) => setDraft({ forecast: event.target.value })} placeholder="Expected change, timing, or decision" />
              </label>
              <label>
                Notes
                <textarea rows={4} value={draft.notes} onChange={(event) => setDraft({ notes: event.target.value })} placeholder="Anything to remember about this item" />
              </label>
              <button className="primary-button" type="button" onClick={saveDraft}>Save expense</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
