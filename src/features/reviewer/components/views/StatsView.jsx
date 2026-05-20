import { Panel, RiskBadge, StatusBadge } from "@/components/shared/DecisionUi";
import { actionSummary, relTime } from "../../utils/formatters";

export default function StatsView({ decisions }) {
  const total = decisions.length;
  const pending = decisions.filter((d) => d.status === "pending_approval").length;
  const approved = decisions.filter((d) => d.status === "approved").length;
  const autoApproved = decisions.filter((d) => d.status === "auto_approved").length;
  const rejected = decisions.filter((d) => d.status === "rejected").length;
  const anchored = decisions.filter((d) => !!d.anchor_tx).length;

  const high = decisions.filter((d) => d.risk.level === "high").length;
  const medium = decisions.filter((d) => d.risk.level === "medium").length;
  const low = decisions.filter((d) => d.risk.level === "low").length;

  const cards = [
    { label: "Decisions governed", value: total, sub: "across all agents" },
    { label: "Anchored on-chain", value: `${Math.round((anchored / total) * 100)}%`, sub: `${anchored} of ${total} decisions` },
    { label: "Human overrides", value: rejected, sub: "AI proposals rejected" },
    { label: "Auto-clear rate", value: `${Math.round((autoApproved / total) * 100)}%`, sub: "below all thresholds" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">Audit Stats</h1>
        <p className="text-sm text-gray-500">A snapshot of governance activity across all agents in this org.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-gray-400">{c.label}</div>
            <div className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">{c.value}</div>
            <div className="mt-1 text-xs text-gray-500">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="Status breakdown">
          <StackedBar
            items={[
              { label: "auto-approved", value: autoApproved, color: "bg-blue-500" },
              { label: "approved", value: approved, color: "bg-emerald-500" },
              { label: "pending", value: pending, color: "bg-orange-500" },
              { label: "rejected", value: rejected, color: "bg-red-500" },
            ]}
            total={total}
          />
        </Panel>
        <Panel title="Risk distribution">
          <StackedBar
            items={[
              { label: "low", value: low, color: "bg-emerald-500" },
              { label: "medium", value: medium, color: "bg-amber-500" },
              { label: "high", value: high, color: "bg-red-500" },
            ]}
            total={total}
          />
        </Panel>
      </div>

      <Panel title="Recent activity">
        <ol className="relative border-l border-gray-200 ml-1.5 space-y-4">
          {decisions.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5).map((d) => (
            <li key={d.id} className="pl-4">
              <span className={`absolute -left-[5px] mt-1.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                d.status === "rejected" ? "bg-red-500" : d.status === "pending_approval" ? "bg-orange-500" : d.status === "approved" ? "bg-emerald-500" : "bg-blue-500"
              }`} />
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-medium text-gray-900">{actionSummary(d)}</div>
                <RiskBadge level={d.risk.level} />
                <StatusBadge status={d.status} />
                <span className="ml-auto text-[11px] text-gray-400">{relTime(d.created_at)}</span>
              </div>
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  );
}

function StackedBar({ items, total }) {
  return (
    <div>
      <div className="flex w-full h-3 rounded-full overflow-hidden bg-gray-100">
        {items.map((it) => (
          <div key={it.label} className={`${it.color} h-full`} style={{ width: `${(it.value / total) * 100}%` }} title={`${it.label}: ${it.value}`} />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
        {items.map((it) => (
          <div key={it.label} className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-sm ${it.color}`} />
            <span className="text-gray-700">{it.label}</span>
            <span className="ml-auto font-mono text-gray-900">{it.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Agent UI Demo (placeholder, but credible) ---------- */
