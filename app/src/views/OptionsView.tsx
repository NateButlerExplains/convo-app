import { useEffect, useMemo, useState } from "react";
import type { MoveMapData, Option } from "../types/move-map";
import { titleCase } from "../lib/formatters";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { ConfidenceBadge } from "../components/ConfidenceBadge";
import { notifyMoveMapStateChanged } from "../lib/state-events";

const STORAGE_KEY = "barcelona-options-v1";
const groups: Option["category"][] = ["visa", "neighborhood", "school_childcare", "healthcare", "insurance", "travel", "housing", "financial", "other"];

type EditableOption = Option & { archived: boolean };

type OptionDraft = {
  name: string;
  category: Option["category"];
  summary: string;
  pros: string;
  cons: string;
  estimated_cost_label: string;
  risk_level: Option["risk_level"];
  confidence: Option["confidence"];
  professional_advice_required: boolean;
  notes: string;
};

const blankDraft: OptionDraft = {
  name: "",
  category: "other",
  summary: "",
  pros: "",
  cons: "",
  estimated_cost_label: "",
  risk_level: "unknown",
  confidence: "low",
  professional_advice_required: false,
  notes: "",
};

const normalizeOption = (option: Option | EditableOption, index: number): EditableOption => ({
  ...option,
  id: option.id || `option-${index}`,
  pros: option.pros ?? [],
  cons: option.cons ?? [],
  source_ids: option.source_ids ?? [],
  related_budget_ids: option.related_budget_ids ?? [],
  related_risk_ids: option.related_risk_ids ?? [],
  notes: option.notes ?? "",
  related_decision_id: option.related_decision_id ?? "",
  archived: "archived" in option ? Boolean(option.archived) : false,
});

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function loadOptions() {
  if (!canUseLocalStorage()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed
          .filter((value): value is Option => !!value && typeof value === "object")
          .map((option, index) => normalizeOption(option, index))
      : null;
  } catch {
    return null;
  }
}

