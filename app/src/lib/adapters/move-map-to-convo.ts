import type {
  AIProviderSettings,
  ConvoDecision,
  ConvoRisk,
  ConvoTask,
  ConversationPrompt,
  Goal,
  GoalWorkspace,
  IdeaQuestion,
  PlanningSection,
  Roadmap,
  RoadmapMilestone,
  RoadmapPhase as ConvoRoadmapPhase,
  RoadmapRequirement,
} from "../../types/convo";
import type {
  Confidence,
  Decision,
  Idea,
  Milestone,
  MoveMapData,
  Risk,
  RoadmapPhase,
  Task,
} from "../../types/move-map";

function toIsoDateTime(value: string | undefined, fallback: string) {
  const parsed = value ? Date.parse(value) : Number.NaN;
  return Number.isNaN(parsed) ? fallback : new Date(parsed).toISOString();
}

function buildGoalId(data: MoveMapData) {
  return `goal-${data.plan.id}`;
}

function buildRoadmapId(goalId: string) {
  return `roadmap-${goalId}`;
}

function buildRequirementId(phaseId: string, milestoneId: string) {
  return `requirement-${phaseId}-${milestoneId}`;
}

function toWorkspaceTimestamp(data: MoveMapData) {
  return toIsoDateTime(data.plan.last_updated, toIsoDateTime(data.meta.data_updated_at, new Date(0).toISOString()));
}

function mapTaskStatus(status: Task["status"]): ConvoTask["status"] {
  return status;
}

function mapDecisionStatus(status: Decision["status"]): ConvoDecision["status"] {
  switch (status) {
    case "leaning":
      return "exploring";
    case "decided":
      return "decided";
    case "revisiting":
      return "revisit";
    default:
      return "open";
  }
}

function mapPhaseStatus(status: RoadmapPhase["status"]): ConvoRoadmapPhase["status"] {
  switch (status) {
    case "in_progress":
      return "active";
    case "waiting":
    case "blocked":
      return "blocked";
    case "done":
      return "done";
    default:
      return "not_started";
  }
}

function mapRequirementStatus(status: Milestone["status"]): RoadmapRequirement["status"] {
  switch (status) {
    case "in_progress":
      return "active";
    case "waiting":
    case "blocked":
      return "blocked";
    case "done":
      return "done";
    default:
      return "not_started";
  }
}

function mapReadinessFromTaskStatus(status: Task["status"]): ConvoTask["readiness_status"] {
  switch (status) {
    case "done":
      return "complete";
    case "blocked":
      return "deferred";
    case "waiting":
      return "researching";
    default:
      return "ready_to_execute";
  }
}

function mapReadinessFromDecision(decision: Decision): ConvoDecision["readiness_status"] {
  if (decision.status === "decided") return "complete";
  if (decision.status === "leaning") return "exploring";
  if (decision.readiness === "revisit") return "deferred";
  return "ready_to_decide";
}

function mapRiskReadiness(status: Risk["status"]): ConvoRisk["readiness_status"] {
  switch (status) {
    case "resolved":
      return "complete";
    case "accepted":
      return "deferred";
    default:
      return "ready_to_mitigate";
  }
}

function mapConfidenceToPriority(confidence: Confidence): ConvoTask["priority"] {
  return confidence;
}

function mapParticipants(data: MoveMapData) {
  return [data.plan.primary_updater, data.plan.collaborator_summary].map((value) => value.trim()).filter(Boolean);
}

function mapPlanToGoal(data: MoveMapData, goalId: string, workspaceTimestamp: string): Goal {
  const destination = data.plan.destination.trim();
  return {
    id: goalId,
    title: data.plan.title,
    desired_outcome: destination ? `Complete move to ${destination}.` : data.plan.household_summary,
    why_it_matters: data.plan.household_summary,
    participants: mapParticipants(data),
    target_timeframe: data.plan.target_move_date,
    current_status: "active legacy workspace",
    constraints: [],
    open_questions: [],
    approval_status: "active",
    created_at: workspaceTimestamp,
    updated_at: workspaceTimestamp,
    archived: false,
  };
}

function findLinkedObject(milestone: Milestone) {
  if (milestone.related_task_ids[0]) return { linked_object_type: "task" as const, linked_object_id: milestone.related_task_ids[0] };
  if (milestone.related_decision_ids[0]) return { linked_object_type: "decision" as const, linked_object_id: milestone.related_decision_ids[0] };
  return undefined;
}

