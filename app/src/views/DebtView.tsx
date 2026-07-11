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

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function parseAmount(value: string) {
  if (!value.trim()) return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

function loadState(): DebtStorageState | null {
  if (!canUseLocalStorage()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DebtStorageState>;
    return {
      debtItems: Array.isArray(parsed.debtItems) ? parsed.debtItems : [],
    };
  } catch {
    return null;
  }
}

function createDebtItem(draft: DebtDraft): EditableDebtItem {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    person: draft.person,
    category: draft.category,
    label: draft.label.trim() || `${draft.person} ${titleCase(draft.category)}`,
    lender: draft.lender.trim() || "TBD",
    balance: parseAmount(draft.balance),
    apr: draft.apr.trim(),
    min_payment: draft.minPayment.trim(),
    due_date: draft.dueDate || todayStamp(),
    status: draft.status,
    notes: draft.notes.trim(),
    archived: false,
  };
}

function draftFromItem(item: EditableDebtItem): DebtDraft {
  return {
    person: item.person,
    category: item.category,
    label: item.label,
    lender: item.lender,
    balance: item.balance == null ? "" : String(item.balance),
    apr: item.apr,
    minPayment: item.min_payment,
    dueDate: item.due_date,
    status: item.status,
    notes: item.notes,
  };
}

function currency(value: number | null) {
  if (value == null) return "TBD";
  return `$${value.toLocaleString()}`;
}

function resetDraft(person: DebtPerson = "Nate"): DebtDraft {
  return { ...blankDraft, person };
}

