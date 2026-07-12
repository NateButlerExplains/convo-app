export type ConvoID = string;
export type ISODateString = string;
export type ISODateTimeString = string;

export type Priority = "low" | "medium" | "high";
export type ApprovalStatus = "draft" | "reviewed" | "active";
export type WorkMode = "discuss" | "research" | "decide" | "execute" | "verify";
export type ReadinessStatus =
  | "not_ready"
  | "researching"
  | "ready_to_execute"
  | "ready_to_decide"
  | "ready_to_mitigate"
  | "ready_to_promote"
  | "exploring"
  | "deferred"
  | "complete";
export type SourceKind = "ai_generated" | "user_created" | "conversation_generated" | "therapist_created";

export type Goal = {
  id: ConvoID;
  title: string;
  short_summary?: string;
  desired_outcome: string;
  why_it_matters: string;
  participants: string[];
  target_timeframe: string;
  current_status?: string;
  confidence_level?: "low" | "medium" | "high";
  constraints: string[];
  known_blockers?: string[];
  available_resources?: string[];
  important_dates?: ISODateString[];
  location_or_domain?: string;
  privacy_sensitivity_level?: "low" | "medium" | "high";
  shared_values?: string[];
  partner_priorities?: Record<string, string[]>;
  fears_or_concerns?: string[];
  non_negotiables?: string[];
  open_questions: string[];
  goal_type?: string;
  template_id?: string;
  generated_roadmap_id?: ConvoID;
  created_from_onboarding_session_id?: ConvoID;
  approval_status: ApprovalStatus;
  ai_provider_used?: string;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
  archived: boolean;
};

export type RoadmapStatus = "draft" | "reviewed" | "active" | "archived";
export type PhaseStatus = "not_started" | "active" | "blocked" | "done";
export type RoadmapRequirementStatus = "not_started" | "active" | "blocked" | "done";
export type RouteFocusState = "current_focus" | "blocked" | "future" | "complete" | "ad_hoc_radar";
export type RouteLinkedObjectType =
  | "roadmap_phase"
  | "requirement"
  | "task"
  | "decision"
  | "risk"
  | "conversation_prompt"
  | "planning_page"
  | "document"
  | "idea";

export type RoadmapRequirement = {
  id: ConvoID;
  roadmap_id: ConvoID;
  phase_id: ConvoID;
  title: string;
  description?: string;
  order: number;
  status: RoadmapRequirementStatus;
  priority: Priority;
  work_mode: WorkMode;
  blocks_phase_progress: boolean;
  linked_object_type?: RouteLinkedObjectType;
  linked_object_id?: ConvoID;
  conversation_prompt_id?: ConvoID;
};

export type RoadmapPhase = {
  id: ConvoID;
  roadmap_id: ConvoID;
  title: string;
  purpose: string;
  order: number;
  status: PhaseStatus;
  timeframe: string;
  success_criteria: string[];
  key_questions: string[];
  blockers: string[];
  requirements: RoadmapRequirement[];
  related_task_ids: ConvoID[];
  related_decision_ids: ConvoID[];
  related_risk_ids: ConvoID[];
  related_conversation_prompt_ids: ConvoID[];
};

export type RoadmapMilestone = {
  id: ConvoID;
  phase_id: ConvoID;
  title: string;
  description: string;
  target_date?: ISODateString;
  status: PhaseStatus;
  evidence_of_completion?: string;
};

export type Roadmap = {
  id: ConvoID;
  goal_id: ConvoID;
  title: string;
  summary: string;
  status: RoadmapStatus;
  phases: RoadmapPhase[];
  milestones?: RoadmapMilestone[];
  created_from_onboarding_session_id?: ConvoID;
  ai_provider_used?: string;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
};

export type DashboardWidget = {
  id: ConvoID;
  goal_id: ConvoID;
  title: string;
  widget_type:
    | "goal_summary"
    | "roadmap_progress"
    | "next_conversation"
    | "starter_tasks"
    | "key_decisions"
    | "top_risks"
    | "open_questions_ideas"
    | "planning_section"
    | "custom";
  focus_state: RouteFocusState;
  lane: "roadmap" | "conversation_radar";
  source_object_type?: RouteLinkedObjectType;
  source_object_id?: ConvoID;
  prompt_text?: string;
  conversation_prompt_id?: ConvoID;
  related_phase_id?: ConvoID;
  related_task_id?: ConvoID;
  reason_this_matters?: string;
  order: number;
};

export type TaskStatus = "not_started" | "in_progress" | "waiting" | "blocked" | "done";

