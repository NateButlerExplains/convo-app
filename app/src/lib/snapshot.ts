import type { MoveMapData } from "../types/move-map";
import { todayStamp } from "./formatters";

export function buildSnapshot(data: MoveMapData) {
  return { exported_at: new Date().toISOString(), schema_version: data.meta.schema_version, plan_summary: data.plan, disclaimer: data.meta.disclaimer, data };
}

export function downloadJsonSnapshot(data: MoveMapData) {
  const blob = new Blob([JSON.stringify(buildSnapshot(data), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `barcelona-move-map-snapshot-${todayStamp()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
