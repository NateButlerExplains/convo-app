import { useEffect, useMemo, useState } from "react";
import type { MoveMapData, Risk } from "../types/move-map";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { StatusPill } from "../components/StatusPill";
import { notifyMoveMapStateChanged } from "../lib/state-events";
import { titleCase } from "../lib/formatters";

const STORAGE_KEY = "barcelona-risks-v1";

type EditableRisk = Risk & { archived: boolean };

type RiskDraft = {
  title: string;
  category: string;
  description: string;
  likelihood: Risk["likelihood"];
  impact: Risk["impact"];
  trigger: string;
  mitigation: string;
  owner: string;
  status: Risk["status"];
  professional_advice_required: boolean;
  notes: string;
};

const blankDraft: RiskDraft = {
  title: "",
  category: "",
  description: "",
  likelihood: "unknown",
  impact: "unknown",
  trigger: "",
  mitigation: "",
  owner: "",
  status: "watching",
  professional_advice_required: false,
  notes: "",
};

const normalizeRisk = (risk: Risk | EditableRisk, index: number): EditableRisk => ({
  ...risk,
  id: risk.id || `risk-${index}`,
  source_ids: risk.source_ids ?? [],
  related_task_ids: risk.related_task_ids ?? [],
  related_document_ids: risk.related_document_ids ?? [],
  notes: risk.notes ?? "",
  archived: "archived" in risk ? Boolean(risk.archived) : false,
});

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function loadRisks() {
  if (!canUseLocalStorage()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed
          .filter((value): value is EditableRisk => !!value && typeof value === "object")
          .map((risk, index) => normalizeRisk(risk, index))
      : null;
  } catch {
    return null;
  }
}

