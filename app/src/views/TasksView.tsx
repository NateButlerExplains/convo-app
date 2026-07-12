import { useEffect, useMemo, useState } from "react";
import type { ConversationPrompt, GoalWorkspace } from "../types/convo";
import type { MoveMapData, Task } from "../types/move-map";
import { formatDate, titleCase } from "../lib/formatters";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { StatusPill } from "../components/StatusPill";
import { notifyMoveMapStateChanged } from "../lib/state-events";

type TaskDraft = {
  title: string;
  track: string;
  status: Task["status"];
  priority: Task["priority"];
  owner: string;
  dueDate: string;
  notes: string;
};

type EditableTask = Task & { id: string; archived: boolean };
type TasksStorageState = { tasks: EditableTask[]; draft: TaskDraft };

const STORAGE_KEY = "move-map:tasks-view";
const blankDraft: TaskDraft = { title: "", track: "", status: "not_started", priority: "medium", owner: "", dueDate: "", notes: "" };

function loadStoredState(): TasksStorageState | null {
  if (typeof window === "undefined") return null;
  try { const raw = window.localStorage.getItem(STORAGE_KEY); if (!raw) return null; const parsed = JSON.parse(raw) as Partial<TasksStorageState>; return { tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [], draft: parsed.draft ?? blankDraft }; }
  catch { return null; }
}

function createTask(draft: TaskDraft): EditableTask {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: draft.title.trim() || "Untitled task",
    track: draft.track.trim() || "General",
    status: draft.status,
    priority: draft.priority ?? "medium",
    owner: draft.owner.trim() || "Unassigned",
    due_date: draft.dueDate || new Date().toISOString().slice(0, 10),
    dependency_ids: [],
    related_document_ids: [],
    related_risk_ids: [],
    related_decision_id: "",
    notes: draft.notes.trim(),
    conversation_prompt: undefined,
    follow_up_task_ids: undefined,
    archived: false,
  };
}
function draftFromTask(task: EditableTask): TaskDraft { return { title: task.title, track: task.track, status: task.status, priority: task.priority ?? "medium", owner: task.owner, dueDate: task.due_date, notes: task.notes }; }

function findConversationPrompt(task: EditableTask, prompts: ConversationPrompt[]) {
  return prompts.find((prompt) => prompt.related_task_ids.includes(task.id));
}

