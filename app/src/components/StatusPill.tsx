import { statusLabel } from "../lib/formatters";
export function StatusPill({ status }: { status: string }) { return <span className={`pill status-${status}`}>{statusLabel(status)}</span>; }
