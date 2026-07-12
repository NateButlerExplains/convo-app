import { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, FileText, Flag, HeartPulse, Home, PiggyBank, Plane, Search, Shield, ShieldCheck } from "lucide-react";
import { loadIdeas } from "../views/IdeasView";
import type { CockpitLiveState } from "../lib/live-snapshot";
import { deriveRouteProgress, type RouteRequirement } from "../lib/route-progress";
import { titleCase } from "../lib/formatters";
import type { GoalWorkspace } from "../types/convo";
import type { MoveMapData, Idea } from "../types/move-map";
import { PageHeader } from "../components/PageHeader";
import { RouteLine } from "../components/RouteLine";
import { SectionCard } from "../components/SectionCard";

const LANDMARKS = [
  { key: "research", label: "Research", icon: Search },
  { key: "visa", label: "Visa Path", icon: ShieldCheck },
  { key: "work-tax-banking", label: "Work, Tax & Banking", icon: BriefcaseBusiness },
  { key: "budget", label: "Budget Confidence", icon: PiggyBank },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "healthcare", label: "Healthcare & Insurance", icon: HeartPulse },
  { key: "housing", label: "Housing & Schools", icon: Home },
  { key: "travel", label: "Travel", icon: Plane },
  { key: "arrival", label: "Arrival", icon: Flag },
  { key: "stabilization", label: "Stabilization", icon: Shield },
];

