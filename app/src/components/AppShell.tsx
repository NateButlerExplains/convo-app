import type { MoveMapData, ViewKey } from "../types/move-map";
import { NavRail } from "./NavRail";

export function AppShell({ data, view, children }: { data: MoveMapData; view: ViewKey; children: React.ReactNode }) {
  return <div className="app-shell">
    <NavRail active={view} />
    <div className="app-main">
      <header className="topbar"><div><strong>{data.plan.title}</strong><span>{data.plan.origin} to {data.plan.destination}</span></div><span className="privacy-dot">Local only</span></header>
      <main>{children}</main>
      <footer className="app-footer">Private localhost planning prototype. Exports stay local unless shared. Not legal, financial, medical, tax, immigration, or school-placement advice.</footer>
    </div>
  </div>;
}