export function TasksView({ data, goalWorkspace }: { data: MoveMapData; goalWorkspace?: GoalWorkspace }) {
  const [tasks, setTasks] = useState<EditableTask[]>(() => loadStoredState()?.tasks ?? data.tasks.map((task) => ({ ...task, archived: false })));
  const [draft, setDraft] = useState<TaskDraft>(blankDraft);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [jumpedSection, setJumpedSection] = useState("");
  const [jumpedTaskId, setJumpedTaskId] = useState("");
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const syncJump = () => {
      const hash = window.location.hash;
      const next = hash.startsWith("#tasks-trigger-") ? hash.slice("#tasks-trigger-".length) : "";
      const taskId = next.match(/task-[a-z0-9-]+$/)?.[0] ?? "";
      const sectionSlug = taskId ? next.slice(0, next.lastIndexOf(`-${taskId}`)).replace(/-task$/, "") : next;
      setJumpedSection(sectionSlug);
      setJumpedTaskId(taskId);
      if (sectionSlug) {
        window.requestAnimationFrame(() => {
          const taskTarget = taskId ? document.getElementById(`task-card-${taskId}`) : null;
          const target = taskTarget ?? document.getElementById(`tasks-trigger-${sectionSlug}`);
          target?.scrollIntoView({ behavior: "smooth", block: "center" });
          target?.focus({ preventScroll: true });
        });
      }
    };
    syncJump();
    window.addEventListener("hashchange", syncJump);
    return () => window.removeEventListener("hashchange", syncJump);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks, draft }));
    notifyMoveMapStateChanged();
  }, [tasks, draft]);

  const activeTasks = useMemo(() => tasks.filter((task) => !task.archived), [tasks]);
  const archivedTasks = useMemo(() => tasks.filter((task) => task.archived), [tasks]);
  const seedTasks = useMemo(() => data.tasks.map((task) => ({ ...task, archived: false })), [data.tasks]);
  const librarySource = useMemo(() => Array.from(new Map([...seedTasks, ...activeTasks].map((task) => [task.id, task])).values()), [activeTasks, seedTasks]);
  const conversationPrompts = goalWorkspace?.conversation_prompts ?? [];

  const triggerLibrary = useMemo(() => {
    const sections = [
      { key: "Ad hoc conversation tasks", title: "Conversation Radar", seedIds: [] },
      { key: "Research and feasibility", title: "Research", seedIds: ["task-family-priorities", "task-family-must-haves"] },
      { key: "Visa and residency", title: "Visa Path", seedIds: ["task-visa-assumptions", "task-visa-compare-options"] },
      { key: "Budget and savings", title: "Budget Confidence", seedIds: ["task-budget-ranges", "task-budget-buffer"] },
      { key: "Documents", title: "Documents", seedIds: ["task-document-inventory", "task-document-deadlines"] },
      { key: "Housing and neighborhoods", title: "Housing & Schools", seedIds: ["task-neighborhood-shortlist", "task-neighborhood-housing-filters", "task-school-timing", "task-school-question-list"] },
      { key: "Travel and arrival", title: "Travel", seedIds: ["task-arrival-checklist", "task-arrival-packet"] },
    ];
    const seededIds = new Set(sections.flatMap((section) => section.seedIds));
    const derived = sections.map((section) => {
      const items = section.seedIds.length > 0
        ? librarySource.filter((task) => section.seedIds.includes(task.id))
        : librarySource.filter((task) => !seededIds.has(task.id) && (!!task.conversation_prompt || task.track.toLowerCase().includes("conversation")));
      const completeCount = items.filter((task) => task.status === "done").length;
      const sectionSlug = section.key.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const hashFocused = jumpedSection === sectionSlug;
      const isComplete = items.length > 0 && completeCount === items.length;
      return { ...section, items, completeCount, sectionSlug, hashFocused, isComplete };
    });

    const researchComplete = derived.find((section) => section.key === "Research and feasibility")?.isComplete ?? false;
    const nextFocus = researchComplete
      ? derived.find((section) => section.key !== "Ad hoc conversation tasks" && !section.isComplete)
      : derived.find((section) => section.key === "Research and feasibility");

    return derived.map((section) => {
      const isRadar = section.key === "Ad hoc conversation tasks";
      const isFocusDefault = nextFocus?.key === section.key;
      const isFocused = section.hashFocused || isFocusDefault;
      const isDimmed = !isRadar && !isFocused;
      const defaultExpanded = isRadar || isFocusDefault;
      return { ...section, isRadar, isFocused, isDimmed, defaultExpanded };
    });
  }, [jumpedSection, librarySource]);

  const toggleSection = (sectionKey: string, defaultExpanded: boolean) => {
    setCollapsedSections((current) => {
      const currentValue = current[sectionKey] ?? !defaultExpanded;
      return { ...current, [sectionKey]: !currentValue };
    });
  };

  const openModal = () => { setEditingId(null); setDraft(blankDraft); setIsModalOpen(true); };
  const openEditModal = (task: EditableTask) => { setEditingId(task.id); setDraft(draftFromTask(task)); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setEditingId(null); setDraft(blankDraft); };
  const saveTask = () => { if (!draft.title.trim()) return; if (editingId) setTasks((current) => current.map((task) => task.id === editingId ? { ...task, ...createTask(draft), id: task.id, archived: task.archived } : task)); else setTasks((current) => [createTask(draft), ...current]); closeModal(); };
  const archiveTask = (id: string, archived: boolean) => { setTasks((current) => current.map((task) => (task.id === id ? { ...task, archived } : task))); if (editingId === id && archived) closeModal(); };
  const deleteTask = (id: string) => { setTasks((current) => current.filter((task) => task.id !== id)); if (editingId === id) closeModal(); };
  const deleteArchivedTasks = () => { setTasks((current) => current.filter((task) => !task.archived)); if (editingId && tasks.find((task) => task.id === editingId)?.archived) closeModal(); };

  return (
    <div className="view spreadsheet-view">
      <PageHeader title="Tasks">
        Trigger library and editable task board for the move.
      </PageHeader>

      <SectionCard title="Trigger library" kicker="Conversation-led next steps">
        <div className="trigger-library-grid">
          {triggerLibrary.map((section) => {
            const isCollapsed = collapsedSections[section.key] ?? !section.defaultExpanded;
            return (
              <article key={section.key} className={`trigger-library-card ${section.isFocused ? "is-jumped" : ""} ${section.isDimmed ? "is-dimmed" : ""}`} id={`tasks-trigger-${section.sectionSlug}`} tabIndex={-1}>
                <button type="button" className="trigger-library-head trigger-library-toggle" onClick={() => toggleSection(section.key, section.defaultExpanded)} aria-expanded={!isCollapsed}>
                  <div className="trigger-library-title-block"><p className="card-kicker">{section.title}</p><strong>{section.key}</strong>{section.isFocused ? <span className="from-home-badge">Focus here first</span> : null}</div>
                  <div className="trigger-library-head-meta">
                    <span className={`trigger-count ${section.isFocused ? "is-current" : "is-complete"}`}>{section.completeCount}/{section.items.length} complete</span>
                    <span className="priority-group-chevron">{isCollapsed ? "+" : "-"}</span>
                  </div>
                </button>
                {section.isRadar && section.isFocused ? <p className="trigger-library-instruction">Start with the glowing conversation card below. The other sections stay available for later.</p> : null}
                {!isCollapsed && <div className="track-list trigger-library-items">
                  {section.items.map((task) => {
                    const hasConversation = Boolean(task.conversation_prompt);
                    const matchedPrompt = hasConversation ? findConversationPrompt(task, conversationPrompts) : undefined;
                    return (
                      <div key={task.id} id={`task-card-${task.id}`} tabIndex={-1} className={`track-row road-track-row trigger-library-item trigger-library-panel ${jumpedTaskId === task.id ? "is-target-task" : ""}`}>
                        <div className="trigger-task-copy">
                          <StatusPill status={task.status} />
                          <strong>{task.title}</strong>
                          <p>{task.notes || "No notes yet."}</p>
                          {hasConversation ? <p className="task-conversation-prompt">Discussion: {task.conversation_prompt}</p> : null}
                        </div>
                        {hasConversation ? <div className="trigger-task-actions"><button type="button" className="task-link" onClick={() => { const ctx = { taskId: task.id, taskTitle: task.title, prompt: matchedPrompt?.prompt_text?.trim() || task.conversation_prompt, followUpTaskIds: task.follow_up_task_ids ?? [], sectionKey: section.key, openedAt: new Date().toISOString(), conversationPromptId: matchedPrompt?.id, promptPurpose: matchedPrompt?.purpose }; try { window.localStorage.setItem("move-map:conversation-context", JSON.stringify(ctx)); } catch {} window.location.hash = "#conversation"; }}>Open conversation</button></div> : null}
                      </div>
                    );
                  })}
                </div>}
              </article>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Task board" kicker="Editable task ledger"><div className="expense-table-wrap"><table className="planning-table expense-table"><thead><tr><th>Track</th><th>Task</th><th>Priority</th><th>Status</th><th>Owner</th><th>Due</th><th>Notes</th><th>Actions</th></tr></thead><tbody>{activeTasks.length === 0 ? <tr><td colSpan={8} className="empty-state">No active tasks yet.</td></tr> : activeTasks.map((task) => <tr key={task.id}><td>{task.track || "General"}</td><td>{task.title}</td><td><span className={`priority-badge priority-${task.priority ?? "medium"}`}>{titleCase(task.priority ?? "medium")} priority</span></td><td><StatusPill status={task.status} /></td><td>{task.owner}</td><td>{formatDate(task.due_date)}</td><td>{task.notes || ""}</td><td className="row-actions"><details className="row-actions-menu"><summary aria-label="Row actions" title="Row actions"></summary><div className="row-actions-popover" role="menu"><button type="button" role="menuitem" onClick={() => openEditModal(task)}>Edit</button><button type="button" role="menuitem" onClick={() => archiveTask(task.id, true)}>Archive</button><button type="button" role="menuitem" onClick={() => deleteTask(task.id)}>Delete</button></div></details></td></tr>)}</tbody></table></div></SectionCard>
      <details className="archive-list"><summary>Archived tasks ({archivedTasks.length})</summary><div className="archive-body">{archivedTasks.length === 0 ? <p className="empty-state">No archived tasks yet.</p> : <>{archivedTasks.map((task) => <div key={task.id} className="archive-row"><div><strong>{task.title}</strong><span>{task.track || "General"}  {titleCase(task.status)}  due {formatDate(task.due_date)}</span></div><div className="page-actions archive-actions"><button type="button" className="chip" onClick={() => openEditModal(task)}>Edit</button><button type="button" className="chip" onClick={() => archiveTask(task.id, false)}>Restore</button><button type="button" className="chip modal-delete" onClick={() => deleteTask(task.id)}>Delete</button></div></div>)}<div className="archive-row archive-row-summary"><div><strong>Delete all archived tasks</strong><span>Clear completed-or-paused history once you are done using it as a reference.</span></div><div className="page-actions archive-actions"><button type="button" className="chip modal-delete" onClick={deleteArchivedTasks}>Delete all</button></div></div></>}</div></details>
      {isModalOpen && <div className="modal-backdrop" role="presentation" onClick={closeModal}><div className="modal-card" role="dialog" aria-modal="true" aria-label={editingId ? "Edit task" : "Add new task"} onClick={(event) => event.stopPropagation()}><div className="modal-head"><div><p className="card-kicker">{editingId ? "Edit entry" : "New entry"}</p><h3>{editingId ? draft.title || "Edit task" : "Add a task"}</h3></div><div className="modal-actions"><button type="button" className="chip modal-close" onClick={closeModal}>Close</button>{editingId && <button type="button" className="chip modal-delete" onClick={() => deleteTask(editingId)}>Delete</button>}</div></div><div className="modal-body expense-modal-body"><label>Title<input value={draft.title} onChange={(e) => setDraft((current) => ({ ...current, title: e.target.value }))} placeholder="Book appointment, compare neighborhood, gather docs" /></label><label>Track<input value={draft.track} onChange={(e) => setDraft((current) => ({ ...current, track: e.target.value }))} placeholder="visa, housing, travel, family" /></label><label>Status<select value={draft.status} onChange={(e) => setDraft((current) => ({ ...current, status: e.target.value as Task["status"] }))}><option value="not_started">not_started</option><option value="in_progress">in_progress</option><option value="waiting">waiting</option><option value="done">done</option><option value="blocked">blocked</option></select></label><label>Priority<select value={draft.priority ?? "medium"} onChange={(e) => setDraft((current) => ({ ...current, priority: e.target.value as Task["priority"] }))}><option value="high">High  work next</option><option value="medium">Medium  track in queue</option><option value="low">Low  do later</option></select></label><label>Owner<input value={draft.owner} onChange={(e) => setDraft((current) => ({ ...current, owner: e.target.value }))} placeholder="Nate, Shae, shared" /></label><label>Due date<input type="date" value={draft.dueDate} onChange={(e) => setDraft((current) => ({ ...current, dueDate: e.target.value }))} /></label><label>Notes<textarea rows={4} value={draft.notes} onChange={(e) => setDraft((current) => ({ ...current, notes: e.target.value }))} placeholder="Why this task matters" /></label><button className="primary-button" type="button" onClick={saveTask}>Save task</button></div></div></div>}
    </div>
  );
}