const money = (value: number) => value.toLocaleString("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
const triggerSectionSlugByCheckpoint: Record<string, string> = {
  research: "research-and-feasibility",
  visa: "visa-and-residency",
  budget: "budget-and-savings",
  documents: "documents",
  "work-tax-banking": "work-tax-banking",
  healthcare: "healthcare-and-insurance",
  housing: "housing-and-neighborhoods",
  travel: "travel-and-arrival",
};

type HomeIdea = Idea & { archived?: boolean };

function normalizeHomeIdea(idea: HomeIdea): Required<Pick<HomeIdea, "archived">> & Omit<HomeIdea, "archived"> {
  return { ...idea, archived: Boolean(idea.archived) };
}

function requirementHref(checkpointKey: string, requirement: RouteRequirement) {
  if (requirement.taskId) return `#tasks-trigger-${triggerSectionSlugByCheckpoint[checkpointKey] ?? checkpointKey}-${requirement.taskId}`;
  if (requirement.page === "housing") return "#housing";
  return `#${requirement.page}`;
}

function normalizeTokens(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

export function HomeView({ data, liveState, goalWorkspace }: { data: MoveMapData; liveState: CockpitLiveState; goalWorkspace?: GoalWorkspace }) {
  const routeProgress = deriveRouteProgress(data, liveState);
  const currentCheckpoint = routeProgress.current;
  const generalizedRoadmapSummary = useMemo(() => {
    const roadmap = goalWorkspace?.roadmaps[0];
    if (!roadmap) return null;
    const phaseCount = roadmap.phases.length;
    const requirementCount = roadmap.phases.reduce((sum, phase) => sum + phase.requirements.length, 0);
    const completedRequirementCount = roadmap.phases.reduce(
      (sum, phase) => sum + phase.requirements.filter((requirement) => requirement.status === "done").length,
      0,
    );
    const currentPhase = roadmap.phases.find((phase) => phase.status !== "done") ?? roadmap.phases[0];
    if (phaseCount === 0 && requirementCount === 0) return null;
    return {
      phaseCount,
      requirementCount,
      completedRequirementCount,
      currentPhaseTitle: currentPhase?.title,
    };
  }, [goalWorkspace]);
  const routePhaseAlignment = useMemo(() => {
    const roadmap = goalWorkspace?.roadmaps[0];
    const currentPhase = roadmap?.phases.find((phase) => phase.status !== "done") ?? roadmap?.phases[0];
    if (!currentPhase) {
      return {
        legacyCheckpointKey: currentCheckpoint.key,
        legacyCheckpointLabel: currentCheckpoint.label,
        alignmentState: "unknown" as const,
        reason: "No generalized phase available.",
      };
    }

    const legacyTokens = normalizeTokens(currentCheckpoint.label);
    const phaseTokens = normalizeTokens(currentPhase.title);
    const overlap = legacyTokens.filter((token) => phaseTokens.includes(token));
    const alignedEnough = overlap.length > 0;

    return {
      legacyCheckpointKey: currentCheckpoint.key,
      legacyCheckpointLabel: currentCheckpoint.label,
      generalizedPhaseId: currentPhase.id,
      generalizedPhaseTitle: currentPhase.title,
      generalizedPhaseStatus: currentPhase.status,
      alignmentState: alignedEnough ? "aligned_enough" as const : "needs_review" as const,
      reason: alignedEnough ? `Shared tokens: ${overlap.join(", ")}.` : "No obvious shared tokens.",
    };
  }, [currentCheckpoint.key, currentCheckpoint.label, goalWorkspace]);
  const routeModelDrift = useMemo(() => {
    const roadmap = goalWorkspace?.roadmaps[0];
    const hasLegacyCurrentCheckpoint = Boolean(currentCheckpoint.key);
    const legacyRequirementCount = currentCheckpoint.requirements.length;
    const generalizedRequirementCount = roadmap?.phases.reduce((sum, phase) => sum + phase.requirements.length, 0) ?? 0;
    const signals: string[] = [];

    if (routePhaseAlignment.alignmentState === "needs_review") {
      signals.push("current phase alignment needs review");
    }
    if (!roadmap && hasLegacyCurrentCheckpoint) {
      signals.push("generalized roadmap missing");
    }
    if (legacyRequirementCount > 0 && generalizedRequirementCount === 0) {
      signals.push("generalized requirements missing");
    }

    return {
      state: !roadmap ? "unknown" as const : signals.length === 0 ? "in_sync_enough" as const : "drift_detected" as const,
      driftCount: signals.length,
      signals,
    };
  }, [currentCheckpoint.key, currentCheckpoint.requirements.length, goalWorkspace, routePhaseAlignment.alignmentState]);
  const generalizedHomeWidget = useMemo(() => {
    const widget = goalWorkspace?.dashboard_widgets[0];
    if (!widget) return null;
    return {
      title: widget.title,
      primaryText: widget.prompt_text ?? null,
      secondaryText: widget.reason_this_matters ?? null,
    };
  }, [goalWorkspace]);
  const generalizedSecondaryWidget = useMemo(() => {
    const widget = goalWorkspace?.dashboard_widgets[1];
    if (!widget) return null;
    return {
      title: widget.title,
      primaryText: widget.prompt_text ?? null,
      secondaryText: widget.reason_this_matters ?? null,
    };
  }, [goalWorkspace]);
  const currentLaneRequirementCountComparison = useMemo(() => {
    const roadmap = goalWorkspace?.roadmaps[0];
    const currentPhase = roadmap?.phases.find((phase) => phase.status !== "done") ?? roadmap?.phases[0];
    if (!currentPhase) {
      return {
        legacyCheckpointKey: currentCheckpoint.key,
        legacyCheckpointLabel: currentCheckpoint.label,
        legacyRequirementCount: currentCheckpoint.requirements.length,
        comparisonState: "unknown" as const,
      };
    }
    const generalizedRequirementCount = currentPhase.requirements.length;
    return {
      legacyCheckpointKey: currentCheckpoint.key,
      legacyCheckpointLabel: currentCheckpoint.label,
      legacyRequirementCount: currentCheckpoint.requirements.length,
      generalizedPhaseId: currentPhase.id,
      generalizedPhaseTitle: currentPhase.title,
      generalizedRequirementCount,
      comparisonState: currentCheckpoint.requirements.length === generalizedRequirementCount ? "same_count" as const : "different_count" as const,
    };
  }, [currentCheckpoint.key, currentCheckpoint.label, currentCheckpoint.requirements.length, goalWorkspace]);
  const currentFocusCompletionRatioComparison = useMemo(() => {
    const roadmap = goalWorkspace?.roadmaps[0];
    const currentPhase = roadmap?.phases.find((phase) => phase.status !== "done") ?? roadmap?.phases[0];
    const legacyCompletedCount = currentCheckpoint.requirements.filter((requirement) => requirement.complete).length;
    const legacyTotalCount = currentCheckpoint.requirements.length;
    const legacyRatio = legacyTotalCount > 0 ? legacyCompletedCount / legacyTotalCount : null;

    if (!currentPhase) {
      return {
        legacyCheckpointKey: currentCheckpoint.key,
        legacyCheckpointLabel: currentCheckpoint.label,
        legacyCompletedCount,
        legacyTotalCount,
        legacyRatio,
        comparisonState: "unknown" as const,
      };
    }

    const generalizedCompletedCount = currentPhase.requirements.filter((requirement) => requirement.status === "done").length;
    const generalizedTotalCount = currentPhase.requirements.length;
    const generalizedRatio = generalizedTotalCount > 0 ? generalizedCompletedCount / generalizedTotalCount : null;

    return {
      legacyCheckpointKey: currentCheckpoint.key,
      legacyCheckpointLabel: currentCheckpoint.label,
      legacyCompletedCount,
      legacyTotalCount,
      legacyRatio,
      generalizedPhaseId: currentPhase.id,
      generalizedPhaseTitle: currentPhase.title,
      generalizedCompletedCount,
      generalizedTotalCount,
      generalizedRatio,
      comparisonState: legacyRatio !== null && generalizedRatio !== null && legacyRatio === generalizedRatio ? "same_ratio" as const : "different_ratio" as const,
    };
  }, [currentCheckpoint.key, currentCheckpoint.label, currentCheckpoint.requirements, goalWorkspace]);
  const currentFocusWorkModeMixComparison = useMemo(() => {
    const roadmap = goalWorkspace?.roadmaps[0];
    const currentPhase = roadmap?.phases.find((phase) => phase.status !== "done") ?? roadmap?.phases[0];

    const legacyModeCounts = currentCheckpoint.requirements.reduce<Record<string, number>>((counts, requirement) => {
      const label = requirement.label.toLowerCase();
      const page = requirement.page?.toLowerCase?.() ?? "";
      let mode = "research";
      if (page === "decisions") mode = "decide";
      else if (page === "budget" || /(research|evaluate|compare|list|confirm)/.test(label)) mode = "research";
      else if (/(discuss|checkpoint|alignment)/.test(label)) mode = "discuss";
      else if (/(book|create|enter|choose|prepare|collect|write)/.test(label)) mode = "execute";
      counts[mode] = (counts[mode] ?? 0) + 1;
      return counts;
    }, {});

    if (!currentPhase) {
      return {
        legacyCheckpointKey: currentCheckpoint.key,
        legacyCheckpointLabel: currentCheckpoint.label,
        legacyModeCounts,
        comparisonState: "unknown" as const,
      };
    }

    const generalizedModeCounts = currentPhase.requirements.reduce<Record<string, number>>((counts, requirement) => {
      counts[requirement.work_mode] = (counts[requirement.work_mode] ?? 0) + 1;
      return counts;
    }, {});

    const dominantLegacyMode = Object.entries(legacyModeCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const dominantGeneralizedMode = Object.entries(generalizedModeCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    return {
      legacyCheckpointKey: currentCheckpoint.key,
      legacyCheckpointLabel: currentCheckpoint.label,
      legacyModeCounts,
      generalizedPhaseId: currentPhase.id,
      generalizedPhaseTitle: currentPhase.title,
      generalizedModeCounts,
      comparisonState: dominantLegacyMode && dominantLegacyMode === dominantGeneralizedMode ? "similar_mix" as const : "different_mix" as const,
      summary: dominantLegacyMode && dominantGeneralizedMode ? `legacy ${dominantLegacyMode}-heavy vs generalized ${dominantGeneralizedMode}-heavy` : undefined,
    };
  }, [currentCheckpoint.key, currentCheckpoint.label, currentCheckpoint.requirements, goalWorkspace]);
  const conversationRadarTasks = data.tasks
    .filter((task) => task.status !== "done" && task.track.toLowerCase().includes("ad hoc conversation"))
    .sort((a, b) => (a.priority === b.priority ? a.title.localeCompare(b.title) : a.priority === "high" ? -1 : b.priority === "high" ? 1 : 0));
  const openIdeas = (loadIdeas() ?? data.ideas)
    .map((idea) => normalizeHomeIdea(idea as HomeIdea))
    .filter((idea) => !idea.archived && !idea.discussed)
    .sort((a, b) => (a.priority === b.priority ? a.topic.localeCompare(b.topic) : a.priority === "high" ? -1 : b.priority === "high" ? 1 : 0));
  const openRisks = data.risks
    .filter((risk) => !((risk as { archived?: boolean }).archived) && risk.status !== "resolved")
    .sort((a, b) => (a.impact === b.impact ? a.title.localeCompare(b.title) : a.impact === "high" ? -1 : b.impact === "high" ? 1 : 0));
  const landmarks = LANDMARKS.map((landmark, index) => ({
    ...landmark,
    status: routeProgress.checkpoints[index].status,
    phaseIndex: index,
  }));
  const orderedCheckpoints = routeProgress.checkpoints
    .slice()
    .sort((a, b) => {
      const rank = (status: string) => status === "current" || status === "blocked" ? 0 : status === "future" ? 1 : 2;
      return rank(a.status) - rank(b.status);
    });
  const orderedKeys = orderedCheckpoints.map((checkpoint) => checkpoint.key);
  const [activeRouteItem, setActiveRouteItem] = useState<string | null>(() => currentCheckpoint.requirements[0]?.label ?? null);
  const [archivedRouteItems, setArchivedRouteItems] = useState<Record<string, boolean>>({});
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => ({
    "conversation-radar": true,
    [currentCheckpoint.key]: true,
  }));
  useEffect(() => {
    setOpenGroups((current) => ({ ...current, [currentCheckpoint.key]: true }));
  }, [currentCheckpoint.key]);
  const toggleGroup = (key: string) => {
    setOpenGroups((current) => {
      const nextOpen = !current[key];
      const next = { ...current, [key]: nextOpen };
      if (key === "conversation-radar") return { ...current, [key]: nextOpen };
      const index = orderedKeys.indexOf(key);
      const adjacent = index % 2 === 0 ? orderedKeys[index + 1] : orderedKeys[index - 1];
      if (adjacent) next[adjacent] = nextOpen;
      return next;
    });
  };
  const toggleArchive = (key: string) => setArchivedRouteItems((current) => ({ ...current, [key]: !current[key] }));
  const focusRouteItem = (key: string) => {
    setActiveRouteItem(key);
    setArchivedRouteItems((current) => ({ ...current, [key]: false }));
  };

  return (
    <div className="view roadmap-home">
      <PageHeader title="Dashboard">
        Live snapshot of debt, expenses, ideas, risks, and the route map that moves as you plan.
      </PageHeader>

      <section className="home-widget-grid" aria-label="Move overview">
        {generalizedHomeWidget ? <SectionCard title={generalizedHomeWidget.title} kicker="Generalized next step" className="home-widget-card"><div className="home-widget-metric"><strong>{generalizedHomeWidget.primaryText}</strong><span>{generalizedHomeWidget.secondaryText ?? "Prompt ready"}</span></div></SectionCard> : null}
        {generalizedSecondaryWidget ? <SectionCard title={generalizedSecondaryWidget.title} kicker="Generalized planning" className="home-widget-card"><div className="home-widget-metric"><strong>{generalizedSecondaryWidget.primaryText}</strong><span>{generalizedSecondaryWidget.secondaryText ?? "Planning ready"}</span></div></SectionCard> : null}
        <SectionCard title="Debt" kicker="Debt radar" className="home-widget-card">
          <div className="home-widget-metric">
            <strong>{money(liveState.debt.totalBalance)}</strong>
            <span>{liveState.debt.activeCount} open debts  {liveState.debt.overdueCount} past due</span>
          </div>
          <p className="small-text">Next due: {liveState.debt.nextDueLabel}</p>
          <a className="home-widget-link" href="#debt">Open debt ledger <span aria-hidden="true"></span></a>
        </SectionCard>

        <SectionCard title="Expenses" kicker="Nate + Shae monthly" className="home-widget-card">
          <div className="home-widget-metric">
            <strong>{money(liveState.expenses.currentTotal + liveState.expenses.spainForecast)}</strong>
            <span>{liveState.expenses.currentCount + liveState.expenses.spainCount} active rows across both people</span>
          </div>
          <p className="small-text">Next row: {liveState.expenses.nextLabel}</p>
          <a className="home-widget-link" href="#expenses">Open expense ledgers <span aria-hidden="true"></span></a>
        </SectionCard>

        <SectionCard title="Ideas" kicker="Still worth discussing" className="home-widget-card">
          <div className="home-widget-list">
            {openIdeas.length > 0 ? openIdeas.slice(0, 3).map((idea) => (
              <a key={idea.id} href="#ideas">
                <strong>{titleCase(idea.topic)}</strong>
                <span className={`home-list-badge status-${idea.priority}`}>{titleCase(idea.priority)}</span>
              </a>
            )) : <p className="home-widget-empty">No open ideas.</p>}
          </div>
          <a className="home-widget-link" href="#ideas">Review ideas <span aria-hidden="true"></span></a>
        </SectionCard>

        <SectionCard title="Risks" kicker="Watch closely" className="home-widget-card">
          <div className="home-widget-list">
            {openRisks.length > 0 ? openRisks.slice(0, 3).map((risk) => (
              <a key={risk.id} href="#risks">
                <strong>{risk.title}</strong>
                <span className={`home-list-badge status-impact-${risk.impact}`}>{titleCase(risk.impact)}</span>
              </a>
            )) : <p className="home-widget-empty">No active risks.</p>}
          </div>
          <a className="home-widget-link" href="#risks">Review risk register <span aria-hidden="true"></span></a>
        </SectionCard>
      </section>

      <section className="home-primary-grid">
        <SectionCard title="Route map" className="route-map-card">
          <div className="route-map-summary">
            <span className="route-progress-pill">{routeProgress.completedCount}/{LANDMARKS.length} phases complete</span>
            {generalizedRoadmapSummary ? <span className="small-text">Generalized roadmap: {generalizedRoadmapSummary.phaseCount} phases, {generalizedRoadmapSummary.completedRequirementCount}/{generalizedRoadmapSummary.requirementCount} requirements complete{generalizedRoadmapSummary.currentPhaseTitle ? `  Current phase: ${generalizedRoadmapSummary.currentPhaseTitle}` : ""}</span> : null}
            {routePhaseAlignment.generalizedPhaseTitle ? <span className="small-text">Legacy route focus: {routePhaseAlignment.legacyCheckpointLabel}. Generalized phase: {routePhaseAlignment.generalizedPhaseTitle}. Alignment: {routePhaseAlignment.alignmentState === "aligned_enough" ? "aligned enough" : "review"}</span> : null}
            <span className="small-text">Model drift: {routeModelDrift.state === "unknown" ? "unknown" : routeModelDrift.driftCount === 0 ? "none" : `${routeModelDrift.driftCount} signal${routeModelDrift.driftCount === 1 ? "" : "s"}`}</span>
            <span className="small-text">Current focus count: legacy {currentLaneRequirementCountComparison.legacyRequirementCount}{typeof currentLaneRequirementCountComparison.generalizedRequirementCount === "number" ? ` vs generalized ${currentLaneRequirementCountComparison.generalizedRequirementCount}` : " vs generalized none"} {currentLaneRequirementCountComparison.comparisonState === "same_count" ? "match" : currentLaneRequirementCountComparison.comparisonState === "different_count" ? "diff" : "unknown"}</span>
            <span className="small-text">Current focus progress: legacy {currentFocusCompletionRatioComparison.legacyCompletedCount}/{currentFocusCompletionRatioComparison.legacyTotalCount}{typeof currentFocusCompletionRatioComparison.generalizedCompletedCount === "number" && typeof currentFocusCompletionRatioComparison.generalizedTotalCount === "number" ? ` vs generalized ${currentFocusCompletionRatioComparison.generalizedCompletedCount}/${currentFocusCompletionRatioComparison.generalizedTotalCount}` : " vs generalized none"} {currentFocusCompletionRatioComparison.comparisonState === "same_ratio" ? "match" : currentFocusCompletionRatioComparison.comparisonState === "different_ratio" ? "diff" : "unknown"}</span>
            <span className="small-text">Current focus mode mix: {currentFocusWorkModeMixComparison.summary ?? "unknown"} {currentFocusWorkModeMixComparison.comparisonState === "similar_mix" ? "similar" : currentFocusWorkModeMixComparison.comparisonState === "different_mix" ? "different" : "unknown"}</span>
          </div>

          <RouteLine
            landmarks={landmarks}
            currentPhaseIndex={Math.max(0, routeProgress.currentIndex)}
            totalPhases={LANDMARKS.length}
          />

          <div className="route-guidance route-guidance-compact" aria-label="What moves the route map">
            <div className="route-guidance-groups">
              <details className="route-guidance-group conversation-radar-group" open={openGroups["conversation-radar"]}>
                <summary onClick={(event) => { event.preventDefault(); toggleGroup("conversation-radar"); }}><span>Conversation Radar</span><small>{conversationRadarTasks.length}</small></summary>
                <ul className="route-guidance-list">
                  {conversationRadarTasks.length > 0 ? conversationRadarTasks.map((task) => (
                    <li key={task.id} className={`${task.priority === "high" ? "is-current-route-item" : "is-future-route-item"} ${archivedRouteItems[task.id] ? "is-archived-route-item" : ""} ${activeRouteItem === task.id ? "is-active-route-item" : "is-inactive-route-item"}`}>
                      <a href={`#tasks-trigger-ad-hoc-conversation-tasks-${task.id}`} onClick={() => focusRouteItem(task.id)}>{task.title}</a>
                      <span className="route-item-actions"><button type="button" onClick={() => toggleArchive(task.id)}>{archivedRouteItems[task.id] ? "Restore" : "Archive"}</button></span>
                    </li>
                  )) : (
                    <li className="is-future-route-item">
                      <span>No conversation-generated tasks yet.</span>
                      <small>Empty</small>
                    </li>
                  )}
                </ul>
              </details>

              {orderedCheckpoints.map((checkpoint) => (
                <details key={checkpoint.key} className={`route-guidance-group ${checkpoint.key === currentCheckpoint.key ? "is-focus-group" : ""} ${checkpoint.status === "complete" ? "is-complete-group" : ""}`} open={openGroups[checkpoint.key]}>
                  <summary onClick={(event) => { event.preventDefault(); toggleGroup(checkpoint.key); }}>
                    <span>{checkpoint.label}</span>
                    <small>{checkpoint.requirements.filter((item) => item.complete).length}/{checkpoint.requirements.length}</small>
                  </summary>
                  <ul className="route-guidance-list">
                    {checkpoint.requirements
                      .slice()
                      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
                      .map((requirement) => (
                      <li key={requirement.label} className={`${requirement.complete ? "is-complete" : ""} ${checkpoint.key === currentCheckpoint.key ? "is-current-route-item" : "is-future-route-item"} ${archivedRouteItems[requirement.label] ? "is-archived-route-item" : ""} ${activeRouteItem === requirement.label ? "is-active-route-item" : "is-inactive-route-item"}`}>
                        <a href={requirementHref(checkpoint.key, requirement)} onClick={() => focusRouteItem(requirement.label)}>{requirement.label}</a>
                        <span className="route-item-actions"><button type="button" onClick={() => toggleArchive(requirement.label)}>{archivedRouteItems[requirement.label] ? "Restore" : "Archive"}</button></span>
                        <span className="route-complexity" aria-label={`Complexity ${requirement.complexity} out of 3`}>
                          {[1, 2, 3].map((bar) => <span key={bar} className={`complexity-bar${bar <= requirement.complexity ? " is-filled" : ""}`} />)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </div>
        </SectionCard>
      </section>
    </div>
  );
}
