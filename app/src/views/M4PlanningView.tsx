import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { notifyMoveMapStateChanged } from "../lib/state-events";
import { SectionCard } from "../components/SectionCard";
import type { MoveMapData } from "../types/move-map";

type Status = "Active" | "Planned" | "Brainstorming";
type Rank = "Gold" | "Silver" | "Bronze";
type ItemKind = "income" | "housing";

type IncomeRow = {
  id: string;
  person: "Nate" | "Shae";
  label: string;
  status: Status;
  range: string;
  confidence: "high" | "medium" | "low";
  notes: string;
  archived: boolean;
};

type HousingRow = {
  id: string;
  rank: Rank;
  name: string;
  contact: string;
  website: string;
  features: string;
  notes: string;
  why: string;
  archived: boolean;
};

type Draft = {
  kind: ItemKind;
  id?: string;
  person?: IncomeRow["person"];
  label?: string;
  status?: Status;
  range?: string;
  confidence?: IncomeRow["confidence"];
  notes?: string;
  rank?: Rank;
  name?: string;
  contact?: string;
  website?: string;
  features?: string;
  why?: string;
};

type StoredState = { incomeRows: IncomeRow[]; housingRows: HousingRow[] };

const STORAGE_KEY = "barcelona-m4-planning-v2";
const emptyState: StoredState = { incomeRows: [], housingRows: [] };

function isIncomeRow(value: unknown): value is IncomeRow {
  if (!value || typeof value !== "object") return false;
  const row = value as IncomeRow;
  return typeof row.id === "string" && typeof row.person === "string" && typeof row.label === "string" && typeof row.status === "string" && typeof row.range === "string" && typeof row.confidence === "string" && typeof row.notes === "string" && typeof row.archived === "boolean";
}
function isHousingRow(value: unknown): value is HousingRow {
  if (!value || typeof value !== "object") return false;
  const row = value as HousingRow;
  return typeof row.id === "string" && typeof row.rank === "string" && typeof row.name === "string" && typeof row.contact === "string" && typeof row.website === "string" && typeof row.features === "string" && typeof row.notes === "string" && typeof row.why === "string" && typeof row.archived === "boolean";
}
function canUseLocalStorage() { return typeof window !== "undefined" && typeof window.localStorage !== "undefined"; }
function loadState(): StoredState {
  if (!canUseLocalStorage()) return emptyState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return emptyState;
    const source = parsed as { incomeRows?: unknown; housingRows?: unknown };
    const incomeRows = (Array.isArray(source.incomeRows) ? source.incomeRows : []).filter((value): value is Partial<IncomeRow> & { id: string } => !!value && typeof value === "object" && typeof (value as IncomeRow).id === "string").map((row) => ({ ...row, archived: row.archived ?? false })).filter(isIncomeRow);
    const housingRows = (Array.isArray(source.housingRows) ? source.housingRows : []).filter((value): value is Partial<HousingRow> & { id: string } => !!value && typeof value === "object" && typeof (value as HousingRow).id === "string").map((row) => ({ ...row, archived: row.archived ?? false })).filter(isHousingRow);
    return { incomeRows, housingRows };
  } catch { return emptyState; }
}
function statusChipClass(status: Status) { return status === "Active" ? "status-active" : status === "Planned" ? "status-planned" : "status-brainstorm"; }
function menuLabel(kind: ItemKind) { return kind === "income" ? "Income item" : "Housing item"; }
function statusControlClass(status: Status) { return `status-control ${statusChipClass(status)}`; }

