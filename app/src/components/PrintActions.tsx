import type { MoveMapData } from "../types/move-map";
import { downloadJsonSnapshot } from "../lib/snapshot";

export function PrintActions({ data }: { data: MoveMapData }) {
  return (
    <div className="page-actions print-actions" aria-label="Document actions">
      <button type="button" className="print-btn" onClick={() => window.print()}>
        Print
      </button>
      <button type="button" className="download-btn" onClick={() => downloadJsonSnapshot(data)}>
        Download
      </button>
    </div>
  );
}