function mapMilestoneToRequirement(roadmapId: string, phaseId: string, milestone: Milestone, order: number): RoadmapRequirement {
  const linked = findLinkedObject(milestone);
  return {
    id: buildRequirementId(phaseId, milestone.id),
    roadmap_id: roadmapId,
    phase_id: phaseId,
    title: milestone.title,
    description: milestone.notes || undefined,
    order,
    status: mapRequirementStatus(milestone.status),
    priority: mapConfidenceToPriority(milestone.confidence),
    work_mode: "execute",
    blocks_phase_progress: false,
    linked_object_type: linked?.linked_object_type,
    linked_object_id: linked?.linked_object_id,
  };
}

function mapRoadmapPhasesToRoadmap(data: MoveMapData, goalId: string, roadmapId: string, workspaceTimestamp: string): Roadmap {
  const phases: ConvoRoadmapPhase[] = data.roadmap_phases.map((phase, index) => {
    const requirements = data.milestones
      .filter((milestone) => milestone.phase_id === phase.id)
      .map((milestone, milestoneIndex) => mapMilestoneToRequirement(roadmapId, phase.id, milestone, milestoneIndex));

    return {
      id: phase.id,
      roadmap_id: roadmapId,
      title: phase.title,
      purpose: phase.description,
      order: index,
      status: mapPhaseStatus(phase.status),
      timeframe: [phase.start_date, phase.end_date].filter(Boolean).join(" → "),
      success_criteria: [],
      key_questions: [],
      blockers: [],
      requirements,
      related_task_ids: [],
      related_decision_ids: [],
      related_risk_ids: [],
      related_conversation_prompt_ids: [],
    };
  });

  const milestones: RoadmapMilestone[] = data.milestones.map((milestone) => ({
    id: milestone.id,
    phase_id: milestone.phase_id,
    title: milestone.title,
    description: milestone.notes,
    target_date: milestone.target_date || undefined,
    status: mapPhaseStatus(milestone.status),
    evidence_of_completion: milestone.notes || undefined,
  }));

  return {
    id: roadmapId,
    goal_id: goalId,
    title: `${data.plan.title} Roadmap`,
    summary: data.plan.household_summary,
    status: "active",
    phases,
    milestones,
    created_at: workspaceTimestamp,
    updated_at: workspaceTimestamp,
  };
}

function phaseIdForTrack(phases: RoadmapPhase[], track: string) {
  const normalizedTrack = track.trim().toLowerCase();
  const match = phases.find((phase) => phase.title.trim().toLowerCase() === normalizedTrack);
  return match?.id;
}

function mapTasksToConvoTasks(data: MoveMapData, goalId: string, roadmapId: string, workspaceTimestamp: string): ConvoTask[] {
  return data.tasks.map((task) => ({
    id: task.id,
    goal_id: goalId,
    title: task.title,
    description: "",
    notes: task.notes,
    track: task.track,
    status: mapTaskStatus(task.status),
    priority: task.priority ?? "medium",
    owner: task.owner,
    due_date: task.due_date || undefined,
    roadmap_id: roadmapId,
    phase_id: phaseIdForTrack(data.roadmap_phases, task.track),
    requirement_id: undefined,
    is_roadmap_requirement: false,
    blocks_phase_progress: false,
    dependency_ids: task.dependency_ids,
    follow_up_task_ids: task.follow_up_task_ids ?? [],
    conversation_prompt: task.conversation_prompt,
    conversation_prompt_id: task.conversation_prompt ? `prompt-task-${task.id}` : undefined,
    source_conversation_id: undefined,
    generated_from_conversation: false,
    related_conversation_ids: [],
    discussion_status: task.conversation_prompt ? "needs_conversation" : "discussed",
    work_mode: task.conversation_prompt ? "discuss" : "execute",
    earliest_relevant_phase_id: undefined,
    execution_phase_id: undefined,
    readiness_status: mapReadinessFromTaskStatus(task.status),
    research_status: undefined,
    evidence_links: [],
    trigger_for_promotion: undefined,
    related_decision_id: task.related_decision_id || undefined,
    related_risk_ids: task.related_risk_ids,
    related_document_ids: task.related_document_ids,
    related_idea_ids: [],
    source: "user_created",
    approval_status: "active",
    created_at: workspaceTimestamp,
    updated_at: workspaceTimestamp,
    archived: false,
  }));
}

