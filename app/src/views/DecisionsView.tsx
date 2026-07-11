import { useEffect, useMemo, useState } from "react";
import type { Decision, MoveMapData } from "../types/move-map";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { notifyMoveMapStateChanged } from "../lib/state-events";

type DecisionDraft = {
  title: string;
  status: Decision["status"];
  readiness: Decision["readiness"];
  rationale: string;
  decisionDate: string;
  approvers: string;
  revisitDate: string;
  notes: string;
  optionsConsidered: string;
};

type EditableDecision = Decision & { id: string; archived: boolean };

type DecisionsStorageState = {
  decisions: EditableDecision[];
  draft: DecisionDraft;
};

const STORAGE_KEY = "move-map:decisions-view";

const blankDraft: DecisionDraft = {
  title: "",
  status: "proposed",
  readiness: "open_question",
  rationale: "",
  decisionDate: "",
  approvers: "",
  revisitDate: "",
  notes: "",
  optionsConsidered: "",
};

function loadStoredState(): DecisionsStorageState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<DecisionsStorageState>;
    return {
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
      draft: parsed.draft ?? blankDraft,
    };
  } catch {
    return null;
  }
}

function createDecision(draft: DecisionDraft): EditableDecision {
  const optionIds = draft.optionsConsidered
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: draft.title.trim() || "Untitled decision",
    status: draft.status,
    readiness: draft.readiness,
    options_considered: optionIds,
    rationale: draft.rationale.trim(),
    decision_date: draft.decisionDate || new Date().toISOString().slice(0, 10),
    approvers: draft.approvers
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    revisit_date: draft.revisitDate || new Date().toISOString().slice(0, 10),
    related_task_ids: [],
    related_risk_ids: [],
    notes: draft.notes.trim(),
    archived: false,
  };
}

function draftFromDecision(item: EditableDecision): DecisionDraft {
  return {
    title: item.title,
    status: item.status,
    readiness: item.readiness,
    rationale: item.rationale,
    decisionDate: item.decision_date,
    approvers: item.approvers.join(", "),
    revisitDate: item.revisit_date,
    notes: item.notes,
    optionsConsidered: item.options_considered.join(", "),
  };
}

function statusLabel(status: Decision["status"]) {
  const labels: Record<string, string> = {
    proposed: "Proposed",
    leaning: "Leaning",
    decided: "Decided",
    revisiting: "Revisiting",
  };
  const classes: Record<string, string> = {
    proposed: "status-proposed",
    leaning: "status-leaning",
    decided: "status-decided",
    revisiting: "status-revisiting",
  };
  return { label: labels[status] ?? status, className: classes[status] ?? "" };
}

function readinessLabel(readiness: Decision["readiness"]) {
  const labels: Record<string, string> = {
    open_question: "Open",
    options_listed: "Options",
    comparing: "Comparing",
    leaning: "Leaning",
    decided_for_now: "Decided",
    revisit: "Revisit",
  };
  const classes: Record<string, string> = {
    open_question: "status-open_question",
    options_listed: "status-options_listed",
    comparing: "status-comparing",
    leaning: "status-leaning",
    decided_for_now: "status-decided_for_now",
    revisit: "status-revisit",
  };
  return { label: labels[readiness] ?? readiness, className: classes[readiness] ?? "" };
}