export type ConvoTask = {
  id: ConvoID;
  goal_id: ConvoID;
  title: string;
  description?: string;
  notes: string;
  track: string;
  status: TaskStatus;
  priority: Priority;
  owner: string;
  due_date?: ISODateString;
  roadmap_id?: ConvoID;
  phase_id?: ConvoID;
  requirement_id?: ConvoID;
  is_roadmap_requirement: boolean;
  blocks_phase_progress: boolean;
  dependency_ids: ConvoID[];
  follow_up_task_ids: ConvoID[];
  conversation_prompt?: string;
  conversation_prompt_id?: ConvoID;
  source_conversation_id?: ConvoID;
  generated_from_conversation: boolean;
  related_conversation_ids: ConvoID[];
  discussion_status: "needs_conversation" | "discussed" | "needs_follow_up";
  work_mode: WorkMode;
  earliest_relevant_phase_id?: ConvoID;
  execution_phase_id?: ConvoID;
  readiness_status: ReadinessStatus;
  research_status?: "not_started" | "in_progress" | "enough_for_now" | "needs_more" | "complete";
  evidence_links: string[];
  trigger_for_promotion?: string;
  related_decision_id?: ConvoID;
  related_risk_ids: ConvoID[];
  related_document_ids: ConvoID[];
  related_idea_ids: ConvoID[];
  source: SourceKind;
  approval_status: ApprovalStatus;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
  archived: boolean;
};

export type DecisionStatus = "open" | "exploring" | "decided" | "revisit" | "archived";
export type AgreementStatus = "not_aligned" | "partially_aligned" | "aligned";

export type ConvoDecision = {
  id: ConvoID;
  goal_id: ConvoID;
  title: string;
  question: string;
  status: DecisionStatus;
  decision: string;
  rationale: string;
  owner?: string;
  due_date?: ISODateString;
  partner_positions: Record<string, string>;
  shared_values_involved: string[];
  concerns: string[];
  non_negotiables: string[];
  tradeoffs: string[];
  confidence_level: "low" | "medium" | "high";
  agreement_status: AgreementStatus;
  roadmap_id?: ConvoID;
  phase_id?: ConvoID;
  requirement_id?: ConvoID;
  blocks_phase_progress: boolean;
  related_task_ids: ConvoID[];
  related_risk_ids: ConvoID[];
  related_idea_ids: ConvoID[];
  related_document_ids: ConvoID[];
  conversation_prompt?: string;
  conversation_prompt_id?: ConvoID;
  source_conversation_id?: ConvoID;
  related_conversation_ids: ConvoID[];
  discussion_status: "needs_conversation" | "discussed" | "needs_follow_up";
  follow_up_prompt?: string;
  work_mode: "discuss" | "research" | "decide" | "verify";
  readiness_status: ReadinessStatus;
  evidence_needed: string[];
  evidence_links: string[];
  trigger_for_decision?: string;
  source: SourceKind;
  approval_status: ApprovalStatus;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
  archived: boolean;
};

export type RiskStatus = "watching" | "mitigating" | "accepted" | "resolved" | "archived";
export type RiskLevel = "low" | "medium" | "high" | "unknown";

export type ConvoRisk = {
  id: ConvoID;
  goal_id: ConvoID;
  title: string;
  description: string;
  category: string;
  likelihood: RiskLevel;
  impact: RiskLevel;
  status: RiskStatus;
  owner: string;
  warning_sign: string;
  mitigation_plan: string;
  contingency_plan?: string;
  decision_needed?: string;
  professional_advice_required: boolean;
  confidence_level?: "low" | "medium" | "high";
  roadmap_id?: ConvoID;
  phase_id?: ConvoID;
  requirement_id?: ConvoID;
  blocks_phase_progress: boolean;
  related_task_ids: ConvoID[];
  related_decision_ids: ConvoID[];
  related_document_ids: ConvoID[];
  related_idea_ids: ConvoID[];
  conversation_prompt?: string;
  conversation_prompt_id?: ConvoID;
  source_conversation_id?: ConvoID;
  related_conversation_ids: ConvoID[];
  discussion_status: "needs_conversation" | "discussed" | "needs_follow_up";
  follow_up_prompt?: string;
  work_mode: WorkMode;
  earliest_relevant_phase_id?: ConvoID;
  execution_phase_id?: ConvoID;
  readiness_status: ReadinessStatus;
  evidence_needed: string[];
  evidence_links: string[];
  trigger_for_promotion?: string;
  source: SourceKind;
  approval_status: ApprovalStatus;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
  archived: boolean;
};

export type IdeaQuestionType = "idea" | "question" | "assumption" | "possibility";
export type IdeaQuestionStatus = "open" | "exploring" | "discussed" | "promoted" | "dismissed" | "archived";
export type PromotedToType = "task" | "decision" | "risk" | "roadmap_requirement" | "none";

