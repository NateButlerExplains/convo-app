import { useEffect, useState } from "react";
import type { MoveMapData, SnapshotRecord } from "../types/move-map";
import { formatDate } from "../lib/formatters";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { PrintActions } from "../components/PrintActions";
import { notifyMoveMapStateChanged } from "../lib/state-events";

const STORAGE_KEY = "barcelona-move-map.snapshots.v1";

const createBlankSnapshot = (): SnapshotRecord => ({
  id: `snapshot-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  title: "",
  type: "full",
  created_at: "",
  included_sections: [],
  output_path: "",
  notes: "",
});

const normalizeSnapshot = (snapshot: Partial<SnapshotRecord>, index: number): SnapshotRecord => ({
  id: snapshot.id || `snapshot-${index}`,
  title: snapshot.title ?? "",
  type: snapshot.type ?? "full",
  created_at: snapshot.created_at ?? "",
  included_sections: snapshot.included_sections ?? [],
  output_path: snapshot.output_path ?? "",
  notes: snapshot.notes ?? "",
});

function loadStoredSnapshots(sourceSnapshots: SnapshotRecord[]): SnapshotRecord[] {
  if (typeof window === "undefined") return sourceSnapshots.map(normalizeSnapshot);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return sourceSnapshots.map(normalizeSnapshot);
    const parsed = JSON.parse(raw) as Partial<SnapshotRecord>[];
    return Array.isArray(parsed) ? parsed.map(normalizeSnapshot) : sourceSnapshots.map(normalizeSnapshot);
  } catch {
    return sourceSnapshots.map(normalizeSnapshot);
  }
}

function saveStoredSnapshots(nextSnapshots: SnapshotRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSnapshots));
}

export function SnapshotsView({ data }: { data: MoveMapData }) {
  const [snapshots, setSnapshots] = useState<SnapshotRecord[]>(() => loadStoredSnapshots(data.snapshots));

  useEffect(() => {
    saveStoredSnapshots(snapshots);
    notifyMoveMapStateChanged();
  }, [snapshots]);

  const addSnapshot = () => setSnapshots((current) => [...current, createBlankSnapshot()]);
  const clearSnapshots = () => setSnapshots([]);
  const updateSnapshot = (index: number, updates: Partial<SnapshotRecord>) => {
    setSnapshots((current) => current.map((snapshot, currentIndex) => (currentIndex === index ? { ...snapshot, ...updates } : snapshot)));
  };

  return (
    <div className="view">
      <PageHeader eyebrow="Snapshots" title="Preserve today’s version of the plan">
        Work from blank local state, add only the snapshots you want to keep, and keep them in browser storage until you clear the list.
      </PageHeader>

      <section className="hero-card">
        <div>
          <h2>Local snapshot editor</h2>
          <p>Snapshot records stay in browser storage so they survive refreshes on this device.</p>
        </div>
        <div className="print-actions" aria-label="Snapshot editor actions">
          <button type="button" onClick={addSnapshot}>Add snapshot</button>
          <button type="button" onClick={clearSnapshots}>Clear all</button>
        </div>
      </section>

      <section className="hero-card">
        <div>
          <h2>Local export actions</h2>
          <p>Snapshots are dated family planning artifacts, not final advice or cloud backups.</p>
        </div>
        <PrintActions data={data} />
      </section>

      {snapshots.length === 0 ? (
        <SectionCard title="No snapshots yet" kicker="Blank slate" className="empty-note-state">
          <p>Add a snapshot to capture a point-in-time record of the plan.</p>
        </SectionCard>
      ) : (
        <section className="card-grid">
          {snapshots.map((snapshot, index) => (
            <SectionCard key={snapshot.id} title={snapshot.title || `Snapshot ${index + 1}`} kicker={snapshot.type}>
              <div className="modal-body">
                <label>
                  Title
                  <input value={snapshot.title} onChange={(event) => updateSnapshot(index, { title: event.target.value })} placeholder="March planning export" />
                </label>
                <label>
                  Type
                  <select value={snapshot.type} onChange={(event) => updateSnapshot(index, { type: event.target.value as SnapshotRecord["type"] })}>
                    <option value="full">Full</option>
                    <option value="budget">Budget</option>
                    <option value="decisions">Decisions</option>
                    <option value="roadmap">Roadmap</option>
                    <option value="open_questions">Open questions</option>
                    <option value="documents">Documents</option>
                  </select>
                </label>
                <label>
                  Created
                  <input type="date" value={snapshot.created_at} onChange={(event) => updateSnapshot(index, { created_at: event.target.value })} />
                </label>
                <label>
                  Included sections
                  <textarea value={snapshot.included_sections.join(", ")} onChange={(event) => updateSnapshot(index, { included_sections: event.target.value.split(",").map((section) => section.trim()).filter(Boolean) })} rows={2} placeholder="comma, separated, sections" />
                </label>
                <label>
                  Output path
                  <input value={snapshot.output_path} onChange={(event) => updateSnapshot(index, { output_path: event.target.value })} placeholder="/exports/march-plan.json" />
                </label>
                <label>
                  Notes
                  <textarea value={snapshot.notes} onChange={(event) => updateSnapshot(index, { notes: event.target.value })} rows={3} placeholder="Optional notes" />
                </label>
                <p className="small-text">{snapshot.created_at ? `Created ${formatDate(snapshot.created_at)}` : "No creation date yet"}</p>
                <div className="print-actions">
                  <button type="button" onClick={() => updateSnapshot(index, { type: "full" })}>Set full</button>
                  <button type="button" onClick={() => updateSnapshot(index, { included_sections: [] })}>Clear sections</button>
                </div>
              </div>
            </SectionCard>
          ))}
        </section>
      )}
    </div>
  );
}
