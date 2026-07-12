import type { MoveMapData, ViewKey } from "../types/move-map";
import { NavRail } from "./NavRail";
import { PrintActions } from "./PrintActions";

export function AppShell({ data, view, children }: { data: MoveMapData; view: ViewKey; children: React.ReactNode }) {
  const immersive = view === "big-trip";

  return (
    <div className={`app-shell ${immersive ? "app-shell-immersive" : ""}`}>
      <NavRail active={view} />
      <div className="app-main">
        {!immersive && (
          <header className="topbar topbar-actions-only">
            <PrintActions data={data} />
          </header>
        )}
        <main className={immersive ? "main-immersive" : undefined}>{children}</main>
      </div>
    </div>
  );
}
