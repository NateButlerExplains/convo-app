import type { MoveMapData } from "../types/move-map";
import { downloadJsonSnapshot } from "../lib/snapshot";
export function PrintActions({ data }: { data: MoveMapData }) { return <div className="print-actions"><button onClick={() => window.print()}>Print / Save as PDF</button><button onClick={() => downloadJsonSnapshot(data)}>Download JSON snapshot</button></div>; }
