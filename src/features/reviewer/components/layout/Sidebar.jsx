import { DIcon } from "../Icons";

export default function Sidebar({ view, setView, counts }) {
  const items = [
    { id: "timeline", label: "Decision Timeline", icon: DIcon.list, badge: counts.pending },
    { id: "overrides", label: "Override Log", icon: DIcon.alert, badge: counts.rejected },
    { id: "stats", label: "Audit Stats", icon: DIcon.bars },
    { id: "agent", label: "Agent UI Demo", icon: DIcon.bot },
  ];
  return (
    <aside className="w-60 shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="px-4 py-4 border-b border-gray-200">
        <div className="text-[11px] font-mono uppercase tracking-wider text-gray-400">organization</div>
        <button className="mt-1 w-full flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-white border border-transparent hover:border-gray-200">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-md bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center">DD</div>
            <span className="text-sm font-medium text-gray-900 truncate">demo-dao</span>
          </div>
          {DIcon.chev("w-4 h-4 text-gray-400")}
        </button>
      </div>
      <nav className="p-3 space-y-1 flex-1">
        {items.map((it) => {
          const active = view === it.id;
          return (
            <button
              key={it.id}
              onClick={() => setView(it.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                active ? "bg-blue-50 text-blue-600 font-semibold" : "text-gray-700 hover:bg-white hover:text-gray-900"
              }`}
            >
              <span className={active ? "text-blue-600 font-semibold" : "text-gray-400"}>{it.icon("w-4 h-4")}</span>
              <span className="flex-1 text-left">{it.label}</span>
              {it.badge ? (
                <span
                  className={`inline-flex h-5 min-w-5 aspect-square items-center justify-center rounded-full text-[10px] font-semibold ${active ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-700"}`}
                >
                  {it.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
      <div className="p-3 border-t border-gray-200">
        <div className="rounded-lg bg-white border border-gray-200 p-3">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Avalanche Fuji · live
          </div>
          <div className="mt-1 text-[11px] font-mono text-gray-400 truncate">block 9,124,883</div>
        </div>
      </div>
    </aside>
  );
}

/* ---------- Top bar ---------- */