function mapDecisionsToConvoDecisions(data: MoveMapData, goalId: string, roadmapId: string, workspaceTimestamp: string): ConvoDecision[] {
  return data.decisions.map((decision) => ({
    id: decision.id,
    goal_id: goalId,
    title: decision.title,
    question: decision.title,
    status: mapDecisionStatus(decision.status),
    decision: decision.title,
    rationale: [decision.rationale, decision.notes].filter(Boolean).join("\n\n"),
    owner: undefined,
    due_date: decision.revisit_date || undefined,
    partner_positions: {},
    shared_values_involved: [],
    concerns: [],
    non_negotiables: [],
    tradeoffs: [],
    confidence_level: "medium",
    agreement_status: "not_aligned",
    roadmap_id: roadmapId,
    phase_id: undefined,
    requirement_id: undefined,
    blocks_phase_progress: false,
    related_task_ids: decision.related_task_ids,
    related_risk_ids: decision.related_risk_ids,
    related_idea_ids: [],
    related_document_ids: [],
    conversation_prompt: undefined,
    conversation_prompt_id: undefined,
    source_conversation_id: undefined,
    related_conversation_ids: [],
    discussion_status: "discussed",
    follow_up_prompt: undefined,
    work_mode: "decide",
    readiness_status: mapReadinessFromDecision(decision),
    evidence_needed: [],
    evidence_links: [],
    trigger_for_decision: undefined,
    source: "user_created",
    approval_status: "active",
    created_at: toIsoDateTime(decision.decision_date, workspaceTimestamp),
    updated_at: workspaceTimestamp,
    archived: false,
  }));
}

function mapRisksToConvoRisks(data: MoveMapData, goalId: string, roadmapId: string, workspaceTimestamp: string): ConvoRisk[] {
  return data.risks.map((risk) => ({
    id: risk.id,
    goal_id: goalId,
    title: risk.title,
    description: risk.description,
    category: risk.category,
    likelihood: risk.likelihood,
    impact: risk.impact,
    status: risk.status === "resolved" ? "resolved" : risk.status === "accepted" ? "accepted" : risk.status === "mitigating" ? "mitigating" : "watching",
    owner: risk.owner,
    warning_sign: risk.trigger,
    mitigation_plan: risk.mitigation,
    contingency_plan: undefined,
    decision_needed: undefined,
    professional_advice_required: risk.professional_advice_required,
    confidence_level: undefined,
    roadmap_id: roadmapId,
    phase_id: undefined,
    requirement_id: undefined,
    blocks_phase_progress: false,
    related_task_ids: risk.related_task_ids,
    related_decision_ids: [],
    related_document_ids: risk.related_document_ids,
    related_idea_ids: [],
    conversation_prompt: undefined,
    conversation_prompt_id: undefined,
    source_conversation_id: undefined,
    related_conversation_ids: [],
    discussion_status: "discussed",
    follow_up_prompt: undefined,
    work_mode: "verify",
    earliest_relevant_phase_id: undefined,
    execution_phase_id: undefined,
    readiness_status: mapRiskReadiness(risk.status),
    evidence_needed: [],
    evidence_links: [],
    trigger_for_promotion: undefined,
    source: "user_created",
    approval_status: "active",
    created_at: workspaceTimestamp,
    updated_at: workspaceTimestamp,
    archived: false,
  }));
}

function mapIdeasToIdeaQuestions(data: MoveMapData, goalId: string, roadmapId: string, workspaceTimestamp: string): IdeaQuestion[] {
  return data.ideas.map((idea) => ({
    id: idea.id,
    goal_id: goalId,
    type: "idea",
    title: idea.prompt,
    question_text: idea.prompt,
    topic: idea.topic,
    priority: idea.priority,
    status: idea.discussed ? "discussed" : "open",
    outcome: idea.outcome,
    notes: idea.notes,
    roadmap_id: roadmapId,
    phase_id: undefined,
    requirement_id: undefined,
    related_task_ids: [],
    related_decision_ids: idea.related_decision_ids,
    related_risk_ids: [],
    related_document_ids: [],
    conversation_prompt: undefined,
    conversation_prompt_id: undefined,
    source_conversation_id: undefined,
    related_conversation_ids: [],
    discussion_status: idea.discussed ? "discussed" : "needs_follow_up",
    follow_up_prompt: undefined,
    work_mode: idea.discussed ? "decide" : "discuss",
    earliest_relevant_phase_id: undefined,
    possible_execution_phase_id: undefined,
    readiness_status: idea.discussed ? "ready_to_promote" : "exploring",
    evidence_needed: [],
    evidence_links: [],
    trigger_for_promotion: undefined,
    promoted_to_type: "none",
    promoted_to_id: undefined,
    source: "user_created",
    approval_status: "active",
    created_at: workspaceTimestamp,
    updated_at: workspaceTimestamp,
    archived: false,
  }));
}