function createOption(draft: OptionDraft): EditableOption {
  return {
    id: `option-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: draft.name.trim(),
    category: draft.category,
    summary: draft.summary.trim(),
    pros: draft.pros.split(",").map((s) => s.trim()).filter(Boolean),
    cons: draft.cons.split(",").map((s) => s.trim()).filter(Boolean),
    estimated_cost_label: draft.estimated_cost_label.trim(),
    risk_level: draft.risk_level,
    confidence: draft.confidence,
    source_ids: [],
    related_decision_id: "",
    related_budget_ids: [],
    related_risk_ids: [],
    professional_advice_required: draft.professional_advice_required,
    notes: draft.notes.trim(),
    archived: false,
  };
}

function draftFromOption(option: EditableOption): OptionDraft {
  return {
    name: option.name,
    category: option.category,
    summary: option.summary,
    pros: option.pros.join(", "),
    cons: option.cons.join(", "),
    estimated_cost_label: option.estimated_cost_label,
    risk_level: option.risk_level,
    confidence: option.confidence,
    professional_advice_required: option.professional_advice_required,
    notes: option.notes,
  };
}

export function OptionsView({ data }: { data: MoveMapData }) {
  const [options, setOptions] = useState<EditableOption[]>(() => loadOptions() ?? data.options.map((option, index) => normalizeOption(option, index)));
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set(groups));
  const [draft, setDraft] = useState<OptionDraft>(blankDraft);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!canUseLocalStorage()) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
    notifyMoveMapStateChanged();
  }, [options]);

  const activeOptions = useMemo(() => options.filter((option) => !option.archived), [options]);
  const archivedOptions = useMemo(() => options.filter((option) => option.archived), [options]);

  const openModal = () => {
    setEditingId(null);
    setDraft(blankDraft);
    setIsModalOpen(true);
  };

  const openEditModal = (option: EditableOption) => {
    setEditingId(option.id);
    setDraft(draftFromOption(option));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setDraft(blankDraft);
  };

  const saveOption = () => {
    if (!draft.name.trim()) return;

    if (editingId) {
      setOptions((current) =>
        current.map((option) =>
          option.id === editingId ? { ...option, ...createOption(draft), id: option.id, archived: option.archived } : option,
        ),
      );
    } else {
      setOptions((current) => [...current, createOption(draft)]);
    }

    closeModal();
  };

  const toggleCategory = (category: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const resetCategories = () => setActiveCategories(new Set(groups));

  const updateOption = (id: string, updates: Partial<EditableOption>) => {
    setOptions((current) => current.map((option) => (option.id === id ? { ...option, ...updates } : option)));
  };

  const archiveOption = (id: string, archived: boolean) => {
    setOptions((current) => current.map((option) => (option.id === id ? { ...option, archived } : option)));
    if (editingId === id && archived) closeModal();
  };

  const deleteOption = (id: string) => {
    setOptions((current) => current.filter((option) => option.id !== id));
    if (editingId === id) closeModal();
  };

  const deleteArchivedOptions = () => {
    setOptions((current) => current.filter((option) => !option.archived));
    if (editingId && options.find((option) => option.id === editingId)?.archived) closeModal();
  };

  return (
    <div className="view">
      <PageHeader eyebrow="Options" title="Compare possible paths">
        Use this page to compare visa routes, neighborhoods, schools, housing, and other planning options before deciding.
      </PageHeader>

      <section className="hero-card">
        <div>
          <h2>Planning options</h2>
          <p>Add and compare only the options you actually want to evaluate.</p>
        </div>
        <div className="page-actions" aria-label="Option actions">
          <button type="button" className="chip button-primary" onClick={openModal}>Add option</button>
        </div>
      </section>

      {activeOptions.length > 0 && (
        <div className="category-filter-bar">
          <span className="filter-bar-label" style={{ marginRight: ".35rem" }}>Category</span>
          {groups.map((group) => {
            const count = activeOptions.filter((o) => o.category === group).length;
            return (
              <button
                key={group}
                type="button"
                className={`category-chip ${activeCategories.has(group) ? "active" : ""}`}
                onClick={() => toggleCategory(group)}
              >
                {titleCase(group)}
                {count > 0 && <span style={{ marginLeft: ".25rem", opacity: 0.6 }}>({count})</span>}
              </button>
            );
          })}
          <button type="button" className="filter-chip" style={{ marginLeft: ".25rem" }} onClick={resetCategories}>
            Show all
          </button>
        </div>
      )}

      {activeOptions.length === 0 ? (
        <SectionCard title="No options yet" kicker="Blank slate" className="empty-note-state">
          <p>Add an option to compare cost, confidence, and risk notes.</p>
        </SectionCard>
      ) : (
        groups.map((group) => {
          if (!activeCategories.has(group)) return null;
          const items = activeOptions.filter((option) => option.category === group);
          if (!items.length) return null;
          return (
            <section key={group}>
              <h2 className="section-heading">{titleCase(group)}</h2>
              <div className="card-grid">
                {items.map((option) => (
                  <SectionCard
                    key={option.id}
                    title={option.name || "Untitled option"}
                    kicker={option.professional_advice_required ? "Professional advice required" : "Planning option"}
                  >
                    <div className="modal-body">
                      <p>{option.summary || "No summary yet."}</p>

                      {(option.pros.length > 0 || option.cons.length > 0) && (
                        <div className="pros-cons-strip">
                          {option.pros.length > 0 && (
                            <ul className="pros-list">
                              <span className="list-label">Pros</span>
                              {option.pros.map((pro, i) => <li key={i}>{pro}</li>)}
                            </ul>
                          )}
                          {option.cons.length > 0 && (
                            <ul className="cons-list">
                              <span className="list-label">Cons</span>
                              {option.cons.map((con, i) => <li key={i}>{con}</li>)}
                            </ul>
                          )}
                        </div>
                      )}

                      <div className="option-meta-strip">
                        {option.estimated_cost_label && (
                          <span className="option-meta-item cost-meta">
                            <span className="meta-icon" aria-hidden="true" style={{ fontWeight: 900 }}>$</span>
                            {option.estimated_cost_label}
                          </span>
                        )}
                        <span className={`option-meta-item risk-${option.risk_level}`}>
                          Risk: {titleCase(option.risk_level)}
                        </span>
                        <ConfidenceBadge confidence={option.confidence} />
                        {option.professional_advice_required && <span className="option-meta-item advice-meta">Advice needed</span>}
                      </div>

                      {option.notes && <p>{option.notes}</p>}
                    </div>
                    <div className="card-meta">
                      <button className="chip" type="button" onClick={() => openEditModal(option)}>Edit</button>
                      <button className="chip" type="button" onClick={() => archiveOption(option.id, true)}>Archive</button>
                    </div>
                  </SectionCard>
                ))}
              </div>
            </section>
          );
        })
      )}

      <details className="archive-list">
        <summary>Archived options ({archivedOptions.length})</summary>
        <div className="archive-body">
          {archivedOptions.length === 0 ? (
            <p className="empty-state">No archived options yet.</p>
          ) : (
            <>
              {archivedOptions.map((option) => (
                <div key={option.id} className="archive-row">
                  <div>
                    <strong>{option.name || "Untitled option"}</strong>
                    <span>{titleCase(option.category)}{option.estimated_cost_label ? ` · ${option.estimated_cost_label}` : ""}</span>
                  </div>
                  <div className="page-actions archive-actions">
                    <button type="button" className="chip" onClick={() => openEditModal(option)}>Edit</button>
                    <button type="button" className="chip" onClick={() => archiveOption(option.id, false)}>Restore</button>
                    <button type="button" className="chip modal-delete" onClick={() => deleteOption(option.id)}>Delete</button>
                  </div>
                </div>
              ))}
              <div className="archive-row archive-row-summary">
                <div>
                  <strong>Delete all archived options</strong>
                  <span>Clear old comparison cards once you no longer need them in the option archive.</span>
                </div>
                <div className="page-actions archive-actions">
                  <button type="button" className="chip modal-delete" onClick={deleteArchivedOptions}>Delete all</button>
                </div>
              </div>
            </>
          )}
        </div>
      </details>

      {isModalOpen && (
        <div className="modal-backdrop" role="presentation" onClick={closeModal}>
          <div role="dialog" aria-modal="true" aria-label={editingId ? "Edit option" : "Add new option"} className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div>
                <p className="card-kicker">{editingId ? "Edit entry" : "New entry"}</p>
                <h3>{editingId ? draft.name || "Edit option" : "Add an option"}</h3>
              </div>
              <div className="modal-actions">
                <button type="button" className="chip modal-close" onClick={closeModal}>Close</button>
                {editingId && <button type="button" className="chip modal-delete" onClick={() => deleteOption(editingId)}>Delete</button>}
              </div>
            </div>
            <div className="modal-body expense-modal-body">
              <label>
                Name
                <input value={draft.name} onChange={(e) => setDraft((c) => ({ ...c, name: e.target.value }))} placeholder="Visa path, neighborhood, school, or housing idea" />
              </label>
              <label>
                Category
                <select value={draft.category} onChange={(e) => setDraft((c) => ({ ...c, category: e.target.value as Option["category"] }))}>
                  {groups.map((cat) => <option key={cat} value={cat}>{titleCase(cat)}</option>)}
                </select>
              </label>
              <label>
                Summary
                <textarea value={draft.summary} onChange={(e) => setDraft((c) => ({ ...c, summary: e.target.value }))} rows={3} placeholder="Short neutral description" />
              </label>
              <label>
                Pros (comma-separated)
                <input value={draft.pros} onChange={(e) => setDraft((c) => ({ ...c, pros: e.target.value }))} placeholder="benefit1, benefit2" />
              </label>
              <label>
                Cons (comma-separated)
                <input value={draft.cons} onChange={(e) => setDraft((c) => ({ ...c, cons: e.target.value }))} placeholder="drawback1, drawback2" />
              </label>
              <label>
                Estimated cost
                <input value={draft.estimated_cost_label} onChange={(e) => setDraft((c) => ({ ...c, estimated_cost_label: e.target.value }))} placeholder="$2k-$4k or monthly range" />
              </label>
              <label>
                Risk level
                <select value={draft.risk_level} onChange={(e) => setDraft((c) => ({ ...c, risk_level: e.target.value as Option["risk_level"] }))}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="unknown">Unknown</option>
                </select>
              </label>
              <label>
                Confidence
                <select value={draft.confidence} onChange={(e) => setDraft((c) => ({ ...c, confidence: e.target.value as Option["confidence"] }))}>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </label>
              <label className="inline-toggle" style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                <input type="checkbox" checked={draft.professional_advice_required} onChange={(e) => setDraft((c) => ({ ...c, professional_advice_required: e.target.checked }))} />
                Professional advice required
              </label>
              <label>
                Notes
                <textarea value={draft.notes} onChange={(e) => setDraft((c) => ({ ...c, notes: e.target.value }))} rows={3} placeholder="Optional notes" />
              </label>
              <button className="primary-button" type="button" onClick={saveOption}>{editingId ? "Save option" : "Add option"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
