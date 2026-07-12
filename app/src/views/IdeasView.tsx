import { useEffect, useMemo, useState } from "react";
import type { Idea, MoveMapData } from "../types/move-map";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { notifyMoveMapStateChanged } from "../lib/state-events";

const STORAGE_KEY = "barcelona-ideas-v1";

type EditableIdea = Idea & { archived: boolean };

type IdeaDraft = {
  prompt: string;
  topic: string;
  priority: Idea["priority"];
  discussed: boolean;
  outcome: string;
  notes: string;
};

const blankDraft: IdeaDraft = {
  prompt: "",
  topic: "",
  priority: "medium",
  discussed: false,
  outcome: "",
  notes: "",
};

const normalizeIdea = (idea: Idea | EditableIdea, index: number): EditableIdea => ({
  ...idea,
  id: idea.id || `idea-${index}`,
  related_decision_ids: idea.related_decision_ids ?? [],
  related_option_ids: idea.related_option_ids ?? [],
  notes: idea.notes ?? "",
  outcome: idea.outcome ?? "",
  archived: "archived" in idea ? Boolean(idea.archived) : false,
});

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadIdeas() {
  if (!canUseLocalStorage()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed
          .filter((value): value is Idea => !!value && typeof value === "object")
          .map((idea, index) => normalizeIdea(idea as Idea, index))
      : null;
  } catch {
    return null;
  }
}

