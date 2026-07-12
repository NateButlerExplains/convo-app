import { useEffect, useState } from "react";
import type { ViewKey } from "../types/move-map";
import { titleCase } from "../lib/formatters";

const groups: Array<{ label: string; items: ViewKey[] }> = [
  { label: "Core", items: ["tasks", "conversation", "decisions", "alons-skills"] },
  { label: "Planning", items: ["income", "housing", "budget", "debt", "expenses"] },
  { label: "Reference", items: ["calendar", "options", "ideas", "risks"] },
];
const labels: Partial<Record<ViewKey, string>> = {
  home: "Dashboard",
  "alons-skills": "Aloni's Skills \u{1F476}\u{1F3FE}",
  conversation: "Conversations",
  income: "Income",
  housing: "Housing",
};

function groupForView(view: ViewKey): string | null {
  return groups.find((group) => group.items.includes(view))?.label ?? null;
}

function collapseMap(active: ViewKey): Record<string, boolean> {
  const activeGroup = groupForView(active);
  // Start collapsed; only the active section opens.
  return Object.fromEntries(groups.map((group) => [group.label, group.label !== activeGroup]));
}

export function NavRail({ active }: { active: ViewKey }) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => collapseMap(active));

  // When route changes, ensure that section is expanded (others keep user choice).
  useEffect(() => {
    const activeGroup = groupForView(active);
    if (!activeGroup) return;
    setCollapsed((current) => ({ ...current, [activeGroup]: false }));
  }, [active]);

  return (
    <nav className="nav-rail" aria-label="Primary navigation">
      <a
        href="#big-trip"
        aria-current={active === "big-trip" ? "page" : undefined}
        className={`brand home-dashboard-link ${active === "big-trip" ? "active" : ""}`}
      >
        The Big Trip
      </a>
      <a href="#home" aria-current={active === "home" ? "page" : undefined} className={`home-dashboard-link ${active === "home" ? "active" : ""}`}>
        {labels.home}
      </a>
      {groups.map((group) => {
        const isCollapsed = collapsed[group.label] ?? true;
        return (
          <div key={group.label} className={`nav-group ${isCollapsed ? "is-collapsed" : ""}`}>
            <button
              type="button"
              className="nav-group-label"
              aria-expanded={!isCollapsed}
              aria-controls={`nav-group-${group.label.toLowerCase()}`}
              onClick={() => setCollapsed((current) => ({ ...current, [group.label]: !isCollapsed }))}
            >
              <span>{group.label}</span>
              <span className="nav-group-chevron" aria-hidden="true">{isCollapsed ? "+" : "-"}</span>
            </button>
            <div id={`nav-group-${group.label.toLowerCase()}`} className="nav-group-items" hidden={isCollapsed}>
              {group.items.map((item) => (
                <a key={item} href={`#${item}`} aria-current={active === item ? "page" : undefined} className={active === item ? "active" : ""}>
                  {labels[item] ?? titleCase(item)}
                </a>
              ))}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