function mapTaskPromptsToConversationPrompts(tasks: Task[], phases: RoadmapPhase[], goalId: string, roadmapId: string, workspaceTimestamp: string): ConversationPrompt[] {
  return tasks
    .filter((task) => typeof task.conversation_prompt === "string" && task.conversation_prompt.trim().length > 0)
    .map((task) => ({
      id: `prompt-task-${task.id}`,
      goal_id: goalId,
      prompt_text: task.conversation_prompt!.trim(),
      purpose: `Discuss task: ${task.title}`,
      status: "suggested",
      priority: task.priority ?? "medium",
      source: "user_created",
      prompt_type: "planning",
      tone: "practical",
      estimated_duration_minutes: undefined,
      recommended_participants: [],
      opening_question: task.conversation_prompt!.trim(),
      follow_up_questions: [],
      success_criteria: [],
      roadmap_id: roadmapId,
      phase_id: phaseIdForTrack(phases, task.track),
      requirement_id: undefined,
      related_task_ids: [task.id],
      related_decision_ids: [],
      related_risk_ids: [],
      related_idea_ids: [],
      related_document_ids: [],
      blocks_phase_progress: false,
      source_conversation_id: undefined,
      resulting_conversation_id: undefined,
      follow_up_prompt_ids: [],
      generated_item_ids: [],
      discussion_status: "needs_conversation",
      sensitive_topic: false,
      professional_support_recommended: false,
      avoid_language: [],
      safety_note: undefined,
      consent_required: false,
      created_at: workspaceTimestamp,
      updated_at: workspaceTimestamp,
      archived: false,
    }));
}

function mapPlanningSections(data: MoveMapData, goalId: string, workspaceTimestamp: string): PlanningSection[] {
  const taskCount = data.tasks.length;
  const decisionCount = data.decisions.length;
  const riskCount = data.risks.length;
  const ideaCount = data.ideas.length;
  const documentCount = data.documents.length;
  const focusAreas = Array.from(
    new Set(
      data.tasks
        .map((task) => task.track.trim())
        .filter(Boolean),
    ),
  ).slice(0, 5);

  const planningSignals = taskCount + decisionCount + riskCount + ideaCount + documentCount;
  const summaryParts = [
    taskCount ? `${taskCount} tasks` : "",
    decisionCount ? `${decisionCount} decisions` : "",
    riskCount ? `${riskCount} risks` : "",
    ideaCount ? `${ideaCount} ideas` : "",
  ].filter(Boolean);

  return [{
    id: "planning-goal-planning",
    goal_id: goalId,
    title: "Goal Planning",
    section_type: "goal_planning",
    description: summaryParts.length > 0
      ? `Current planning includes ${summaryParts.join(", ")} guiding next steps toward the couple's goal.`
      : "Current planning structure is ready to gather tasks, decisions, risks, and next steps.",
    status: planningSignals > 0 ? "active" : "draft",
    fields: {
      summary: summaryParts.length > 0
        ? summaryParts.join(", ")
        : "No planning signals yet.",
      task_count: taskCount,
      decision_count: decisionCount,
      risk_count: riskCount,
      idea_count: ideaCount,
      document_count: documentCount,
      ...(focusAreas.length > 0 ? { focus_areas: focusAreas } : {}),
    },
    related_task_ids: [],
    related_decision_ids: [],
    related_risk_ids: [],
    related_idea_ids: [],
    created_at: workspaceTimestamp,
    updated_at: workspaceTimestamp,
    archived: false,
  }];
}

function buildAiSettings(): AIProviderSettings {
  return {
    enabled: false,
    provider: null,
    key_storage_mode: "local",
    confirm_before_sending_transcript: true,
    confirm_before_applying_generated_items: true,
    last_test_status: "untested",
  };
}

function trimToMeaningfulText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function derivePlanningSectionWidgetSummary(section: PlanningSection) {
  const summary = trimToMeaningfulText(section.fields.summary);
  if (summary) return summary;

  const focusAreas = Array.isArray(section.fields.focus_areas)
    ? section.fields.focus_areas.map((value) => trimToMeaningfulText(value)).filter(Boolean)
    : [];
  if (focusAreas.length > 0) return focusAreas.join(", ");

  return [
    trimToMeaningfulText(section.title),
    trimToMeaningfulText(section.description),
  ].find(Boolean) ?? "";
}