export type IdeaQuestion = {
  id: ConvoID;
  goal_id: ConvoID;
  type: IdeaQuestionType;
  title: string;
  question_text: string;
  topic: string;
  priority: Priority;
  status: IdeaQuestionStatus;
  outcome: string;
  notes: string;
  roadmap_id?: ConvoID;
  phase_id?: ConvoID;
  requirement_id?: ConvoID;
  related_task_ids: ConvoID[];
  related_decision_ids: ConvoID[];
  related_risk_ids: ConvoID[];
  related_document_ids: ConvoID[];
  conversation_prompt?: string;
  conversation_prompt_id?: ConvoID;
  source_conversation_id?: ConvoID;
  related_conversation_ids: ConvoID[];
  discussion_status: "needs_conversation" | "discussed" | "needs_follow_up";
  follow_up_prompt?: string;
  work_mode: WorkMode;
  earliest_relevant_phase_id?: ConvoID;
  possible_execution_phase_id?: ConvoID;
  readiness_status: ReadinessStatus;
  evidence_needed: string[];
  evidence_links: string[];
  trigger_for_promotion?: string;
  promoted_to_type: PromotedToType;
  promoted_to_id?: ConvoID;
  source: SourceKind;
  approval_status: ApprovalStatus;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
  archived: boolean;
};

export type ConversationPromptStatus = "suggested" | "queued" | "active" | "completed" | "skipped" | "archived";
export type ConversationPromptType = "alignment" | "planning" | "decision" | "risk" | "reflection" | "repair" | "check_in" | "research_review";
export type ConversationTone = "practical" | "emotional" | "exploratory" | "urgent" | "reflective";

export type ConversationPrompt = {
  id: ConvoID;
  goal_id: ConvoID;
  prompt_text: string;
  purpose: string;
  status: ConversationPromptStatus;
  priority: Priority;
  source: SourceKind;
  prompt_type: ConversationPromptType;
  tone: ConversationTone;
  estimated_duration_minutes?: number;
  recommended_participants: string[];
  opening_question: string;
  follow_up_questions: string[];
  success_criteria: string[];
  roadmap_id?: ConvoID;
  phase_id?: ConvoID;
  requirement_id?: ConvoID;
  related_task_ids: ConvoID[];
  related_decision_ids: ConvoID[];
  related_risk_ids: ConvoID[];
  related_idea_ids: ConvoID[];
  related_document_ids: ConvoID[];
  blocks_phase_progress: boolean;
  source_conversation_id?: ConvoID;
  resulting_conversation_id?: ConvoID;
  follow_up_prompt_ids: ConvoID[];
  generated_item_ids: ConvoID[];
  discussion_status: "needs_conversation" | "discussed" | "needs_follow_up";
  sensitive_topic: boolean;
  professional_support_recommended: boolean;
  avoid_language: string[];
  safety_note?: string;
  consent_required: boolean;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
  archived: boolean;
};

export type PlanningSection = {
  id: ConvoID;
  goal_id: ConvoID;
  title: string;
  section_type: string;
  description: string;
  status: "empty" | "draft" | "active" | "archived";
  fields: Record<string, unknown>;
  related_task_ids: ConvoID[];
  related_decision_ids: ConvoID[];
  related_risk_ids: ConvoID[];
  related_idea_ids: ConvoID[];
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
  archived: boolean;
};

export type AIProviderKind = "openai" | "local_openai_compatible" | "anthropic" | "gemini" | "openrouter" | "lm_studio" | "ollama" | "9router";
export type AIKeyStorageMode = "local" | "session_only" | "none";

export type AIProviderSettings = {
  enabled: boolean;
  provider: AIProviderKind | null;
  model?: string;
  key_storage_mode: AIKeyStorageMode;
  confirm_before_sending_transcript: boolean;
  confirm_before_applying_generated_items: boolean;
  last_tested_at?: ISODateTimeString;
  last_test_status?: "untested" | "success" | "failed";
};

export type GoalWorkspace = {
  schema_version: "convo-mvp-v1";
  active_goal_id: ConvoID | null;
  goals: Goal[];
  roadmaps: Roadmap[];
  dashboard_widgets: DashboardWidget[];
  tasks: ConvoTask[];
  decisions: ConvoDecision[];
  risks: ConvoRisk[];
  ideas_questions: IdeaQuestion[];
  conversation_prompts: ConversationPrompt[];
  planning_sections: PlanningSection[];
  ai_settings: AIProviderSettings;
  created_at: ISODateTimeString;
  updated_at: ISODateTimeString;
};
