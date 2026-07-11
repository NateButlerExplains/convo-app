import type { MoveMapData, ViewKey } from "../types/move-map";
import { NavRail } from "./NavRail";
import { PrintActions } from "./PrintActions";

export function AppShell({ data, view, children }: { data: MoveMapData; view: ViewKey; children: React.ReactNode }) {
  return <div className="app-shell">
    <NavRail active={view} />
    <div className="app-main">
      <header className="topbar">
        <div>
          <strong>{data.plan.title}</strong>
          <span>Family move atlas</span>
        </div>
        <PrintActions data={data} />
      </header>
      <main>{children}</main>

    </div>
  </div>;
}