function derivePlanningSectionWidgetReason(section: PlanningSection) {
  return [
    trimToMeaningfulText(section.fields.reason_this_matters),
    trimToMeaningfulText(section.fields.purpose),
  ].find(Boolean) ?? "";
}

function shouldIncludePlanningSectionWidget(section: PlanningSection, firstWidget?: GoalWorkspace["dashboard_widgets"][number]) {
  const promptText = trimToMeaningfulText(section.description);
  const reasonThisMatters = derivePlanningSectionWidgetReason(section);
  const summary = derivePlanningSectionWidgetSummary(section);

  if (!promptText && !reasonThisMatters && !summary) return false;

  const planningVisibleText = [promptText, reasonThisMatters, summary].filter(Boolean).join("\n").trim();
  const firstWidgetVisibleText = [
    trimToMeaningfulText(firstWidget?.prompt_text),
    trimToMeaningfulText(firstWidget?.reason_this_matters),
  ].filter(Boolean).join("\n").trim();

  if (planningVisibleText && firstWidgetVisibleText && planningVisibleText === firstWidgetVisibleText) return false;

  return true;
}

export function toGoalWorkspaceFromMoveMap(data: MoveMapData): GoalWorkspace {
  const workspaceTimestamp = toWorkspaceTimestamp(data);
  const goalId = buildGoalId(data);
  const roadmapId = buildRoadmapId(goalId);
  const goal = mapPlanToGoal(data, goalId, workspaceTimestamp);
  const roadmap = mapRoadmapPhasesToRoadmap(data, goalId, roadmapId, workspaceTimestamp);
  const conversationPrompts = mapTaskPromptsToConversationPrompts(data.tasks, data.roadmap_phases, goalId, roadmapId, workspaceTimestamp);
  const planningSections = mapPlanningSections(data, goalId, workspaceTimestamp);
  const nextConversationPrompt = conversationPrompts.find((prompt) => !prompt.archived && ["queued", "active", "suggested"].includes(prompt.status));
  const nextPlanningSection = planningSections.find((section) => !section.archived && section.status === "active");

  const dashboardWidgets: GoalWorkspace["dashboard_widgets"] = [];
  if (nextConversationPrompt) {
    dashboardWidgets.push({
      id: "widget-next-conversation",
      goal_id: goal.id,
      title: "Next conversation",
      widget_type: "next_conversation",
      focus_state: "current_focus",
      lane: "conversation_radar",
      source_object_type: "conversation_prompt",
      source_object_id: nextConversationPrompt.id,
      prompt_text: nextConversationPrompt.prompt_text || nextConversationPrompt.opening_question,
      conversation_prompt_id: nextConversationPrompt.id,
      related_phase_id: nextConversationPrompt.phase_id,
      reason_this_matters: nextConversationPrompt.purpose || undefined,
      order: 0,
    });
  }
  if (nextPlanningSection && shouldIncludePlanningSectionWidget(nextPlanningSection, dashboardWidgets[0])) {
    dashboardWidgets.push({
      id: "widget-planning-section",
      goal_id: goal.id,
      title: "Planning snapshot",
      widget_type: "planning_section",
      focus_state: nextPlanningSection.status === "active" ? "current_focus" : "future",
      lane: "roadmap",
      source_object_id: nextPlanningSection.id,
      prompt_text: trimToMeaningfulText(nextPlanningSection.description) || derivePlanningSectionWidgetSummary(nextPlanningSection),
      reason_this_matters: derivePlanningSectionWidgetReason(nextPlanningSection) || undefined,
      order: 1,
    });
  }

  return {
    schema_version: "convo-mvp-v1",
    active_goal_id: goal.id,
    goals: [goal],
    roadmaps: [roadmap],
    dashboard_widgets: dashboardWidgets,
    tasks: mapTasksToConvoTasks(data, goalId, roadmapId, workspaceTimestamp),
    decisions: mapDecisionsToConvoDecisions(data, goalId, roadmapId, workspaceTimestamp),
    risks: mapRisksToConvoRisks(data, goalId, roadmapId, workspaceTimestamp),
    ideas_questions: mapIdeasToIdeaQuestions(data, goalId, roadmapId, workspaceTimestamp),
    conversation_prompts: conversationPrompts,
    planning_sections: planningSections,
    ai_settings: buildAiSettings(),
    created_at: workspaceTimestamp,
    updated_at: workspaceTimestamp,
  };
}
