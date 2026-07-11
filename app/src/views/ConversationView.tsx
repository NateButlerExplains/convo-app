import { useEffect, useMemo, useRef, useState } from "react";
import type { ConversationContext, MoveMapData, ParsedTranscript, ParsedTranscriptItem, RecordedAudio } from "../types/move-map";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { Waveform } from "../components/Waveform";
import { TranscriptParserPanel } from "../components/TranscriptParserPanel";
import { transcribeRecording, transcribeRecordingWithSegments, type WhisperSegment } from "../lib/transcription-service";
import { useRecording } from "../hooks/useRecording";
import { parseTranscript } from "../lib/transcript-parser";
import { notifyMoveMapStateChanged } from "../lib/state-events";
import { getAllAudioMeta, getAudio, deleteAudio, deleteAudioMeta } from "../lib/audio-store";

const participants = ["Nate", "Shae"] as const;
const interruptTokens = 3;
const flashDurationMs = 10000;
const emptyNotes: Note[] = [];
const STORAGE_KEY = "barcelona-relocation-archived-sessions";

type StoredSession = ArchivedSession;

function loadStoredSessions(): ArchivedSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredSession[];
    return Array.isArray(parsed)
      ? parsed.filter(
          (s) =>
            s &&
            typeof s.id === "number" &&
            typeof s.label === "string" &&
            typeof s.endedAt === "string" &&
            s.report &&
            typeof s.report.totalSeconds === "number" &&
            typeof s.report.speakingTotals === "object" &&
            typeof s.report.interruptsUsed === "object" &&
            Array.isArray(s.report.notes) &&
            Array.isArray(s.report.actions) &&
            Array.isArray(s.report.homework) &&
            Array.isArray(s.report.brainstorm) &&
            Array.isArray(s.report.unresolvedQuestions),
        )
      : [];
  } catch {
    return [];
  }
}

function saveStoredSessions(sessions: ArchivedSession[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    console.warn("Could not save archived sessions — storage may be full.");
  }
}

type Participant = (typeof participants)[number];
type NoteType = "question" | "idea" | "follow-up";

type Note = { id: number; type: NoteType; text: string; resolved: boolean };
type SessionReport = {
  totalSeconds: number;
  speakingTotals: Record<Participant, number>;
  interruptsUsed: Record<Participant, number>;
  notes: Note[];
  actions: string[];
  homework: string[];
  brainstorm: string[];
  unresolvedQuestions: string[];
};
type ArchivedSession = {
  id: number;
  label: string;
  endedAt: string;
  report: SessionReport;
  parsedTranscript?: ParsedTranscript | null;
  recording?: RecordedAudio | null;
  taskContext?: ConversationContext | null;
};
type Flash = { id: number; text: string } | null;

const emptyTotals: Record<Participant, number> = { Nate: 0, Shae: 0 };
const emptyInterrupts: Record<Participant, number> = { Nate: 0, Shae: 0 };

