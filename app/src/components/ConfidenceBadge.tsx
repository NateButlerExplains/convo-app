import type { Confidence } from "../types/move-map";
import { confidenceLabel } from "../lib/formatters";
export function ConfidenceBadge({ confidence }: { confidence: Confidence }) { return <span className={`confidence confidence-${confidence}`}>{confidenceLabel(confidence)}</span>; }
