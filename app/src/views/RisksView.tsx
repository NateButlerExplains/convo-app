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
    <div className="view reference-page risks-page">
      <PageHeader title="Risks">
        Live risk ledger with likelihood, impact, mitigation, and archive for items no longer active.
      </PageHeader>

      <section className="reference-summary" aria-label="Risk summary">
        <div><span>Active risks</span><strong>{activeRisks.length}</strong></div>
        <div><span>High impact</span><strong>{activeRisks.filter((risk) => risk.impact === "high").length}</strong></div>
        <div><span>Archived</span><strong>{archivedRisks.length}</strong></div>
        <button className="chip button-primary" type="button" onClick={openModal}>Add risk</button>
      </section>

      {activeRisks.length === 0 ? (
        <SectionCard title="No active risks" className="empty-note-state">
          <p>Add a risk when something needs an owner, trigger, or mitigation plan.</p>
        </SectionCard>
      ) : (
        <section className="risk-card-grid" aria-label="Active risks">
          {activeRisks.map((risk) => (
            <article key={risk.id} className={`section-card risk-card risk-impact-${risk.impact}`}>
              <div className="risk-card-head">
                <span className="risk-category">{risk.category}</span>
                <StatusPill status={risk.status} />
              </div>
              <h2>{risk.title}</h2>
              {risk.description ? <p className="risk-description">{risk.description}</p> : null}
              <div className="risk-signal-row">
                <StatusPill status={`likelihood-${risk.likelihood}`} />
                <StatusPill status={`impact-${risk.impact}`} />
                <span className="risk-owner">Owner: {risk.owner}</span>
              </div>
              <div className="risk-plan-grid">
                <div><span>Trigger</span><p>{risk.trigger || "Not defined yet."}</p></div>
                <div><span>Mitigation</span><p>{risk.mitigation || "Not defined yet."}</p></div>
              </div>
              {(risk.professional_advice_required || risk.notes) && (
                <div className="risk-note-row">
                  {risk.professional_advice_required && <span className="advice-flag">Professional review</span>}
                  {risk.notes && <p>{risk.notes}</p>}
                </div>
              )}
              <div className="card-meta risk-card-actions">
                <button className="chip" type="button" onClick={() => openEditModal(risk)}>Edit</button>
                <button className="chip" type="button" onClick={() => archiveRisk(risk.id, true)}>Archive</button>
              </div>
            </article>
          ))}
        </section>
      )}

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
