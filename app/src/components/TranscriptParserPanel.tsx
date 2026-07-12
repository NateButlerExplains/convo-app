import type { ParsedTranscript } from "../types/move-map";

export type TranscriptParserPanelProps = {
  parsed: ParsedTranscript | null;
  onSendToTasks: (items: ParsedTranscript["actionItems"]) => void;
  onSendToDecisions: (items: ParsedTranscript["decisions"]) => void;
  isParsing: boolean;
  sentTaskIds?: string[];
  sentDecisionIds?: string[];
};

export function TranscriptParserPanel({
  parsed,
  onSendToTasks,
  onSendToDecisions,
  isParsing,
  sentTaskIds = [],
  sentDecisionIds = [],
}: TranscriptParserPanelProps) {
  if (isParsing) {
    return (
      <div className="parser-panel">
        <div className="parser-loading">
          <span className="parser-spinner" aria-hidden="true" />
          <span>Parsing transcript with the local LLM…</span>
        </div>
      </div>
    );
  }

  if (!parsed) return null;

  const hasContent =
    parsed.summary ||
    parsed.actionItems.length > 0 ||
    parsed.decisions.length > 0 ||
    parsed.keyQuestions.length > 0;

  if (!hasContent) {
    return (
      <div className="parser-panel">
        <p className="small-text">
          The LLM did not extract any structured items from this transcript. Try
          again with a longer or clearer transcript.
        </p>
      </div>
    );
  }

  return (
    <div className="parser-panel">
      {parsed.summary && (
        <div className="parser-summary">
          <p className="eyebrow">Summary</p>
          <p>{parsed.summary}</p>
        </div>
      )}

      {parsed.actionItems.length > 0 && (
        <div className="parser-section">
          <p className="eyebrow">Action items</p>
          <div className="parser-list">
            {parsed.actionItems.map((item, idx) => (
              <div className="parser-item" key={`action-${idx}`}>
                <span className="parser-item-text">
                  {item.text}
                  {item.owner ? <em className="parser-item-owner"> · {item.owner}</em> : null}
                </span>
                {sentTaskIds.includes(item.text) ? (
                  <button type="button" className="chip is-sent" disabled>
                    Sent
                  </button>
                ) : (
                  <button
                    type="button"
                    className="chip"
                    onClick={() => onSendToTasks([item])}
                  >
                    Send to Tasks
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {parsed.decisions.length > 0 && (
        <div className="parser-section">
          <p className="eyebrow">Decisions</p>
          <div className="parser-list">
            {parsed.decisions.map((item, idx) => (
              <div className="parser-item" key={`decision-${idx}`}>
                <span className="parser-item-text">{item.text}</span>
                {sentDecisionIds.includes(item.text) ? (
                  <button type="button" className="chip is-sent" disabled>
                    Sent
                  </button>
                ) : (
                  <button
                    type="button"
                    className="chip"
                    onClick={() => onSendToDecisions([item])}
                  >
                    Send to Decisions
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {parsed.keyQuestions.length > 0 && (
        <div className="parser-section">
          <p className="eyebrow">Key questions</p>
          <div className="parser-list">
            {parsed.keyQuestions.map((item, idx) => (
              <div className="parser-item" key={`question-${idx}`}>
                <span className="parser-item-text">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