export function M4PlanningView({ data, initialKind = "all" }: { data: MoveMapData; initialKind?: ItemKind | "all" }) {
  const [initialState] = useState<StoredState>(() => loadState());
  const [incomeRows, setIncomeRows] = useState<IncomeRow[]>(() => initialState.incomeRows);
  const [housingRows, setHousingRows] = useState<HousingRow[]>(() => initialState.housingRows);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => { if (!canUseLocalStorage()) return; localStorage.setItem(STORAGE_KEY, JSON.stringify({ incomeRows, housingRows })); notifyMoveMapStateChanged(); }, [incomeRows, housingRows]);

  const visibleIncome = useMemo(() => incomeRows.filter((row) => !row.archived), [incomeRows]);
  const visibleHousing = useMemo(() => housingRows.filter((row) => !row.archived), [housingRows]);
  const activeIncome = useMemo(() => visibleIncome.find((row) => row.status === "Active") ?? visibleIncome[0] ?? null, [visibleIncome]);
  const nextHousing = useMemo(() => visibleHousing[0] ?? null, [visibleHousing]);
  const spotlightRow = activeIncome;
  const spotlightHousing = nextHousing;
  const showIncome = initialKind !== "housing";
  const showHousing = initialKind !== "income";
  const pageTitle = initialKind === "income" ? "Income Planning" : "Housing Planning";
  const pageEyebrow = initialKind === "income" ? "Income planning" : "Housing planning";

  const beginEditIncome = (row: IncomeRow) => setEditing({ kind: "income", ...row });
  const beginEditHousing = (row: HousingRow) => setEditing({ kind: "housing", ...row });
  const saveEdit = () => {
    if (!editing) return;
    if (editing.kind === "income") setIncomeRows((rows) => {
      const existing = rows.find((item) => item.id === editing.id);
      const row: IncomeRow = { id: editing.id ?? `income-${Date.now()}`, person: editing.person ?? "Nate", label: editing.label ?? "", status: editing.status ?? "Planned", range: editing.range ?? "", confidence: editing.confidence ?? "medium", notes: editing.notes ?? "", archived: existing?.archived ?? false };
      return rows.some((item) => item.id === row.id) ? rows.map((item) => (item.id === row.id ? row : item)) : [row, ...rows];
    });
    else setHousingRows((rows) => {
      const existing = rows.find((item) => item.id === editing.id);
      const row: HousingRow = { id: editing.id ?? `housing-${Date.now()}`, rank: editing.rank ?? "Gold", name: editing.name ?? "", contact: editing.contact ?? "", website: editing.website ?? "", features: editing.features ?? "", notes: editing.notes ?? "", why: editing.why ?? "", archived: existing?.archived ?? false };
      return rows.some((item) => item.id === row.id) ? rows.map((item) => (item.id === row.id ? row : item)) : [row, ...rows];
    });
    setEditing(null);
  };
  const archiveItem = (kind: ItemKind, id: string) => { if (kind === "income") setIncomeRows((rows) => rows.map((row) => (row.id === id ? { ...row, archived: true } : row))); if (kind === "housing") setHousingRows((rows) => rows.map((row) => (row.id === id ? { ...row, archived: true } : row))); setMenuOpen(null); };
  const duplicateItem = (kind: ItemKind, id: string) => { if (kind === "income") setIncomeRows((rows) => { const row = rows.find((item) => item.id === id); return row ? [{ ...row, id: `${row.id}-copy-${Date.now()}`, archived: false }, ...rows] : rows; }); else setHousingRows((rows) => { const row = rows.find((item) => item.id === id); return row ? [{ ...row, id: `${row.id}-copy-${Date.now()}`, archived: false }, ...rows] : rows; }); setMenuOpen(null); };
  const deleteItem = (kind: ItemKind, id: string) => { if (kind === "income") setIncomeRows((rows) => rows.filter((row) => row.id !== id)); if (kind === "housing") setHousingRows((rows) => rows.filter((row) => row.id !== id)); setEditing((d) => (d?.id === id ? null : d)); setMenuOpen(null); };
  const archiveCount = incomeRows.filter((row) => row.archived).length + housingRows.filter((row) => row.archived).length;
  return (
    <div className="view m4-view">
      <PageHeader eyebrow={pageEyebrow} title={pageTitle}>A focused local-first planning surface for income and housing options.</PageHeader>
      <div className="m4-grid">
        {showIncome && <SectionCard title="Income planning" kicker="Nate + Shae" className="m4-panel m4-panel-income"><div className="section-subhead"><span>{visibleIncome.length} active items</span><span>{archiveCount} archived</span></div><div className="comparison-table-wrap"><table className="planning-table editable-table"><thead><tr><th>Person</th><th>Track</th><th>Status</th><th>Projected income</th><th>Notes</th><th>Actions</th></tr></thead><tbody>{visibleIncome.length === 0 ? <tr><td colSpan={6} className="empty-state">{incomeRows.length === 0 ? "No income items yet." : "No non-archived income items. Check the archive below."}</td></tr> : visibleIncome.map((row) => <tr key={row.id} className={row.id === spotlightRow?.id ? "is-spotlight" : ""}><td>{row.person}</td><td>{row.label}</td><td><button type="button" className={statusControlClass(row.status)} onClick={() => beginEditIncome(row)}>{row.status}</button></td><td>{row.range}</td><td>{row.notes}</td><td className="row-actions"><div className="ellipsis-menu"><button type="button" className="chip ellipsis-trigger" aria-haspopup="menu" aria-expanded={menuOpen === row.id} onClick={() => setMenuOpen(menuOpen === row.id ? null : row.id)}>...</button>{menuOpen === row.id && <div className="ellipsis-popup" role="menu"><button type="button" role="menuitem" onClick={() => beginEditIncome(row)}>Edit</button><button type="button" role="menuitem" onClick={() => duplicateItem("income", row.id)}>Duplicate</button><button type="button" role="menuitem" onClick={() => archiveItem("income", row.id)}>Archive</button></div>}</div></td></tr>)}</tbody></table></div><details className="archive-list"><summary>Archived income ({incomeRows.filter((row) => row.archived).length})</summary><div className="archive-body">{incomeRows.filter((row) => row.archived).length === 0 ? <p className="empty-state">No archived income items.</p> : incomeRows.filter((row) => row.archived).map((row) => <div key={row.id} className="archive-row"><strong>{row.person}</strong><span>{row.label}</span><div className="print-actions"><button type="button" className="chip" onClick={() => setIncomeRows((rows) => rows.map((item) => item.id === row.id ? { ...item, archived: false } : item))}>Restore</button><button type="button" className="chip modal-delete" onClick={() => deleteItem("income", row.id)}>Delete</button></div></div>)}</div></details></SectionCard>}
        {showHousing && <SectionCard title="Housing planning" kicker="Search table + ranking"><div className="section-subhead"><span>{visibleHousing.length} active items</span><span>{housingRows.filter((row) => row.archived).length} archived</span></div><div className="comparison-table-wrap"><table className="planning-table editable-table housing-table"><thead><tr><th>Rank</th><th>Option</th><th>Contact</th><th>Website</th><th>Features</th><th>Why it ranks here</th><th>Notes</th><th>Actions</th></tr></thead><tbody>{visibleHousing.length === 0 ? <tr><td colSpan={8} className="empty-state">{housingRows.length === 0 ? "No housing items yet." : "All housing items are archived. Restore one below."}</td></tr> : visibleHousing.map((option) => <tr key={option.id} className={option.id === spotlightHousing?.id ? "is-spotlight" : ""}><td><button type="button" className={`rank-badge rank-${option.rank.toLowerCase()}`} onClick={() => beginEditHousing(option)}>{option.rank}</button></td><td>{option.name}</td><td>{option.contact}</td><td>{option.website}</td><td>{option.features}</td><td>{option.why}</td><td>{option.notes}</td><td className="row-actions"><div className="ellipsis-menu"><button type="button" className="chip ellipsis-trigger" aria-haspopup="menu" aria-expanded={menuOpen === option.id} onClick={() => setMenuOpen(menuOpen === option.id ? null : option.id)}>...</button>{menuOpen === option.id && <div className="ellipsis-popup" role="menu"><button type="button" role="menuitem" onClick={() => beginEditHousing(option)}>Edit</button><button type="button" role="menuitem" onClick={() => duplicateItem("housing", option.id)}>Duplicate</button><button type="button" role="menuitem" onClick={() => archiveItem("housing", option.id)}>Archive</button></div>}</div></td></tr>)}</tbody></table></div><details className="archive-list"><summary>Archived housing ({housingRows.filter((row) => row.archived).length})</summary><div className="archive-body">{housingRows.filter((row) => row.archived).length === 0 ? <p className="empty-state">No archived housing items.</p> : housingRows.filter((row) => row.archived).map((row) => <div key={row.id} className="archive-row"><strong>{row.name}</strong><span>{row.rank}</span><div className="print-actions"><button type="button" className="chip" onClick={() => setHousingRows((rows) => rows.map((item) => item.id === row.id ? { ...item, archived: false } : item))}>Restore</button><button type="button" className="chip modal-delete" onClick={() => deleteItem("housing", row.id)}>Delete</button></div></div>)}</div></details></SectionCard>}
      </div>
      {editing && <div className="modal-backdrop" role="presentation" onClick={() => setEditing(null)}><div className="modal-card m4-modal" role="dialog" aria-modal="true" aria-label="Edit planning item" onClick={(e) => e.stopPropagation()}><div className="modal-head"><div><p className="card-kicker">{editing.id ? "Edit" : "Add"}</p><h3>{menuLabel(editing.kind)}</h3></div><button type="button" className="chip modal-close" onClick={() => setEditing(null)}>Close</button></div><div className="modal-body">{editing.kind === "income" ? <><label>Person<select value={editing.person ?? "Nate"} onChange={(e) => setEditing((d) => d ? { ...d, person: e.target.value as IncomeRow["person"] } : d)}><option>Nate</option><option>Shae</option></select></label><label>Track<input value={editing.label ?? ""} onChange={(e) => setEditing((d) => d ? { ...d, label: e.target.value } : d)} /></label><label>Status<select value={editing.status ?? "Planned"} onChange={(e) => setEditing((d) => d ? { ...d, status: e.target.value as Status } : d)}><option>Active</option><option>Planned</option><option>Brainstorming</option></select></label><label>Projected income<input value={editing.range ?? ""} onChange={(e) => setEditing((d) => d ? { ...d, range: e.target.value } : d)} /></label><label>Confidence<select value={editing.confidence ?? "medium"} onChange={(e) => setEditing((d) => d ? { ...d, confidence: e.target.value as IncomeRow["confidence"] } : d)}><option value="high">high</option><option value="medium">medium</option><option value="low">low</option></select></label><label>Notes<textarea rows={4} value={editing.notes ?? ""} onChange={(e) => setEditing((d) => d ? { ...d, notes: e.target.value } : d)} /></label></> : <><label>Name<input value={editing.name ?? ""} onChange={(e) => setEditing((d) => d ? { ...d, name: e.target.value } : d)} /></label><label>Rank<select value={editing.rank ?? "Gold"} onChange={(e) => setEditing((d) => d ? { ...d, rank: e.target.value as Rank } : d)}><option>Gold</option><option>Silver</option><option>Bronze</option></select></label><label>Contact<input value={editing.contact ?? ""} onChange={(e) => setEditing((d) => d ? { ...d, contact: e.target.value } : d)} /></label><label>Website<input value={editing.website ?? ""} onChange={(e) => setEditing((d) => d ? { ...d, website: e.target.value } : d)} /></label><label>Features<input value={editing.features ?? ""} onChange={(e) => setEditing((d) => d ? { ...d, features: e.target.value } : d)} /></label><label>Why it ranks here<textarea rows={3} value={editing.why ?? ""} onChange={(e) => setEditing((d) => d ? { ...d, why: e.target.value } : d)} /></label><label>Notes<textarea rows={4} value={editing.notes ?? ""} onChange={(e) => setEditing((d) => d ? { ...d, notes: e.target.value } : d)} /></label></>}
        <button className="primary-button" type="button" onClick={saveEdit}>Save changes</button></div></div></div>}
    </div>
  );
}
