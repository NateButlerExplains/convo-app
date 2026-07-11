import { useEffect, useMemo, useState } from "react";
import type { MoveMapData } from "../types/move-map";
import { PageHeader } from "../components/PageHeader";
import { notifyMoveMapStateChanged } from "../lib/state-events";
import { SectionCard } from "../components/SectionCard";

type EventType = "deadline" | "family visit" | "daughter event" | "move milestone" | "important family date";

type CalendarEvent = { date: string; month: string; label: string; type: EventType; note: string };
type ModalMode = { kind: "event"; event: CalendarEvent } | { kind: "new"; date?: string } | null;

type CalendarEventForm = { date: string; label: string; type: EventType; note: string };

const months = [
  { id: "2026-07", label: "July 2026" },
  { id: "2026-08", label: "August 2026" },
  { id: "2026-09", label: "September 2026" },
  { id: "2026-10", label: "October 2026" },
  { id: "2026-11", label: "November 2026" },
  { id: "2026-12", label: "December 2026" },
  { id: "2027-01", label: "January 2027" },
];

const eventTypes: EventType[] = ["deadline", "family visit", "daughter event", "move milestone", "important family date"];

const events: CalendarEvent[] = [];
const STORAGE_KEY = "barcelona-relocation-calendar-events";

type StoredCalendarEvent = CalendarEvent;

function loadStoredEvents(): CalendarEvent[] {
  if (typeof window === "undefined") return events;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return events;
    const parsed = JSON.parse(raw) as StoredCalendarEvent[];
    return Array.isArray(parsed)
      ? parsed.filter((event) => event && typeof event.date === "string" && typeof event.month === "string" && typeof event.label === "string" && typeof event.type === "string" && typeof event.note === "string")
      : events;
  } catch {
    return events;
  }
}

function saveStoredEvents(nextEvents: CalendarEvent[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextEvents));
  } catch {
    console.warn("Could not save calendar events — storage may be full. Try exporting or clearing old data.");
  }
}

function splitCountdownParts(countdownText: string) {
  const tokens = countdownText.split(" ");
  const parts: { value: string; label: string }[] = [];
  for (let i = 0; i < tokens.length; i += 2) {
    const value = tokens[i];
    const label = tokens[i + 1];
    if (value && label) parts.push({ value, label });
  }
  return parts;
}

const typeClasses: Record<EventType, string> = {
  deadline: "event-deadline",
  "family visit": "event-family",
  "daughter event": "event-daughter",
  "move milestone": "event-move",
  "important family date": "event-family-important",
};

