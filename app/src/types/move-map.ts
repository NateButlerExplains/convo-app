export type ID = string;
export type DateString = string;
export type Confidence = "low" | "medium" | "high";
export type Readiness = "open_question" | "options_listed" | "comparing" | "leaning" | "decided_for_now" | "revisit";
export type WorkStatus = "not_started" | "in_progress" | "waiting" | "done" | "blocked";
export type RiskStatus = "watching" | "mitigating" | "accepted" | "resolved";
export type DebtPerson = "Nate" | "Shae";
export type DebtCategory = "credit_cards" | "personal_loans" | "student_loans" | "collections";
export type ExpensePerson = DebtPerson;
export type ExpenseKind = "housing" | "utilities" | "transport" | "food" | "health" | "school" | "travel" | "insurance" | "misc";
export type DebtItem = { id: ID; person: DebtPerson; category: DebtCategory; label: string; lender: string; balance: number | null; apr: string; min_payment: string; due_date: DateString; status: WorkStatus; notes: string; archived: boolean };
export type ExpenseItem = { id: ID; person: ExpensePerson; kind: ExpenseKind; label: string; cadence: string; amount: number | null; currency: "USD" | "EUR"; status: WorkStatus; forecast: string; notes: string; archived: boolean; scope?: ExpenseScope };
export type ExpenseScope = "current" | "spain";

export type Meta = { schema_version: string; data_updated_at: DateString; private_local_only: boolean; disclaimer: string };
export type Plan = { id: ID; title: string; origin: string; destination: string; target_move_date: DateString; household_summary: string; primary_updater: string; collaborator_summary: string; last_updated: DateString };
export type Source = { id: ID; title: string; url: string; publisher: string; topic: string; reliability: "official" | "professional_service" | "community" | "unknown"; date_accessed: DateString; notes: string };
export type PlanningTrack = { id: ID; title: string; description: string; readiness: "early_research" | "taking_shape" | "ready_to_decide" | "decided_for_now"; confidence: Confidence; next_action: string; related_decision_ids: ID[]; related_task_ids: ID[]; related_risk_ids: ID[] };
export type RoadmapPhase = { id: ID; title: string; start_date: DateString; end_date: DateString; status: WorkStatus; description: string; milestone_ids: ID[] };
export type Milestone = { id: ID; phase_id: ID; title: string; target_date: DateString; status: WorkStatus; confidence: Confidence; dependency_ids: ID[]; related_task_ids: ID[]; related_document_ids: ID[]; related_decision_ids: ID[]; notes: string };
export type BudgetItem = { id: ID; category: string; label: string; phase: string; estimate_low: number | null; estimate_high: number | null; planned_amount: number | null; actual_amount: number | null; currency: "USD" | "EUR"; frequency: "one_time" | "monthly" | "annual" | "unknown"; confidence: Confidence; date_checked: DateString; source_ids: ID[]; related_risk_ids: ID[]; notes: string };
export type Decision = { id: ID; title: string; status: "proposed" | "leaning" | "decided" | "revisiting"; readiness: Readiness; options_considered: ID[]; rationale: string; decision_date: DateString; approvers: string[]; revisit_date: DateString; related_task_ids: ID[]; related_risk_ids: ID[]; notes: string };
export type Option = { id: ID; name: string; category: "visa" | "neighborhood" | "housing" | "school_childcare" | "healthcare" | "insurance" | "travel" | "financial" | "other"; summary: string; pros: string[]; cons: string[]; estimated_cost_label: string; risk_level: "low" | "medium" | "high" | "unknown"; confidence: Confidence; source_ids: ID[]; related_decision_id: ID | ""; related_budget_ids: ID[]; related_risk_ids: ID[]; professional_advice_required: boolean; notes: string };
export type Idea = { id: ID; prompt: string; topic: string; priority: "low" | "medium" | "high"; discussed: boolean; outcome: string; related_decision_ids: ID[]; related_option_ids: ID[]; notes: string };
export type TaskPriority = "high" | "medium" | "low";
export type Task = { id: ID; title: string; track: string; status: WorkStatus; priority?: TaskPriority; owner: string; due_date: DateString; dependency_ids: ID[]; related_document_ids: ID[]; related_risk_ids: ID[]; related_decision_id: ID | ""; notes: string; conversation_prompt?: string; follow_up_task_ids?: ID[] };
export type Risk = { id: ID; title: string; category: string; description: string; likelihood: "low" | "medium" | "high" | "unknown"; impact: "low" | "medium" | "high" | "unknown"; trigger: string; mitigation: string; owner: string; status: RiskStatus; professional_advice_required: boolean; source_ids: ID[]; related_task_ids: ID[]; related_document_ids: ID[]; notes: string };
export type DocumentItem = { id: ID; name: string; person: "Nate" | "Wife" | "Child" | "Household" | "Unknown"; category: "identity" | "civil" | "financial_work" | "background_health" | "arrival_local" | "school" | "housing" | "other"; needed_for: string; status: WorkStatus; owner: string; issue_date: DateString; expiration_date: DateString; due_date: DateString; needs_apostille: boolean; needs_translation: boolean; originals_required: boolean; copies_required: boolean; source_ids: ID[]; related_task_ids: ID[]; notes: string };
export type SnapshotRecord = { id: ID; title: string; type: "full" | "budget" | "decisions" | "roadmap" | "open_questions" | "documents"; created_at: DateString; included_sections: string[]; output_path: string; notes: string };
export type MoveMapData = { meta: Meta; plan: Plan; sources: Source[]; planning_tracks: PlanningTrack[]; roadmap_phases: RoadmapPhase[]; milestones: Milestone[]; budget_items: BudgetItem[]; debt_items: DebtItem[]; expense_items: ExpenseItem[]; decisions: Decision[]; options: Option[]; ideas: Idea[]; tasks: Task[]; risks: Risk[]; documents: DocumentItem[]; snapshots: SnapshotRecord[] };
export type ViewKey = "home" | "big-trip" | "conversation" | "roadmap" | "calendar" | "budget" | "debt" | "expenses" | "income" | "housing" | "decisions" | "alons-skills" | "options" | "ideas" | "tasks" | "risks" | "snapshots";
export type ConversationContext = { taskId: string; taskTitle: string; prompt: string; followUpTaskIds: string[]; sectionKey?: string; openedAt?: string; conversationPromptId?: string; promptPurpose?: string };

// ── Recording & Transcription ──

export type RecordingState = "idle" | "preparing" | "recording" | "paused" | "stopped" | "transcribing" | "done" | "error";

export type TranscriptionMethod = "web-speech" | "whisper";

export type TranscriptSegment = {
  id: string;
  speaker: string;
  text: string;
  startOffset: number;
  endOffset: number;
  isFinal: boolean;
};

export type ParsedTranscriptItem = {
  type: "action_item" | "decision" | "summary_point" | "question";
  text: string;
  confidence: "high" | "medium" | "low";
  owner?: string;
  relatedSpeaker?: string;
  sourceSegmentIds: string[];
};

export type ParsedTranscript = {
  summary: string;
  actionItems: ParsedTranscriptItem[];
  decisions: ParsedTranscriptItem[];
  keyQuestions: ParsedTranscriptItem[];
  rawTranscript: string;
};

export type RecordedAudio = {
  id: string;
  mimeType: string;
  durationSeconds: number;
  createdAt: string;
  dbKey: string;
};
