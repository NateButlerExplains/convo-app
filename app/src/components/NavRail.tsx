import { useState } from "react";
import type { ViewKey } from "../types/move-map";
import { titleCase } from "../lib/formatters";

const groups: Array<{ label: string; items: ViewKey[] }> = [
  { label: "Core", items: ["conversation", "tasks", "decisions", "alons-skills"] },
  { label: "Planning", items: ["income", "housing", "budget", "debt", "expenses"] },
  { label: "Reference", items: ["calendar", "options", "ideas", "risks"] },
];
const labels: Partial<Record<ViewKey, string>> = {
  home: "Dashboard",
  "alons-skills": "Alon's Skills",
  income: "Income Planning",
  housing: "Housing Planning",
};

export function NavRail({ active }: { active: ViewKey }) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  return (
    <nav className="nav-rail" aria-label="Primary navigation">
      <a className="brand" href="#home"><span>Move Map</span></a>
      <a href="#home" aria-current={active === "home" ? "page" : undefined} className={`home-dashboard-link ${active === "home" ? "active" : ""}`}>
        {labels.home}
      </a>
      {groups.map((group) => {
        const isCollapsed = collapsed[group.label] ?? false;
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
              <span className="nav-group-chevron" aria-hidden="true">{isCollapsed ? "+" : ""}</span>
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