function monthStart(id: string) { return new Date(`${id}-01T00:00:00`); }
function pad(n: number) { return String(n).padStart(2, "0"); }
function toKey(date: Date) { return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`; }

export function FamilyTimelineView({ data }: { data: MoveMapData }) {
  const [activeMonth, setActiveMonth] = useState(months[0].id);
  const [selectedDate, setSelectedDate] = useState<string | null>(events[0]?.date ?? null);
  const [drafts, setDrafts] = useState<CalendarEvent[]>(() => loadStoredEvents());
  const [showAgenda, setShowAgenda] = useState(true);
  const [modal, setModal] = useState<ModalMode>(null);
  const [dragTarget, setDragTarget] = useState<string | null>(null);
  const [countdown, setCountdown] = useState("");
  const [newDraft, setNewDraft] = useState<CalendarEventForm>({ date: `${activeMonth}-01`, label: "", type: "move milestone", note: "" });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [pendingAddDate, setPendingAddDate] = useState<string | null>(null);

  const activeMonthDate = monthStart(activeMonth);
  const selectedEvent = useMemo(() => drafts.find((event) => event.date === selectedDate) ?? null, [drafts, selectedDate]);
  const defaultEntryDate = pendingAddDate ?? selectedDay ?? selectedDate ?? activeMonthDate.toISOString().slice(0, 10);
  const grouped = useMemo(() => Object.fromEntries(months.map((m) => [m.id, drafts.filter((event) => event.month === m.id)])), [drafts]);
  const monthEvents = useMemo(() => drafts.filter((event) => event.month === activeMonth), [drafts, activeMonth]);
  const activeMonthLabel = months.find((month) => month.id === activeMonth)?.label ?? activeMonth;
  const dragItemId = (event: CalendarEvent) => event.date + "|" + event.label + "|" + event.type + "|" + event.note;
  const moveEvent = (eventId: string, nextDate: string) => {
    setDrafts((current) => current.map((item) => (dragItemId(item) === eventId ? { ...item, date: nextDate, month: nextDate.slice(0, 7) } : item)));
    setSelectedDate(nextDate);
    setSelectedDay(nextDate);
  };
  useEffect(() => {
    const target = new Date("2027-01-15T00:00:00");
    const tick = () => {
      const now = new Date();
      const diff = Math.max(0, target.getTime() - now.getTime());
      const totalMonths = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
      const remainingDays = Math.floor(diff / 86400000) % 31;
      const remainingHours = Math.floor(diff / 3600000) % 24;
      const remainingMinutes = Math.floor(diff / 60000) % 60;
      const remainingSeconds = Math.floor(diff / 1000) % 60;
      setCountdown(`${Math.max(0, totalMonths)} month${totalMonths === 1 ? "" : "s"} ${remainingDays} day${remainingDays === 1 ? "" : "s"} ${remainingHours} hour${remainingHours === 1 ? "" : "s"} ${remainingMinutes} minute${remainingMinutes === 1 ? "" : "s"} ${remainingSeconds} second${remainingSeconds === 1 ? "" : "s"}`);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  const monthDays = useMemo(() => {
    const first = new Date(activeMonthDate.getFullYear(), activeMonthDate.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - ((first.getDay() + 6) % 7));
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [activeMonthDate]);
  const daysByDate = useMemo(() => drafts.reduce<Record<string, CalendarEvent[]>>((acc, event) => { (acc[event.date] ??= []).push(event); return acc; }, {}), [drafts]);

  useEffect(() => {
    saveStoredEvents(drafts);
    notifyMoveMapStateChanged();
  }, [drafts]);

  return (
    <div className="view family-timeline-view">
      <PageHeader eyebrow="Calendar" title="Family move calendar">
        A month-by-month calendar for deadlines, family dates, move milestones, and the events that need everyone to stay in sync.
      </PageHeader>

      <SectionCard title="Month view" kicker={activeMonthLabel} className="month-view-card">
        <div className="calendar-toolbar">
          <div className="month-switcher">
            <button className="chip" type="button" onClick={() => setActiveMonth(months[Math.max(0, months.findIndex((m) => m.id === activeMonth) - 1)]?.id ?? activeMonth)}>Prev</button>
            <button className="chip" type="button" onClick={() => setActiveMonth(months[Math.min(months.length - 1, months.findIndex((m) => m.id === activeMonth) + 1)]?.id ?? activeMonth)}>Next</button>
          </div>
          <div className="calendar-actions">
            <button className="chip button-primary" type="button" onClick={() => { setNewDraft({ date: defaultEntryDate, label: "", type: "move milestone", note: "" }); setModal({ kind: "new", date: defaultEntryDate }); }}>Add new entry</button>
          </div>
        </div>
        {countdown && (
          <div className="countdown-ticker" aria-live="polite">
            <div className="flap-label">The Big Move Countdown</div>
            <div className="countdown-rows">
              {splitCountdownParts(countdown).map(({ value, label }) => (
                <div key={`${value}-${label}`} className="countdown-row">
                  <span className="countdown-value">{value}</span>
                  <span className="countdown-label">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="calendar-shell">
          <div className="calendar-grid">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <div key={day} className="calendar-dow">{day}</div>)}
            {monthDays.map((date) => {
              const key = toKey(date);
              const inMonth = date.getMonth() === activeMonthDate.getMonth();
              const items = daysByDate[key] ?? [];
              const isSelected = key === selectedDate;
              return (
                <div
                  key={key}
                  className={`calendar-day ${inMonth ? "in-month" : "out-month"} ${isSelected ? "selected" : ""} ${dragTarget === key ? "drag-over" : ""}`}
                  onDragEnter={() => setDragTarget(key)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragTarget(key);
                  }}
                  onDragLeave={() => setDragTarget((current) => (current === key ? null : current))}
                  onDrop={(e) => {
                    const eventId = e.dataTransfer.getData("text/calendar-event");
                    if (!eventId) return;
                    moveEvent(eventId, key);
                    setDragTarget(null);
                  }}
                >
                  <button type="button" className="calendar-day-button" onClick={() => { setSelectedDate(key); setSelectedDay(key); setModal({ kind: "new", date: key }); }}>
                    <span>{date.getDate()}</span>
                  </button>
                  <div className="calendar-items">
                    {items.slice(0, 3).map((event) => <button key={dragItemId(event)} type="button" draggable onDragStart={(e) => e.dataTransfer.setData("text/calendar-event", dragItemId(event))} className={`calendar-item ${typeClasses[event.type]}`} onClick={() => { setSelectedDate(event.date); setModal({ kind: "event", event }); }}>{event.label}</button>)}
                    {items.length > 3 && <span className="calendar-more">+{items.length - 3} more</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="calendar-hint">Drag entries between days. Click an entry to edit details.</p>
        </div>
      </SectionCard>

      {showAgenda && (
        <SectionCard title="Agenda view" kicker="Existing list kept below the calendar" className="agenda-section">
          <div className="agenda-grid">
            {months.map((month) => (
              <article key={month.id} className="agenda-month">
                <h3>{month.label}</h3>
                <div className="agenda-items">
                  {(grouped[month.id] ?? []).map((event) => (
                    <button key={dragItemId(event)} type="button" className={`agenda-item ${event.date === selectedDate ? "selected" : ""}`} onClick={() => { setSelectedDate(event.date); setModal({ kind: "event", event }); }}>{event.date} · {event.label}</button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </SectionCard>
      )}

      {modal && (
        <div className="modal-backdrop" role="presentation" onClick={() => setModal(null)}>
          <div className="modal-card" role="dialog" aria-modal="true" aria-label={modal.kind === "event" ? modal.event.label : "Add new entry"} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <p className="card-kicker">{modal.kind === "event" ? modal.event.type : "Add new entry"}</p>
                <h3>{modal.kind === "event" ? modal.event.label : "New calendar item"}</h3>
              </div>
              <div className="modal-actions">
                <button type="button" className="chip modal-close" onClick={() => setModal(null)}>Close</button>
                {modal.kind === "event" && (
                  <button type="button" className="chip modal-delete" onClick={() => {
                    const key = dragItemId(modal.event);
                    setDrafts((current) => current.filter((item) => dragItemId(item) !== key));
                    setModal(null);
                  }}>Delete</button>
                )}
              </div>
            </div>
            {modal.kind === "event" ? (
              <div className="modal-body">
                <label>Date<input type="date" value={modal.event.date} onChange={(e) => {
                  const nextDate = e.target.value;
                  setDrafts((current) => current.map((item) => item.date + item.label === modal.event.date + modal.event.label ? { ...item, date: nextDate, month: nextDate.slice(0, 7) } : item));
                  setSelectedDate(nextDate);
                  setModal({ kind: "event", event: { ...modal.event, date: nextDate, month: nextDate.slice(0, 7) } });
                }} /></label>
                <label>Type<select value={modal.event.type} onChange={(e) => {
                  const nextType = e.target.value as EventType;
                  setDrafts((current) => current.map((item) => item.date + item.label === modal.event.date + modal.event.label ? { ...item, type: nextType } : item));
                  setModal({ kind: "event", event: { ...modal.event, type: nextType } });
                }}>{eventTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
                <label>Title<input value={modal.event.label} onChange={(e) => {
                  const nextLabel = e.target.value;
                  setDrafts((current) => current.map((item) => item.date + item.label === modal.event.date + modal.event.label ? { ...item, label: nextLabel } : item));
                  setModal({ kind: "event", event: { ...modal.event, label: nextLabel } });
                }} /></label>
                <label>Note<textarea rows={4} value={modal.event.note} onChange={(e) => {
                  const nextNote = e.target.value;
                  setDrafts((current) => current.map((item) => item.date + item.label === modal.event.date + modal.event.label ? { ...item, note: nextNote } : item));
                  setModal({ kind: "event", event: { ...modal.event, note: nextNote } });
                }} /></label>
              </div>
            ) : (
              <div className="modal-body">
                <label>Date<input value={newDraft.date} onChange={(e) => setNewDraft((current) => ({ ...current, date: e.target.value }))} type="date" /></label>
                <label>Type<select value={newDraft.type} onChange={(e) => setNewDraft((current) => ({ ...current, type: e.target.value as EventType }))}>{eventTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
                <label>Title<input value={newDraft.label} onChange={(e) => setNewDraft((current) => ({ ...current, label: e.target.value }))} placeholder="New family timeline item" /></label>
                <label>Note<textarea value={newDraft.note} onChange={(e) => setNewDraft((current) => ({ ...current, note: e.target.value }))} rows={4} placeholder="Short note for why this matters" /></label>
                <button className="primary-button" type="button" onClick={() => {
                  if (!newDraft.label.trim()) return;
                  const nextItem: CalendarEvent = { date: newDraft.date, month: newDraft.date.slice(0, 7), label: newDraft.label.trim(), type: newDraft.type, note: newDraft.note.trim() || "New local planning item." };
                  setDrafts((current) => [nextItem, ...current]);
                  setSelectedDate(newDraft.date);
                  setActiveMonth(newDraft.date.slice(0, 7));
                  setModal(null);
                  setNewDraft({ date: `${activeMonth}-01`, label: "", type: "move milestone", note: "" });
                }}>Save entry</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
