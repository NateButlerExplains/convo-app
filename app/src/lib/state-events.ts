export const MOVE_MAP_STATE_CHANGED_EVENT = "move-map:state-changed";
export const TRANSCRIPT_READY_EVENT = "transcript-ready";
export const AUDIO_SAVED_EVENT = "audio-saved";

export function notifyMoveMapStateChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(MOVE_MAP_STATE_CHANGED_EVENT));
}

export function notifyTranscriptReady() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TRANSCRIPT_READY_EVENT));
}

export function notifyAudioSaved(detail?: { id: string; durationSeconds: number }) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AUDIO_SAVED_EVENT, { detail }));
}