function createIdea(draft: IdeaDraft): EditableIdea {
  return {
    id: `idea-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    prompt: draft.prompt.trim(),
    topic: draft.topic.trim(),
    priority: draft.priority,
    discussed: draft.discussed,
    outcome: draft.outcome.trim(),
    related_decision_ids: [],
    related_option_ids: [],
    notes: draft.notes.trim(),
    archived: false,
  };
}

function draftFromIdea(idea: EditableIdea): IdeaDraft {
  return {
    prompt: idea.prompt,
    topic: idea.topic,
    priority: idea.priority,
    discussed: idea.discussed,
    outcome: idea.outcome,
    notes: idea.notes,
  };
}

const priorityLabel: Record<string, string> = {
  high: "High Priority",
  medium: "Medium Priority",
  low: "Low Priority",
};
export function IdeasView({ data }: { data: MoveMapData }) {
  const [ideas, setIdeas] = useState<EditableIdea[]>(() => {
    const stored = loadIdeas();
    return stored ?? data.ideas.map((idea, index) => normalizeIdea(idea, index));
  });
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [draft, setDraft] = useState<IdeaDraft>(blankDraft);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!canUseLocalStorage()) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
    notifyMoveMapStateChanged();
  }, [ideas]);

  const activeIdeas = useMemo(() => ideas.filter((idea) => !idea.archived), [ideas]);
  const archivedIdeas = useMemo(() => ideas.filter((idea) => idea.archived), [ideas]);

  const openModal = () => {
    setEditingId(null);
    setDraft(blankDraft);
    setIsModalOpen(true);
  };

  const openEditModal = (idea: EditableIdea) => {
    setEditingId(idea.id);
    setDraft(draftFromIdea(idea));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setDraft(blankDraft);
  };

  const saveIdea = () => {
    if (!draft.prompt.trim()) return;

    if (editingId) {
      setIdeas((current) =>
        current.map((idea) =>
          idea.id === editingId
            ? {
                ...idea,
                ...createIdea(draft),
                id: idea.id,
                archived: idea.archived,
              }
            : idea,
        ),
      );
    } else {
      setIdeas((current) => [...current, createIdea(draft)]);
    }

    closeModal();
  };

  const archiveIdea = (id: string, archived: boolean) => {
    setIdeas((current) => current.map((idea) => (idea.id === id ? { ...idea, archived } : idea)));
    if (editingId === id && archived) closeModal();
  };

  const deleteIdea = (id: string) => {
    setIdeas((current) => current.filter((idea) => idea.id !== id));
    if (editingId === id) closeModal();
  };

  const deleteArchivedIdeas = () => {
    setIdeas((current) => current.filter((idea) => !idea.archived));
    if (editingId && ideas.find((idea) => idea.id === editingId)?.archived) closeModal();
  };

  const groups = (["high", "medium", "low"] as const)
    .map((key) => ({
      key,
      label: priorityLabel[key],
      items: [...activeIdeas]
        .filter((idea) => idea.priority === key)
        .sort((a, b) => activeIdeas.indexOf(a) - activeIdeas.indexOf(b)),
    }))
    .filter((group) => group.items.length > 0);

  const toggleGroup = (key: string) => {
    setCollapsedGroups((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <div className="view reference-page ideas-page">
      <PageHeader title="Ideas">
        Capture conversation prompts and early thoughts worth revisiting before they become tasks or decisions.
      </PageHeader>

      <div className="section-subhead ideas-subhead">
        <div />
        <button type="button" className="chip button-primary" onClick={openModal}>Add idea</button>
      </div>

      {activeIdeas.length === 0 ? (
        <SectionCard title="No ideas yet" kicker="Blank slate" className="empty-note-state">
          <p>Add an idea to capture a question or prompt worth revisiting.</p>
        </SectionCard>
      ) : (
        groups.map((group) => (
          <div key={group.key} className="priority-group">
            <button
              type="button"
              className="priority-group-heading priority-group-toggle"
              onClick={() => toggleGroup(group.key)}
              aria-expanded={!collapsedGroups[group.key]}
            >
              <span className={`priority-dot priority-dot-${group.key}`} />
              <h3>{group.label}</h3>
              <span className="priority-group-count">{group.items.length}</span>
              <span className="priority-group-chevron">{collapsedGroups[group.key] ? "+" : "-"}</span>
            </button>
            {!collapsedGroups[group.key] && <section className="card-grid">
              {group.items.map((idea) => (
                <article key={idea.id} className="section-card idea-card">
                  <div className="idea-card-body">
                    <div className="idea-card-head">
                      <span className={`priority-dot priority-dot-${idea.priority}`} />
                      <p className="card-kicker">{idea.priority} priority</p>
                    </div>
                    <h4 className="idea-prompt">{idea.prompt || "Untitled idea"}</h4>
                    <span className="idea-topic">{idea.topic || "No topic yet"}</span>
                    <div className="idea-detail-grid">
                      <div><span>Outcome</span><p>{idea.outcome || "Not captured yet."}</p></div>
                      <div><span>Notes</span><p>{idea.notes || "No notes yet."}</p></div>
                    </div>
                    <div className="card-meta idea-card-actions">
                      <span>{idea.discussed ? "Discussed" : "Not discussed"}</span>
                      <button className="chip" type="button" onClick={() => openEditModal(idea)}>Edit</button>
                      <button className="chip" type="button" onClick={() => archiveIdea(idea.id, true)}>Archive</button>
                    </div>
                  </div>
                </article>
              ))}
            </section>}
          </div>
        ))
      )}

      <details className="archive-list">
        <summary>Archived ideas ({archivedIdeas.length})</summary>
        <div className="archive-body">
          {archivedIdeas.length === 0 ? (
            <p className="empty-state">No archived ideas yet.</p>
          ) : (
            <>
              {archivedIdeas.map((idea) => (
                <div key={idea.id} className="archive-row">
                  <div>
                    <strong>{idea.prompt || "Untitled idea"}</strong>
                    <span>{idea.topic || "No topic"} · {priorityLabel[idea.priority]}</span>
                  </div>
                  <div className="page-actions archive-actions">
                    <button type="button" className="chip" onClick={() => openEditModal(idea)}>Edit</button>
                    <button type="button" className="chip" onClick={() => archiveIdea(idea.id, false)}>Restore</button>
                    <button type="button" className="chip modal-delete" onClick={() => deleteIdea(idea.id)}>Delete</button>
                  </div>
                </div>
              ))}
              <div className="archive-row archive-row-summary">
                <div>
                  <strong>Delete all archived ideas</strong>
                  <span>Remove old prompts in one step when the archive is no longer useful for later conversations.</span>
                </div>
                <div className="page-actions archive-actions">
                  <button type="button" className="chip modal-delete" onClick={deleteArchivedIdeas}>Delete all</button>
                </div>
              </div>
            </>
          )}
        </div>
      </details>

      {isModalOpen && (
        <div className="modal-backdrop" role="presentation" onClick={closeModal}>
          <div className="modal-card" role="dialog" aria-modal="true" aria-label={editingId ? "Edit idea" : "Add new idea"} onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div>
                <p className="card-kicker">{editingId ? "Edit entry" : "New entry"}</p>
                <h3>{editingId ? draft.prompt || "Edit idea" : "Add an idea"}</h3>
              </div>
              <div className="modal-actions">
                <button type="button" className="chip modal-close" onClick={closeModal}>Close</button>
                {editingId && <button type="button" className="chip modal-delete" onClick={() => deleteIdea(editingId)}>Delete</button>}
              </div>
            </div>
            <div className="modal-body expense-modal-body">
              <label>
                Prompt
                <input value={draft.prompt} onChange={(e) => setDraft((current) => ({ ...current, prompt: e.target.value }))} placeholder="What should we think through next?" />
              </label>
              <label>
                Topic
                <input value={draft.topic} onChange={(e) => setDraft((current) => ({ ...current, topic: e.target.value }))} placeholder="visa, school, housing, timing" />
              </label>
              <label>
                Priority
                <select value={draft.priority} onChange={(e) => setDraft((current) => ({ ...current, priority: e.target.value as Idea["priority"] }))}>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </label>
              <label>
                Outcome
                <textarea value={draft.outcome} onChange={(e) => setDraft((current) => ({ ...current, outcome: e.target.value }))} rows={3} placeholder="What did we decide or learn?" />
              </label>
              <label>
                Notes
                <textarea value={draft.notes} onChange={(e) => setDraft((current) => ({ ...current, notes: e.target.value }))} rows={3} placeholder="Optional notes" />
              </label>
              <label className="inline-toggle">
                <input type="checkbox" checked={draft.discussed} onChange={(e) => setDraft((current) => ({ ...current, discussed: e.target.checked }))} />
                Discussed
              </label>
              <button className="primary-button" type="button" onClick={saveIdea}>{editingId ? "Save idea" : "Add idea"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