export function DebtView({ data: _data }: { data: MoveMapData }) {
  const [state, setState] = useState<DebtStorageState>(() => loadState() ?? { debtItems: [] });
  const [draft, setDraft] = useState<DebtDraft>(blankDraft);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { debtItems } = state;

  useEffect(() => {
    if (!canUseLocalStorage()) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    notifyMoveMapStateChanged();
  }, [state]);

  const visible = useMemo(() => debtItems.filter((item) => !item.archived), [debtItems]);
  const archived = useMemo(() => debtItems.filter((item) => item.archived), [debtItems]);
  const grouped = useMemo(
    () => ({
      Nate: categories.map((category) => visible.filter((item) => item.person === "Nate" && item.category === category)),
      Shae: categories.map((category) => visible.filter((item) => item.person === "Shae" && item.category === category)),
    }),
    [visible],
  );
  const archivedGrouped = useMemo(
    () => ({
      Nate: categories.map((category) => archived.filter((item) => item.person === "Nate" && item.category === category)),
      Shae: categories.map((category) => archived.filter((item) => item.person === "Shae" && item.category === category)),
    }),
    [archived],
  );

  const totals = useMemo(
    () => ({
      Nate: visible.filter((item) => item.person === "Nate").reduce((sum, item) => sum + (item.balance ?? 0), 0),
      Shae: visible.filter((item) => item.person === "Shae").reduce((sum, item) => sum + (item.balance ?? 0), 0),
    }),
    [visible],
  );

  const openCreateModal = (person: DebtPerson = "Nate") => {
    setEditingId(null);
    setDraft(resetDraft(person));
    setIsModalOpen(true);
  };

  const openEditModal = (item: EditableDebtItem) => {
    setEditingId(item.id);
    setDraft(draftFromItem(item));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setDraft(resetDraft());
  };

  const submitDraft = () => {
    if (!draft.label.trim()) return;

    if (editingId) {
      setState((current) => ({
        ...current,
        debtItems: current.debtItems.map((item) =>
          item.id === editingId ? { ...item, ...createDebtItem(draft), id: item.id, archived: item.archived } : item,
        ),
      }));
    } else {
      const nextItem = createDebtItem(draft);
      setState((current) => ({ ...current, debtItems: [nextItem, ...current.debtItems] }));
    }

    closeModal();
  };

  const archiveRow = (id: string) => {
    setState((current) => ({
      ...current,
      debtItems: current.debtItems.map((item) => (item.id === id ? { ...item, archived: true } : item)),
    }));
    if (editingId === id) closeModal();
  };

  const restoreRow = (id: string) => {
    setState((current) => ({
      ...current,
      debtItems: current.debtItems.map((item) => (item.id === id ? { ...item, archived: false } : item)),
    }));
  };

  const deleteRow = (id: string) => {
    setState((current) => ({
      ...current,
      debtItems: current.debtItems.filter((item) => item.id !== id),
    }));
    if (editingId === id) closeModal();
  };

  const deleteArchivedRows = (person?: DebtPerson) => {
    setState((current) => ({
      ...current,
      debtItems: current.debtItems.filter((item) => !(item.archived && (!person || item.person === person))),
    }));
    if (editingId) {
      const edited = debtItems.find((item) => item.id === editingId);
      if (edited?.archived && (!person || edited.person === person)) closeModal();
    }
  };

  const duplicateRow = (id: string) => setState((current) => {
    const source = current.debtItems.find((item) => item.id === id);
    if (!source) return current;
    const copy: EditableDebtItem = { ...source, id: `${source.id}-copy-${Date.now()}`, label: `${source.label} copy`, archived: false };
    return { ...current, debtItems: [copy, ...current.debtItems] };
  });

  const renderRows = (rows: EditableDebtItem[], archivedRows = false) => (
    <table className="planning-table editable-table debt-table">
      <thead>
        <tr>
          <th>Label</th>
          <th>Lender</th>
          <th>Balance</th>
          <th>APR</th>
          <th>Min</th>
          <th>Due</th>
          <th>Status</th>
          <th>Notes</th>
          <th>Actions</th>
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
            <td>{row.apr || "—"}</td>
            <td>{row.min_payment || "—"}</td>
            <td>{row.due_date}</td>
            <td>{titleCase(row.status)}</td>
            <td>{row.notes || "—"}</td>
            <td className="row-actions">
              <details className="row-actions-menu">
                <summary aria-label="Row actions" title="Row actions">⋯</summary>
                <div className="row-actions-popover" role="menu">
                  <button type="button" role="menuitem" onClick={() => openEditModal(row)}>Edit</button>
                  <button type="button" role="menuitem" onClick={() => duplicateRow(row.id)}>Duplicate</button>
                  <button type="button" role="menuitem" onClick={() => (archivedRows ? restoreRow(row.id) : archiveRow(row.id))}>
                    {archivedRows ? "Restore" : "Archive"}
                  </button>
                  <button type="button" role="menuitem" onClick={() => deleteRow(row.id)}>Delete</button>
                </div>
              </details>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="view spreadsheet-view debt-view">
      <PageHeader eyebrow="Debt" title="Editable debt ledger">
        A local-first spreadsheet for Nate and Shae. Use it to track balances, minimums, and the next thing to pay attention to.
      </PageHeader>

      <section className="hero-card">
        <div>
          <h2>Debt ledger</h2>
          <p>Add a row for either person from one shared entry point, then archive resolved balances when you want the live ledger to stay focused.</p>
        </div>
        <div className="page-actions" aria-label="Debt actions">
          <button className="chip button-primary" type="button" onClick={() => openCreateModal()}>
            New debt entry
          </button>
        </div>
      </section>

      <section className="summary-strip debt-summary">
        <div><span>Nate total</span><strong>{currency(totals.Nate)}</strong></div>
        <div><span>Shae total</span><strong>{currency(totals.Shae)}</strong></div>
      </section>

      <p className="debt-entry-hint">Use the single entry trigger above to add a row for either person.</p>

      <section className="debt-columns">
        {(["Nate", "Shae"] as DebtPerson[]).map((person) => (
          <div key={person} className="debt-column-card">
            <h3 className="debt-column-head">{person} · Total {currency(totals[person])}</h3>
            {categories.map((category) => {
              const rows = grouped[person][categories.indexOf(category)];
              return (
                <div className="debt-category" key={`${person}-${category}`}>
                  <div className="debt-category-head"><strong>{titleCase(category)}</strong><span>{rows.length} row{rows.length === 1 ? "" : "s"}</span></div>
                  <div className="debt-table-wrap">{renderRows(rows)}</div>
                </div>
              );
            })}
          </div>
        ))}
      </section>

      <section className="debt-archive-section">
        <details className="archive-list" open={archived.length > 0}>
          <summary>Archived rows ({archived.length})</summary>
          <div className="archive-body">
            {archived.length === 0 ? (
              <div className="empty-state">Nothing archived yet.</div>
            ) : (
              (["Nate", "Shae"] as DebtPerson[]).map((person) => {
                const personRows = archivedGrouped[person];
                const count = personRows.reduce((sum, rows) => sum + rows.length, 0);
                if (count === 0) return null;
                return (
                  <details key={person} open>
                    <summary>{person} · {count} archived row{count === 1 ? "" : "s"}</summary>
                    <div className="archive-body">
                      {personRows.map((rows, index) => {
                        const category = categories[index];
                        if (rows.length === 0) return null;
                        return (
                          <div className="debt-category" key={`${person}-archived-${category}`}>
                            <div className="debt-category-head"><strong>{titleCase(category)}</strong><span>{rows.length} row{rows.length === 1 ? "" : "s"}</span></div>
                            <div className="debt-table-wrap">{renderRows(rows, true)}</div>
                          </div>
                        );
                      })}
                      <div className="archive-row archive-row-summary">
                        <div>
                          <strong>Delete all archived {person.toLowerCase()} rows</strong>
                          <span>Wipe this archived debt history once you are confident you no longer need it for comparison.</span>
                        </div>
                        <div className="page-actions archive-actions">
                          <button type="button" className="chip modal-delete" onClick={() => deleteArchivedRows(person)}>Delete all</button>
                        </div>
                      </div>
                    </div>
                  </details>
                );
              })
            )}
          </div>
        </details>
      </section>

      {isModalOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={closeModal}>
          <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="debt-modal-title" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">{editingId ? "Edit debt entry" : "New debt entry"}</p>
                <h2 id="debt-modal-title">{editingId ? draft.label || "Edit debt row" : "Add a row to the ledger"}</h2>
              </div>
              <div className="modal-actions">
                <button type="button" className="chip modal-close" onClick={closeModal}>Close</button>
                {editingId && <button type="button" className="chip modal-delete" onClick={() => deleteRow(editingId)}>Delete</button>}
              </div>
            </div>
            <div className="modal-body debt-modal-body">
              <label>
                Person
                <select value={draft.person} onChange={(e) => setDraft((current) => ({ ...current, person: e.target.value as DebtPerson }))}>
                  {(["Nate", "Shae"] as DebtPerson[]).map((person) => <option key={person} value={person}>{person}</option>)}
                </select>
              </label>
              <label>
                Category
                <select value={draft.category} onChange={(e) => setDraft((current) => ({ ...current, category: e.target.value as DebtCategory }))}>
                  {categories.map((category) => <option key={category} value={category}>{titleCase(category)}</option>)}
                </select>
              </label>
              <label>
                Label
                <input value={draft.label} onChange={(e) => setDraft((current) => ({ ...current, label: e.target.value }))} placeholder="e.g. Chase Sapphire" />
              </label>
              <label>
                Lender
                <input value={draft.lender} onChange={(e) => setDraft((current) => ({ ...current, lender: e.target.value }))} placeholder="e.g. Chase" />
              </label>
              <label>
                Balance
                <input type="number" value={draft.balance} onChange={(e) => setDraft((current) => ({ ...current, balance: e.target.value }))} />
              </label>
              <label>
                APR
                <input value={draft.apr} onChange={(e) => setDraft((current) => ({ ...current, apr: e.target.value }))} placeholder="18.2%" />
              </label>
              <label>
                Minimum payment
                <input value={draft.minPayment} onChange={(e) => setDraft((current) => ({ ...current, minPayment: e.target.value }))} placeholder="$150" />
              </label>
              <label>
                Due date
                <input type="date" value={draft.dueDate} onChange={(e) => setDraft((current) => ({ ...current, dueDate: e.target.value }))} />
              </label>
              <label>
                Status
                <select value={draft.status} onChange={(e) => setDraft((current) => ({ ...current, status: e.target.value as WorkStatus }))}>
                  {workStatuses.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}
                </select>
              </label>
              <label>
                Notes
                <input value={draft.notes} onChange={(e) => setDraft((current) => ({ ...current, notes: e.target.value }))} placeholder="Anything to remember" />
              </label>
            </div>
            <div className="modal-actions" style={{ marginTop: "1rem" }}>
              <button type="button" className="debt-entry-trigger" onClick={submitDraft}>{editingId ? "Save row" : "Create row"}</button>
              <button type="button" className="modal-close" onClick={closeModal}>Cancel</button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