function createRisk(draft: RiskDraft): EditableRisk {
  return {
    id: `risk-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: draft.title.trim() || "Untitled risk",
    category: draft.category.trim() || "General",
    description: draft.description.trim(),
    likelihood: draft.likelihood,
    impact: draft.impact,
    trigger: draft.trigger.trim(),
    mitigation: draft.mitigation.trim(),
    owner: draft.owner.trim() || "Unassigned",
    status: draft.status,
    professional_advice_required: draft.professional_advice_required,
    source_ids: [],
    related_task_ids: [],
    related_document_ids: [],
    notes: draft.notes.trim(),
    archived: false,
  };
}

function draftFromRisk(risk: EditableRisk): RiskDraft {
  return {
    title: risk.title,
    category: risk.category,
    description: risk.description,
    likelihood: risk.likelihood,
    impact: risk.impact,
    trigger: risk.trigger,
    mitigation: risk.mitigation,
    owner: risk.owner,
    status: risk.status,
    professional_advice_required: risk.professional_advice_required,
    notes: risk.notes,
  };
}

export function RisksView({ data }: { data: MoveMapData }) {
  const [risks, setRisks] = useState<EditableRisk[]>(() => loadRisks() ?? data.risks.map((risk, index) => normalizeRisk(risk, index)));
  const [draft, setDraft] = useState<RiskDraft>(blankDraft);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!canUseLocalStorage()) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(risks));
    notifyMoveMapStateChanged();
  }, [risks]);

  const activeRisks = useMemo(() => risks.filter((risk) => !risk.archived), [risks]);
  const archivedRisks = useMemo(() => risks.filter((risk) => risk.archived), [risks]);

  const openModal = () => {
    setEditingId(null);
    setDraft(blankDraft);
    setIsModalOpen(true);
  };

  const openEditModal = (risk: EditableRisk) => {
    setEditingId(risk.id);
    setDraft(draftFromRisk(risk));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setDraft(blankDraft);
  };

  const saveRisk = () => {
    if (!draft.title.trim()) return;

    if (editingId) {
      setRisks((current) =>
        current.map((risk) =>
          risk.id === editingId ? { ...risk, ...createRisk(draft), id: risk.id, archived: risk.archived } : risk,
        ),
      );
    } else {
      setRisks((current) => [createRisk(draft), ...current]);
    }

    closeModal();
  };

  const archiveRisk = (id: string, archived: boolean) => {
    setRisks((current) => current.map((risk) => (risk.id === id ? { ...risk, archived } : risk)));
    if (editingId === id && archived) closeModal();
  };

  const deleteRisk = (id: string) => {
    setRisks((current) => current.filter((risk) => risk.id !== id));
    if (editingId === id) closeModal();
  };

  const deleteArchivedRisks = () => {
    setRisks((current) => current.filter((risk) => !risk.archived));
    if (editingId && risks.find((risk) => risk.id === editingId)?.archived) closeModal();
  };

  return (
    <div className="view spreadsheet-view">
      <PageHeader eyebrow="Risks" title="Uncertainty with a next action">
        Start with blank local state, keep live risks in the ledger, and archive resolved items when you want the working set to stay focused.
      </PageHeader>

      <section className="hero-card">
        <div>
          <h2>Risk register</h2>
          <p>Track triggers, mitigations, and review flags in the table, then move resolved risks into the archive instead of leaving them in the active set.</p>
        </div>
        <div className="page-actions" aria-label="Risk editor actions">
          <button className="chip button-primary" type="button" onClick={openModal}>
            Add risk
          </button>
        </div>
      </section>

      <section className="summary-strip">
        <div>
          <span>Watching now</span>
          <strong>{activeRisks.length}</strong>
        </div>
        <div>
          <span>Archived</span>
          <strong>{archivedRisks.length}</strong>
        </div>
      </section>

      <SectionCard title="Risk ledger" kicker="Editable risk rows">
        <div className="expense-table-wrap">
          <table className="planning-table expense-table risk-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Title</th>
                <th>Likelihood</th>
                <th>Impact</th>
                <th>Status</th>
                <th>Owner</th>
                <th>Trigger</th>
                <th>Mitigation</th>
                <th>Review</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeRisks.length === 0 ? (
                <tr>
                  <td colSpan={11} className="empty-state">No active risks yet.</td>
                </tr>
              ) : (
                activeRisks.map((risk) => (
                  <tr key={risk.id}>
                    <td>{risk.category}</td>
                    <td>
                      <strong>{risk.title}</strong>
                      {risk.description ? <div className="small-text">{risk.description}</div> : null}
                    </td>
                    <td><StatusPill status={`likelihood-${risk.likelihood}`} /></td>
                    <td><StatusPill status={`impact-${risk.impact}`} /></td>
                    <td><StatusPill status={risk.status} /></td>
                    <td>{risk.owner}</td>
                    <td>{risk.trigger || "—"}</td>
                    <td>{risk.mitigation || "—"}</td>
                    <td>{risk.professional_advice_required ? "Professional review" : "No"}</td>
                    <td>{risk.notes || "—"}</td>
                    <td className="row-actions">
                      <details className="row-actions-menu">
                        <summary aria-label="Row actions" title="Row actions">⋯</summary>
                        <div className="row-actions-popover" role="menu">
                          <button type="button" role="menuitem" onClick={() => openEditModal(risk)}>Edit</button>
                          <button type="button" role="menuitem" onClick={() => archiveRisk(risk.id, true)}>Archive</button>
                          <button type="button" role="menuitem" onClick={() => deleteRisk(risk.id)}>Delete</button>
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
        <summary>Archived risks ({archivedRisks.length})</summary>
        <div className="archive-body">
          {archivedRisks.length === 0 ? (
            <p className="empty-state">No archived risks yet.</p>
          ) : (
            <>
              {archivedRisks.map((risk) => (
                <div key={risk.id} className="archive-row">
                  <div>
                    <strong>{risk.title}</strong>
                    <span>{risk.category} · {titleCase(risk.status)}</span>
                  </div>
                  <div className="page-actions archive-actions">
                    <button type="button" className="chip" onClick={() => openEditModal(risk)}>Edit</button>
                    <button type="button" className="chip" onClick={() => archiveRisk(risk.id, false)}>Restore</button>
                    <button type="button" className="chip modal-delete" onClick={() => deleteRisk(risk.id)}>Delete</button>
                  </div>
                </div>
              ))}
              <div className="archive-row archive-row-summary">
                <div>
                  <strong>Delete all archived risks</strong>
                  <span>Clear resolved risk history once you no longer need it for comparison.</span>
                </div>
                <div className="page-actions archive-actions">
                  <button type="button" className="chip modal-delete" onClick={deleteArchivedRisks}>Delete all</button>
                </div>
              </div>
            </>
          )}
        </div>
      </details>

      {isModalOpen && (
        <div className="modal-backdrop" role="presentation" onClick={closeModal}>
          <div className="modal-card" role="dialog" aria-modal="true" aria-label={editingId ? "Edit risk" : "Add new risk"} onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div>
                <p className="card-kicker">{editingId ? "Edit entry" : "New entry"}</p>
                <h3>{editingId ? draft.title || "Edit risk" : "Add a risk"}</h3>
              </div>
              <div className="modal-actions">
                <button type="button" className="chip modal-close" onClick={closeModal}>Close</button>
                {editingId && <button type="button" className="chip modal-delete" onClick={() => deleteRisk(editingId)}>Delete</button>}
              </div>
            </div>
            <div className="modal-body expense-modal-body">
              <label>
                Title
                <input value={draft.title} onChange={(e) => setDraft((c) => ({ ...c, title: e.target.value }))} placeholder="What could go wrong?" />
              </label>
              <label>
                Category
                <input value={draft.category} onChange={(e) => setDraft((c) => ({ ...c, category: e.target.value }))} placeholder="visa, housing, timing, etc." />
              </label>
              <label>
                Description
                <textarea value={draft.description} onChange={(e) => setDraft((c) => ({ ...c, description: e.target.value }))} rows={3} placeholder="Describe the risk in plain language" />
              </label>
              <label>
                Trigger
                <textarea value={draft.trigger} onChange={(e) => setDraft((c) => ({ ...c, trigger: e.target.value }))} rows={2} placeholder="What would cause this to show up?" />
              </label>
              <label>
                Mitigation
                <textarea value={draft.mitigation} onChange={(e) => setDraft((c) => ({ ...c, mitigation: e.target.value }))} rows={2} placeholder="What could reduce or contain it?" />
              </label>
              <label>
                Likelihood
                <select value={draft.likelihood} onChange={(e) => setDraft((c) => ({ ...c, likelihood: e.target.value as Risk["likelihood"] }))}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="unknown">Unknown</option>
                </select>
              </label>
              <label>
                Impact
                <select value={draft.impact} onChange={(e) => setDraft((c) => ({ ...c, impact: e.target.value as Risk["impact"] }))}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="unknown">Unknown</option>
                </select>
              </label>
              <label>
                Status
                <select value={draft.status} onChange={(e) => setDraft((c) => ({ ...c, status: e.target.value as Risk["status"] }))}>
                  <option value="watching">Watching</option>
                  <option value="mitigating">Mitigating</option>
                  <option value="accepted">Accepted</option>
                  <option value="resolved">Resolved</option>
                </select>
              </label>
              <label>
                Owner
                <input value={draft.owner} onChange={(e) => setDraft((c) => ({ ...c, owner: e.target.value }))} placeholder="Who is tracking this?" />
              </label>
              <label style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: ".5rem" }}>
                <input type="checkbox" checked={draft.professional_advice_required} onChange={(e) => setDraft((c) => ({ ...c, professional_advice_required: e.target.checked }))} />
                Professional review
              </label>
              <label>
                Notes
                <textarea value={draft.notes} onChange={(e) => setDraft((c) => ({ ...c, notes: e.target.value }))} rows={3} placeholder="Optional notes" />
              </label>
              <button className="primary-button" type="button" onClick={saveRisk}>{editingId ? "Save risk" : "Add risk"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