export function DecisionsView({ data }: { data: MoveMapData }) {
  const [decisions, setDecisions] = useState<EditableDecision[]>(() => loadStoredState()?.decisions ?? data.decisions.map((decision) => ({ ...decision, archived: false })));
  const [draft, setDraft] = useState<DecisionDraft>(blankDraft);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ decisions, draft }));
    notifyMoveMapStateChanged();
  }, [decisions, draft]);

  const activeDecisions = useMemo(() => decisions.filter((decision) => !decision.archived), [decisions]);
  const archivedDecisions = useMemo(() => decisions.filter((decision) => decision.archived), [decisions]);


  const openEditModal = (item: EditableDecision) => {
    setDraft(draftFromDecision(item));
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setDraft(blankDraft);
  };

  const saveDecision = () => {
    if (!draft.title.trim()) return;
    const newDecision = createDecision(draft);
    if (editingId) {
      setDecisions((current) =>
        current.map((decision) =>
          decision.id === editingId ? { ...newDecision, id: editingId, archived: decision.archived } : decision,
        ),
      );
    } else {
      setDecisions((current) => [newDecision, ...current]);
    }
    closeModal();
  };

  const archiveDecision = (id: string, archived: boolean) => {
    setDecisions((current) => current.map((decision) => (decision.id === id ? { ...decision, archived } : decision)));
    if (editingId === id && archived) closeModal();
  };

  const deleteDecision = (id: string) => {
    setDecisions((current) => current.filter((decision) => decision.id !== id));
    if (editingId === id) closeModal();
  };

  const deleteArchivedDecisions = () => {
    setDecisions((current) => current.filter((decision) => !decision.archived));
    if (editingId && decisions.find((decision) => decision.id === editingId)?.archived) closeModal();
  };

  return (
    <div className="view">
      <PageHeader eyebrow="Decisions" title="Decision cards">
        Compare open decisions, keep the important context visible, and archive cards once they are settled for now.
      </PageHeader>

      <section className="hero-card">
        <div>
          <h2>Decision cards</h2>
          <p>Decision cards appear here after a recorded conversation is parsed, supporting tasks and questions are pulled out, and the decision is ready to keep.</p>
        </div>
      </section>

      <section className="postcard-grid">
        {activeDecisions.length === 0 ? (
          <SectionCard title="No decisions yet" kicker="Blank slate" className="decision-postcard decision-postcard-quiet">
            <p>The board stays empty until Conversation records, parses, and promotes a finished decision.</p>
          </SectionCard>
        ) : (
          activeDecisions.map((decision) => {
            const status = statusLabel(decision.status);
            const readiness = readinessLabel(decision.readiness);
            return (
              <article key={decision.id} className="section-card decision-postcard decision-postcard-quiet">
                <h3>{decision.title}</h3>
                <div className="card-meta decision-card-pills" style={{ marginTop: "0.4rem" }}>
                  <span className={`pill ${status.className}`}>{status.label}</span>
                  <span className={`pill ${readiness.className}`}>{readiness.label}</span>
                  {decision.approvers.length > 0 && <span className="pill">Approvers: {decision.approvers.join(", ")}</span>}
                </div>
                <div className="detail-list" style={{ marginTop: "0.55rem", fontSize: "0.88rem" }}>
                  <dt>Decision</dt><dd>{decision.decision_date}</dd>
                  <dt>Revisit</dt><dd>{decision.revisit_date}</dd>
                </div>
                {(decision.notes || decision.rationale) && (
                  <p style={{ margin: "0.45rem 0 0", color: "var(--muted)", fontSize: "0.88rem" }}>
                    {decision.notes || decision.rationale}
                  </p>
                )}
                <div className="card-meta decision-card-actions">
                  <button className="chip" type="button" onClick={() => openEditModal(decision)}>Edit</button>
                  <button className="chip" type="button" onClick={() => archiveDecision(decision.id, true)}>Archive</button>
                </div>
              </article>
            );
          })
        )}
      </section>

      <details className="archive-list">
        <summary>Archived decisions ({archivedDecisions.length})</summary>
        <div className="archive-body">
          {archivedDecisions.length === 0 ? (
            <p className="empty-state">No archived decisions yet.</p>
          ) : (
            <>
              {archivedDecisions.map((decision) => (
                <div key={decision.id} className="archive-row">
                  <div>
                    <strong>{decision.title}</strong>
                    <span>{statusLabel(decision.status).label} · {readinessLabel(decision.readiness).label}</span>
                  </div>
                  <div className="page-actions archive-actions">
                    <button type="button" className="chip" onClick={() => openEditModal(decision)}>Edit</button>
                    <button type="button" className="chip" onClick={() => archiveDecision(decision.id, false)}>Restore</button>
                    <button type="button" className="chip modal-delete" onClick={() => deleteDecision(decision.id)}>Delete</button>
                  </div>
                </div>
              ))}
              <div className="archive-row archive-row-summary">
                <div>
                  <strong>Delete all archived decisions</strong>
                  <span>Clear settled decision history when you do not need the archive as a comparison set anymore.</span>
                </div>
                <div className="page-actions archive-actions">
                  <button type="button" className="chip modal-delete" onClick={deleteArchivedDecisions}>Delete all</button>
                </div>
              </div>
            </>
          )}
        </div>
      </details>

      {isModalOpen && (
        <div className="modal-backdrop" role="presentation" onClick={closeModal}>
          <div className="modal-card" role="dialog" aria-modal="true" aria-label={editingId ? "Edit decision" : "Add new decision"} onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div>
                <p className="card-kicker">{editingId ? "Edit entry" : "New entry"}</p>
                <h3>{editingId ? draft.title || "Edit decision" : "Add a decision"}</h3>
              </div>
              <div className="modal-actions">
                <button type="button" className="chip modal-close" onClick={closeModal}>Close</button>
                {editingId && <button type="button" className="chip modal-delete" onClick={() => deleteDecision(editingId)}>Delete</button>}
              </div>
            </div>
            <div className="modal-body expense-modal-body">
              <label>
                Title
                <input value={draft.title} onChange={(e) => setDraft((current) => ({ ...current, title: e.target.value }))} placeholder="What are we deciding?" />
              </label>
              <label>
                Status
                <select value={draft.status} onChange={(e) => setDraft((current) => ({ ...current, status: e.target.value as Decision["status"] }))}>
                  <option value="proposed">proposed</option>
                  <option value="leaning">leaning</option>
                  <option value="decided">decided</option>
                  <option value="revisiting">revisiting</option>
                </select>
              </label>
              <label>
                Readiness
                <select value={draft.readiness} onChange={(e) => setDraft((current) => ({ ...current, readiness: e.target.value as Decision["readiness"] }))}>
                  <option value="open_question">open_question</option>
                  <option value="options_listed">options_listed</option>
                  <option value="comparing">comparing</option>
                  <option value="leaning">leaning</option>
                  <option value="decided_for_now">decided_for_now</option>
                  <option value="revisit">revisit</option>
                </select>
              </label>
              <label>
                Rationale
                <textarea rows={4} value={draft.rationale} onChange={(e) => setDraft((current) => ({ ...current, rationale: e.target.value }))} placeholder="Why this option feels stronger or weaker" />
              </label>
              <label>
                Decision date
                <input type="date" value={draft.decisionDate} onChange={(e) => setDraft((current) => ({ ...current, decisionDate: e.target.value }))} />
              </label>
              <label>
                Revisit date
                <input type="date" value={draft.revisitDate} onChange={(e) => setDraft((current) => ({ ...current, revisitDate: e.target.value }))} />
              </label>
              <label>
                Approvers
                <input value={draft.approvers} onChange={(e) => setDraft((current) => ({ ...current, approvers: e.target.value }))} placeholder="Nate, Shae" />
              </label>
              <label>
                Options considered
                <input value={draft.optionsConsidered} onChange={(e) => setDraft((current) => ({ ...current, optionsConsidered: e.target.value }))} placeholder="comma-separated option ids or labels" />
              </label>
              <label>
                Notes
                <textarea rows={4} value={draft.notes} onChange={(e) => setDraft((current) => ({ ...current, notes: e.target.value }))} placeholder="Anything you want attached to the decision" />
              </label>
              <button className="primary-button" type="button" onClick={saveDecision}>Save decision</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