function formatClock(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function noteStateLabel(note: Note) {
  return note.resolved ? "resolved" : "unresolved";
}

function flowLabel(totals: Record<Participant, number>) {
  if (totals.Nate === totals.Shae) return "Balanced";
  return totals.Nate > totals.Shae ? "Nate dominant" : "Shae dominant";
}

function buildSessionReport(
  totalSeconds: number,
  speakingTotals: Record<Participant, number>,
  interruptsUsed: Record<Participant, number>,
  notes: Note[],
): SessionReport {
  return {
    totalSeconds,
    speakingTotals: { ...speakingTotals },
    interruptsUsed: { ...interruptsUsed },
    notes: notes.map((note) => ({ ...note })),
    actions: notes.filter((note) => note.type === "follow-up").map((note) => note.text),
    homework: [],
    brainstorm: notes.filter((note) => note.type === "idea").map((note) => note.text),
    unresolvedQuestions: notes.filter((note) => !note.resolved).map((note) => note.text),
  };
}

// Plays a stored recording from IndexedDB inside an archived session.
// Builds an object URL from the blob and revokes it on unmount.
function ArchiveAudioPlayer({
  recording,
  onDelete,
}: {
  recording: RecordedAudio;
  onDelete: () => void;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let url: string | null = null;
    let cancelled = false;
    getAudio(recording.dbKey)
      .then((blob) => {
        if (cancelled) return;
        if (!blob) {
          setLoadError("Audio file is no longer available.");
          return;
        }
        url = URL.createObjectURL(blob);
        setBlobUrl(url);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Could not load audio playback.");
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [recording.dbKey]);

  return (
    <div className="archive-audio-player">
      <p className="eyebrow">Recording</p>
      {loadError ? (
        <p className="small-text">{loadError}</p>
      ) : blobUrl ? (
        <audio controls src={blobUrl} aria-label="Play session recording">
          Your browser does not support the audio element.
        </audio>
      ) : (
        <p className="small-text">Loading audio…</p>
      )}
      <div className="print-actions">
        <button
          type="button"
          className="delete-recording-btn"
          onClick={onDelete}
          aria-label="Delete recording"
        >
          Delete recording
        </button>
      </div>
    </div>
  );
}

export function ConversationView({ data: _data }: { data: MoveMapData }) {
  const [currentSpeaker, setCurrentSpeaker] = useState<Participant>("Nate");
  const [startingSpeaker, setStartingSpeaker] = useState<Participant>("Nate");
  const [speakingTotals, setSpeakingTotals] = useState<Record<Participant, number>>(emptyTotals);
  const [lastTickAt, setLastTickAt] = useState<number | null>(null);
  const [notes, setNotes] = useState<Note[]>(emptyNotes);
  const [nextNote, setNextNote] = useState("");
  const [nextType, setNextType] = useState<NoteType>("question");
  const [interrupts, setInterrupts] = useState<Record<Participant, number>>(emptyInterrupts);
  const [archive, setArchive] = useState<ArchivedSession[]>(() => loadStoredSessions());
  const [flash, setFlash] = useState<Flash>(null);
  const [parsed, setParsed] = useState<ParsedTranscript | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [taskContext, setTaskContext] = useState<ConversationContext | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const refreshContext = () => {
      try {
        const raw = window.localStorage.getItem("move-map:conversation-context");
        if (!raw) return;
        const parsed = JSON.parse(raw) as ConversationContext;
        if (parsed && typeof parsed.taskId === "string" && typeof parsed.taskTitle === "string" && typeof parsed.prompt === "string") {
          setTaskContext(parsed);
        }
      } catch {
        /* ignore */
      }
    };
    refreshContext();
    window.addEventListener("hashchange", refreshContext);
    window.addEventListener("storage", refreshContext);
    return () => {
      window.removeEventListener("hashchange", refreshContext);
      window.removeEventListener("storage", refreshContext);
    };
  }, []);
  const { recordingState, durationSeconds, stream, error, supported, startRecording, stopRecording, pauseRecording, resumeRecording } = useRecording();
  const sessionActive = recordingState === "recording" || recordingState === "paused";
  const isRecording = recordingState === "recording";
  const isPaused = recordingState === "paused";

  // ── Speaker floor log ──
  // Records who holds the floor and at what audio-elapsed second they took it,
  // so Whisper segments (which carry real audio timestamps) can be attributed
  // to the correct speaker.
  type FloorEntry = { atSeconds: number; speaker: Participant };
  const floorLogRef = useRef<FloorEntry[]>([]);

  // Mirror of `durationSeconds` kept in a ref so button handlers (which may
  // close over a stale render's value) always read the CURRENT audio-elapsed
  // seconds at the moment of the press. This is the crux of accurate floor-log
  // timestamps — durationSeconds freezes on pause and is what Whisper's segment
  // times share a timebase with.
  const durationSecondsRef = useRef<number>(durationSeconds);
  useEffect(() => {
    durationSecondsRef.current = durationSeconds;
  }, [durationSeconds]);

  // Returns the speaker who held the floor at time `t` (seconds).
  // The entry with the greatest atSeconds <= t wins; if t precedes every
  // entry, fall back to the starting speaker (the first log entry).
  function speakerAtTime(
    log: FloorEntry[],
    t: number,
    fallback: Participant,
  ): Participant {
    let current: Participant = log[0]?.speaker ?? fallback;
    for (const entry of log) {
      if (entry.atSeconds <= t) {
        current = entry.speaker;
      } else {
        break;
      }
    }
    return current;
  }

  // Builds a per-speaker-labeled transcript from Whisper segments using the
  // floor log. Consecutive segments by the same speaker are merged into one
  // line. Returns "" if there are no segments.
  function buildLabeledTranscript(
    segments: WhisperSegment[],
    log: FloorEntry[],
    startingSpeaker: Participant,
  ): string {
    if (!segments.length) return "";
    const lines: string[] = [];
    let currentSpeaker: Participant | null = null;
    let buffer = "";
    for (const seg of segments) {
      const speaker = speakerAtTime(log, seg.start, startingSpeaker);
      const text = seg.text.trim();
      if (!text) continue;
      if (speaker !== currentSpeaker) {
        if (currentSpeaker && buffer) {
          lines.push(`${currentSpeaker}: ${buffer.trim()}`);
        }
        currentSpeaker = speaker;
        buffer = text;
      } else {
        buffer += " " + text;
      }
    }
    if (currentSpeaker && buffer) {
      lines.push(`${currentSpeaker}: ${buffer.trim()}`);
    }
    return lines.join("\n");
  }

  useEffect(() => {
    if (recordingState !== "recording" || lastTickAt == null) return;
    const timer = window.setInterval(() => {
      const now = Date.now();
      const delta = Math.max(1, Math.round((now - lastTickAt) / 1000));
      setSpeakingTotals((current) => ({
        ...current,
        [currentSpeaker]: current[currentSpeaker] + delta,
      }));
      setLastTickAt(now);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [recordingState, lastTickAt, currentSpeaker]);

  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(() => setFlash(null), flashDurationMs);
    return () => window.clearTimeout(timer);
  }, [flash]);

  useEffect(() => {
    saveStoredSessions(archive);
  }, [archive]);


  const liveNotes = notes;
  const maxSpeakerSeconds = Math.max(speakingTotals.Nate, speakingTotals.Shae, 1);
  const interruptActor = currentSpeaker === "Nate" ? "Shae" : "Nate";
  const interruptDisabled = !sessionActive || interrupts[interruptActor] >= interruptTokens;

  const reportItems = useMemo(
    () => buildSessionReport(durationSeconds, speakingTotals, interrupts, notes),
    [durationSeconds, interrupts, notes, speakingTotals],
  );

  const switchSpeaker = (nextSpeaker?: Participant) => {
    if (!sessionActive) return;
    const target = nextSpeaker ?? (currentSpeaker === "Nate" ? "Shae" : "Nate");
    setCurrentSpeaker(target);
    floorLogRef.current.push({ atSeconds: durationSecondsRef.current, speaker: target });
    setLastTickAt(Date.now());
    setFlash({ id: Date.now(), text: `Switched to ${target}` });
  };

  const handleRecord = async () => {
    if (sessionActive) return;
    setCurrentSpeaker(startingSpeaker);
    floorLogRef.current = [{ atSeconds: 0, speaker: startingSpeaker }];
    setSpeakingTotals(emptyTotals);
    setInterrupts(emptyInterrupts);
    setNotes(emptyNotes);
    setLastTickAt(Date.now());
    // Clear the transcription cache for any prior session so a Retry after
    // this new recording began cannot re-parse an earlier session's labeled
    // text and attach it to the wrong recording (stale-state mix).
    lastRecordingRef.current = null;
    lastTranscriptTextRef.current = "";
    await startRecording();
  };

  const handleStop = () => {
    stopRecording();
  };

  const handlePauseOrResume = () => {
    if (isPaused) {
      resumeRecording();
      setLastTickAt(Date.now());
    } else {
      pauseRecording();
      setLastTickAt(null);
    }
  };

  const interrupt = () => {
    if (!sessionActive) return;
    if (interrupts[interruptActor] >= interruptTokens) return;
    setInterrupts((current) => ({
      ...current,
      [interruptActor]: current[interruptActor] + 1,
    }));
    setCurrentSpeaker(interruptActor);
    floorLogRef.current.push({ atSeconds: durationSecondsRef.current, speaker: interruptActor });
    setLastTickAt(Date.now());
    setFlash({ id: Date.now(), text: `${interruptActor} interrupted ${currentSpeaker}` });
  };

  // Holds the most recent recording so the Retry button can re-run Whisper
  // (not just the LLM parse) when transcription failed.
  const lastRecordingRef = useRef<RecordedAudio | null>(null);
  // Holds the most recent labeled transcript so Retry re-parses the same text
  // without needing to hit Whisper again (unless transcription itself failed).
  const lastTranscriptTextRef = useRef<string>("");

  // Transcribe with Whisper, then parse with the 9router LLM.
  // A Whisper/network failure surfaces a DISTINCT, retryable error — it must
  // never be reported as "No speech was detected".
  const transcribeAndParse = async (recording: RecordedAudio | null) => {
    setIsParsing(true);
    setParseError(null);
    setParsed(null);

    let segments: WhisperSegment[] = [];
    try {
      if (!recording) throw new Error("No recording available to transcribe.");
      const blob = await getAudio(recording.dbKey);
      if (!blob) throw new Error("Recording audio not found in storage.");
      const result = await transcribeRecordingWithSegments(blob);
      segments = result.segments;
    } catch (err) {
      console.warn("Whisper transcription failed:", err);
      setParseError(
        "Transcription service unavailable — check localhost:8000 (Whisper). Tap Retry to re-run transcription.",
      );
      setIsParsing(false);
      return null;
    }

    // Build the per-speaker labeled transcript from Whisper segments + floor log.
    const labeled = buildLabeledTranscript(segments, floorLogRef.current, startingSpeaker);

    if (!segments.length || !labeled.trim()) {
      setParseError("No speech was detected — nothing to analyze.");
      setIsParsing(false);
      return null;
    }

    // Remember the labeled text so Retry re-parses it without hitting Whisper.
    lastTranscriptTextRef.current = labeled;

    try {
      const result = await parseTranscript(labeled);
      setParsed(result);
      setIsParsing(false);
      return result;
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Failed to parse transcript");
      setIsParsing(false);
      return null;
    }
  };

  // Retry button: re-run the full transcription + parse pipeline from the
  // last recording so a Whisper/network failure is actually recoverable.
  const handleParse = async () => {
    const recording = lastRecordingRef.current;

    // If we already have a successfully-labeled transcript (Whisper succeeded
    // but the LLM parse failed), re-parse that same text without hitting
    // Whisper again.
    const cachedLabeled = lastTranscriptTextRef.current;
    if (cachedLabeled.trim()) {
      setIsParsing(true);
      setParseError(null);
      try {
        const result = await parseTranscript(cachedLabeled);
        setParsed(result);
        setIsParsing(false);
        if (result && recording) {
          setArchive((prev) =>
            prev.map((s) => (s.recording?.id === recording.id ? { ...s, parsedTranscript: result } : s)),
          );
        }
        return;
      } catch (err) {
        // Fall through to a full re-run below.
        setParseError(err instanceof Error ? err.message : "Failed to parse transcript");
        setIsParsing(false);
      }
    }

    const result = await transcribeAndParse(recording);
    if (result && recording) {
      setArchive((prev) =>
        prev.map((s) => (s.recording?.id === recording.id ? { ...s, parsedTranscript: result } : s)),
      );
    }
  };

  // On Stop: auto-save (done in hook), auto-transcribe with Whisper,
  // auto-parse with LLM, show extracted items, and auto-archive.
  const prevDoneState = useRef(recordingState);
  useEffect(() => {
    if (prevDoneState.current !== "done" && recordingState === "done") {
      (async () => {
        // Fetch the recording metadata from IndexedDB
        let recording: RecordedAudio | null = null;
        try {
          const metas = await getAllAudioMeta();
          if (metas.length)
            recording = metas.sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            )[0];
        } catch {}

        // Keep a reference so the Retry button can re-run Whisper + parse.
        lastRecordingRef.current = recording;

        const report = buildSessionReport(durationSeconds, speakingTotals, interrupts, notes);
        const sessionId = Date.now();
        setArchive((prev) => [
          {
            id: sessionId,
            label: `Session ${prev.length + 1}`,
            endedAt: new Date().toISOString(),
            report,
            parsedTranscript: null,
            recording,
            taskContext,
          },
          ...prev,
        ]);
        // reset live session
        setSpeakingTotals(emptyTotals);
        setInterrupts(emptyInterrupts);
        setNotes(emptyNotes);
        setCurrentSpeaker(startingSpeaker);
        setLastTickAt(null);

        const result = await transcribeAndParse(recording);
        if (result) {
          setArchive((prev) =>
            prev.map((s) => (s.id === sessionId ? { ...s, parsedTranscript: result } : s)),
          );
        }
      })();
    }
    prevDoneState.current = recordingState;
  }, [recordingState]);

  const addNote = () => {
    if (!nextNote.trim()) return;
    setNotes((current) => [
      ...current,
      { id: Date.now(), type: nextType, text: nextNote.trim(), resolved: false },
    ]);
    setNextNote("");
  };

  const toggleResolved = (id: number) => {
    setNotes((current) =>
      current.map((note) => (note.id === id ? { ...note, resolved: !note.resolved } : note)),
    );
  };

  const deleteArchive = (id: number) => {
    setArchive((current) => current.filter((session) => session.id !== id));
  };

  // Remove the stored audio + metadata for an archived session, then drop the
  // `recording` reference from that session so the UI updates.
  const deleteRecording = (sessionId: number, dbKey: string) => {
    setArchive((current) =>
      current.map((session) =>
        session.id === sessionId ? { ...session, recording: null } : session,
      ),
    );
    Promise.allSettled([deleteAudio(dbKey), deleteAudioMeta(dbKey)]).catch(() => {
      /* failure already reflected in UI by clearing the reference */
    });
  };

  const sendToTasks = (items: ParsedTranscriptItem[]) => {
    if (typeof window === "undefined" || items.length === 0) return;
    const KEY = "move-map:tasks-view";
    const makeTask = (item: ParsedTranscriptItem) => ({
      id: globalThis.crypto?.randomUUID?.() ?? `task-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: item.text,
      track: "Ad hoc conversation",
      status: "not_started",
      priority: item.confidence === "high" ? "high" : "medium",
      owner: item.owner ?? "Unassigned",
      due_date: new Date().toISOString().slice(0, 10),
      dependency_ids: [],
      related_document_ids: [],
      related_risk_ids: [],
      related_decision_id: "",
      conversation_prompt: item.text,
      follow_up_task_ids: [],
      notes: "Imported from conversation transcript parse.",
      archived: false,
    });
    let existing: Record<string, unknown> = {};
    let current: unknown[] = [];
    try {
      const raw = window.localStorage.getItem(KEY);
      const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
      existing = parsed && typeof parsed === "object" ? parsed : {};
      current = Array.isArray(existing.tasks) ? (existing.tasks as unknown[]) : [];
    } catch {
      existing = {};
      current = [];
    }
    const newTasks = items.map(makeTask);
    const next = [...newTasks, ...current];
    try {
      const merged = { ...existing, tasks: next };
      window.localStorage.setItem(KEY, JSON.stringify(merged));
      window.localStorage.setItem("move-map:conversation-context", JSON.stringify({
        taskId: newTasks[0]?.id ?? "",
        taskTitle: newTasks[0]?.title ?? "Conversation item",
        prompt: newTasks[0]?.conversation_prompt ?? "Imported from conversation transcript parse.",
        followUpTaskIds: newTasks[0]?.follow_up_task_ids ?? [],
        sectionKey: "Ad hoc conversation tasks",
        openedAt: new Date().toISOString(),
      }));
      setFlash({ id: Date.now(), text: `Sent ${newTasks.length} task${newTasks.length === 1 ? "" : "s"} to Tasks.` });
      window.location.hash = `#tasks-trigger-ad-hoc-conversation-tasks-${newTasks[0]?.id ?? ""}`;
      notifyMoveMapStateChanged();
    } catch {
      console.warn("Could not persist dispatched tasks.");
    }
  };

  const sendToDecisions = (items: ParsedTranscriptItem[]) => {
    if (typeof window === "undefined" || items.length === 0) return;
    const KEY = "move-map:decisions-view";
    const makeDecision = (item: ParsedTranscriptItem) => ({
      id: globalThis.crypto?.randomUUID?.() ?? `dec-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: item.text,
      status: "decided",
      readiness: "decided_for_now",
      options_considered: [],
      rationale: "Imported from conversation transcript parse.",
      decision_date: new Date().toISOString().slice(0, 10),
      approvers: item.owner ? [item.owner] : [],
      revisit_date: new Date().toISOString().slice(0, 10),
      related_task_ids: [],
      related_risk_ids: [],
      notes: "",
      archived: false,
    });
    let existing: Record<string, unknown> = {};
    let current: unknown[] = [];
    try {
      const raw = window.localStorage.getItem(KEY);
      const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
      existing = parsed && typeof parsed === "object" ? parsed : {};
      current = Array.isArray(existing.decisions) ? (existing.decisions as unknown[]) : [];
    } catch {
      existing = {};
      current = [];
    }
    const newDecisions = items.map(makeDecision);
    const next = [...newDecisions, ...current];
    try {
      const merged = { ...existing, decisions: next };
      window.localStorage.setItem(KEY, JSON.stringify(merged));
      window.localStorage.setItem("move-map:conversation-context", JSON.stringify({
        taskId: "",
        taskTitle: newDecisions[0]?.title ?? "Conversation decision",
        prompt: newDecisions[0]?.title ?? "Imported from conversation transcript parse.",
        followUpTaskIds: [],
        sectionKey: "decisions",
        openedAt: new Date().toISOString(),
      }));
      setFlash({ id: Date.now(), text: `Sent ${newDecisions.length} decision${newDecisions.length === 1 ? "" : "s"} to Decisions.` });
      window.location.hash = "#decisions";
      notifyMoveMapStateChanged();
    } catch {
      console.warn("Could not persist dispatched decisions.");
    }
  };

  const meter = (person: Participant) => `${Math.max(8, (speakingTotals[person] / maxSpeakerSeconds) * 100)}%`;

  return (
    <div className="view conversation-mode">
      <PageHeader eyebrow="Conversation" title="Family conversation tracker">
        {taskContext ? `${taskContext.taskTitle}: ${taskContext.prompt}` : "A shared space to guide move conversations, track who has spoken, capture open questions, and save what still needs a follow-up."}
      </PageHeader>

      <section className="recording-section unified-session">
        {taskContext && (
          <div className="conversation-context-banner">
            <strong>Working on: {taskContext.taskTitle}</strong>
            <p>{taskContext.prompt}</p>
            {taskContext.followUpTaskIds.length > 0 && (
              <ul>
                {taskContext.followUpTaskIds.map((id) => (
                  <li key={id}>{id.replace(/^task-/, "").replace(/-/g, " ")}</li>
                ))}
              </ul>
            )}
            <div className="conversation-context-actions">
              <a href={`#tasks-trigger-${(taskContext.sectionKey ?? "research").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${taskContext.taskId}`}>Back to exact task</a>
              <a href="#tasks">Open Tasks</a>
            </div>
          </div>
        )}
        <div className="recording-section-head">
          <div>
            <p className="eyebrow">Conversation recording</p>
            <h2>{sessionActive ? "Recording in progress" : "Record a family conversation"}</h2>
          </div>
        </div>
        <div className="session-pipeline" aria-label="Conversation processing flow">
          <span><strong>1</strong> Record</span>
          <span><strong>2</strong> Stop &amp; save</span>
          <span><strong>3</strong> Transcribe &amp; extract</span>
          <span><strong>4</strong> Review &amp; route</span>
        </div>

        {!sessionActive && (
          <div className="session-setup">
            <label className="speaker-pick">
              <span>Who starts?</span>
              <select
                value={startingSpeaker}
                onChange={(e) => setStartingSpeaker(e.target.value as Participant)}
                disabled={sessionActive}
              >
                <option value="Nate">Nate starts</option>
                <option value="Shae">Shae starts</option>
              </select>
            </label>

            <button
              type="button"
              className="record-session-btn"
              onClick={handleRecord}
              disabled={!supported || sessionActive}
            >
              Record session
            </button>

            {error && (
              <div className="mic-error-banner" role="alert">
                {error}
              </div>
            )}
          </div>
        )}

        {sessionActive && (
          <div className="session-live">
            <Waveform stream={stream} active={isRecording} />

            <div className="session-live-meta">
              <span className="recording-timer">{formatClock(durationSeconds)}</span>
              <span
                className={`recording-dot ${isRecording ? "is-live" : "is-paused"}`}
                aria-hidden="true"
              />
              {isPaused && <span className="session-paused-label">Paused</span>}
            </div>

            <div className="session-controls">
              <button type="button" onClick={handlePauseOrResume} disabled={!sessionActive}>
                {isPaused ? "Resume" : "Pause"}
              </button>
              <button type="button" className="stop-session-btn" onClick={handleStop} disabled={!sessionActive}>
                Stop &amp; save
              </button>
            </div>

            <div className={`mini-card current-speaker-${currentSpeaker.toLowerCase()}`}>
              <strong className="current-speaker-label">Current speaker: {currentSpeaker}</strong>
              <div className="print-actions">
                <button
                  onClick={() => switchSpeaker(currentSpeaker === "Nate" ? "Shae" : "Nate")}
                  disabled={!sessionActive}
                >
                  Switch to {currentSpeaker === "Nate" ? "Shae" : "Nate"}
                </button>
                <button
                  className={interruptDisabled ? "interrupt-button is-disabled" : "interrupt-button"}
                  onClick={interrupt}
                  disabled={interruptDisabled}
                  aria-disabled={interruptDisabled}
                  title={
                    interruptDisabled && sessionActive
                      ? `${interruptActor} has used all interrupt tokens`
                      : undefined
                  }
                >
                  Interrupt as {interruptActor} ({interruptTokens - interrupts[interruptActor]} left)
                </button>
              </div>
            </div>

            <div className="session-meters">
              {participants.map((person) => {
                const isActive = person === currentSpeaker && sessionActive;
                return (
                  <div key={person} className={`speaker-meter${isActive ? " glow" : ""}`}>
                    <div className="speaker-meter-head">
                      <strong>{person}</strong>
                      <span>
                        {formatClock(speakingTotals[person])} spoken · {interrupts[person]} interrupts used
                      </span>
                    </div>
                    <div className="speaker-meter-track">
                      <div className={`speaker-meter-fill ${person.toLowerCase()}`} style={{ width: meter(person) }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isParsing && (
          <div className="parser-loading" role="status">
            <span className="parser-spinner" aria-hidden="true" />
            <span>Analyzing conversation with LLM…</span>
          </div>
        )}

        {parsed && !isParsing && (
          <TranscriptParserPanel
            parsed={parsed}
            onSendToTasks={sendToTasks}
            onSendToDecisions={sendToDecisions}
            isParsing={isParsing}
          />
        )}

        {parseError && !isParsing && (
          <div className="parse-error-block">
            <p className="recording-error">{parseError}</p>
            <button type="button" onClick={handleParse} disabled={isParsing}>
              Retry
            </button>
          </div>
        )}
      </section>

      <section className="note-grid">
        <SectionCard title="Listener note queue" className="conversation-support-card">
          <p className="small-text">
            Capture questions, ideas, and follow-ups without breaking the flow. Archive keeps the notes that were actually created in each session.
          </p>
          <div className="note-entry-form">
            <select value={nextType} onChange={(e) => setNextType(e.target.value as NoteType)}>
              <option value="question">Question</option>
              <option value="idea">Idea</option>
              <option value="follow-up">Follow-up</option>
            </select>
            <input
              value={nextNote}
              onChange={(e) => setNextNote(e.target.value)}
              placeholder="Add a listener note without stopping the speaker"
            />
            <button onClick={addNote}>Add note</button>
          </div>
          <div className="archive-notes">
            {liveNotes.length === 0 ? (
              <div className="mini-card empty-note-state">No notes yet for this session.</div>
            ) : (
              liveNotes.map((note) => (
                <div key={note.id} className="mini-card">
                  <strong>
                    {note.type} · {noteStateLabel(note)}
                  </strong>
                  <p>{note.text}</p>
                  <div className="print-actions">
                    <button onClick={() => toggleResolved(note.id)}>
                      Mark as {note.resolved ? "unresolved" : "resolved"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard title="Session archive" className="conversation-support-card">
          <p className="small-text">End a session to freeze the totals, notes, and follow-through list for later review.</p>
          {archive.length > 0 && (
            <div className="print-actions" style={{ marginBottom: "0.75rem" }}>
              <button onClick={() => setArchive([])}>Clear all archive</button>
            </div>
          )}
          <div className="archive-list">
            {archive.length === 0 ? (
              <div className="mini-card">No archived sessions yet.</div>
            ) : (
              archive.map((session) => (
                <details key={session.id} className="mini-card" open>
                  <summary>
                    {session.label}  {new Date(session.endedAt).toLocaleString()}  {formatClock(session.report.totalSeconds)}
                    {session.taskContext ? `  ${session.taskContext.taskTitle}` : ""}
                  </summary>
                  <div className="archive-body">
                    {session.taskContext ? (
                      <div className="conversation-context-banner" style={{ marginTop: 0 }}>
                        <strong>Original task: {session.taskContext.taskTitle}</strong>
                        <p>{session.taskContext.prompt}</p>
                        {session.taskContext.followUpTaskIds.length > 0 ? <p>Follow-up: {session.taskContext.followUpTaskIds.map((id) => id.replace(/^task-/, "").replace(/-/g, " ")).join(", ")}</p> : null}
                      </div>
                    ) : null}

                    <div className="report-grid">
                      <div>
                        <span>Speaking totals</span>
                        <strong>
                          Nate {formatClock(session.report.speakingTotals.Nate)} / Shae {formatClock(session.report.speakingTotals.Shae)}
                        </strong>
                      </div>
                      <div>
                        <span>Interrupts used</span>
                        <strong>
                          Nate {session.report.interruptsUsed.Nate} / Shae {session.report.interruptsUsed.Shae}
                        </strong>
                      </div>
                    </div>

                    <div>
                      <p className="eyebrow">Archive notes</p>
                      <div className="archive-notes">
                        {session.report.notes.length === 0 ? (
                          <div className="mini-card">No notes were created in this session.</div>
                        ) : (
                          session.report.notes.map((note) => (
                            <div key={note.id} className="mini-card">
                              <strong>
                                {note.type} · {noteStateLabel(note)}
                              </strong>
                              <p>{note.text}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="report-grid">
                      <div>
                        <p className="eyebrow">Action items</p>
                        <ul className="clean-list">
                          {session.report.actions.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="eyebrow">Homework</p>
                        <ul className="clean-list">
                          {session.report.homework.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="report-grid">
                      <div>
                        <p className="eyebrow">Brainstorm</p>
                        <ul className="clean-list">
                          {session.report.brainstorm.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="eyebrow">Unresolved questions</p>
                        <ul className="clean-list">
                          {session.report.unresolvedQuestions.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {session.parsedTranscript && (
                      <div className="archive-parsed">
                        <p className="eyebrow">LLM parse</p>
                        {session.parsedTranscript.summary && (
                          <p className="archive-parsed-summary">{session.parsedTranscript.summary}</p>
                        )}
                        {session.parsedTranscript.actionItems.length > 0 && (
                          <div className="archive-parsed-group">
                            <span className="archive-parsed-label">Action items</span>
                            <ul className="clean-list">
                              {session.parsedTranscript.actionItems.map((item, idx) => (
                                <li key={`a-${idx}`}>{item.text}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {session.parsedTranscript.decisions.length > 0 && (
                          <div className="archive-parsed-group">
                            <span className="archive-parsed-label">Decisions</span>
                            <ul className="clean-list">
                              {session.parsedTranscript.decisions.map((item, idx) => (
                                <li key={`d-${idx}`}>{item.text}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {session.parsedTranscript.keyQuestions.length > 0 && (
                          <div className="archive-parsed-group">
                            <span className="archive-parsed-label">Key questions</span>
                            <ul className="clean-list">
                              {session.parsedTranscript.keyQuestions.map((item, idx) => (
                                <li key={`q-${idx}`}>{item.text}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {session.recording && (
                      <ArchiveAudioPlayer
                        recording={session.recording}
                        onDelete={() => deleteRecording(session.id, session.recording!.dbKey)}
                      />
                    )}

                    <div className="print-actions">
                      <button onClick={() => deleteArchive(session.id)}>Delete archive</button>
                    </div>
                  </div>
                </details>
              ))
            )}
          </div>
        </SectionCard>
      </section>
    </div>
  );
}
