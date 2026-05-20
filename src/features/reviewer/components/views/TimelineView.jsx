import { useMemo, useState } from "react";
import { RiskBadge, StatusBadge } from "@/components/shared/DecisionUi";
import { DIcon } from "../Icons";
import { actionSummary, relTime } from "../../utils/formatters";

export default function TimelineView({ decisions, onView }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");

  const agents = useMemo(() => Array.from(new Set(decisions.map((d) => d.agent_id))), [decisions]);

  const filtered = useMemo(() => {
    return decisions
      .filter((d) => {
        if (statusFilter === "all") return true;
        if (statusFilter === "pending") return d.status === "pending_approval";
        if (statusFilter === "approved") return d.status === "approved" || d.status === "auto_approved";
        if (statusFilter === "rejected") return d.status === "rejected";
        return true;
      })
      .filter((d) => agentFilter === "all" || d.agent_id === agentFilter)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [decisions, statusFilter, agentFilter]);

  const filters = [
    { id: "all", label: "All", n: decisions.length },
    { id: "pending", label: "Pending", n: decisions.filter((d) => d.status === "pending_approval").length },
    { id: "approved", label: "Approved", n: decisions.filter((d) => d.status === "approved" || d.status === "auto_approved").length },
    { id: "rejected", label: "Rejected", n: decisions.filter((d) => d.status === "rejected").length },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold tracking-tight text-gray-900">Decision Timeline</h1>
        <p className="text-sm text-gray-500">Every action the agent proposes — auto-cleared, awaiting review, or vetoed by a human.</p>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                statusFilter === f.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {f.label}
              <span className={`text-[10px] font-semibold rounded-full px-1.5 ${statusFilter === f.id ? "bg-blue-50 text-blue-600" : "bg-gray-200 text-gray-600"}`}>{f.n}</span>
            </button>
          ))}
        </div>
        <div className="h-6 w-px bg-gray-200" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Agent</span>
          <div className="relative">
            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="appearance-none text-xs font-medium pr-7 pl-3 py-1.5 rounded-md border border-gray-200 bg-white text-gray-900 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            >
              <option value="all">All agents</option>
              {agents.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400">{DIcon.chev("w-4 h-4")}</span>
          </div>
        </div>
        <div className="ml-auto text-xs text-gray-500 font-mono">{filtered.length} of {decisions.length}</div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500 bg-gray-50 border-b border-gray-100">
              <th className="px-5 py-3 font-medium">Agent</th>
              <th className="px-5 py-3 font-medium">Action</th>
              <th className="px-5 py-3 font-medium">Risk</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Time</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onView(d.id)}>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-gray-900 text-white flex items-center justify-center">{DIcon.bot("w-3.5 h-3.5")}</div>
                    <span className="font-mono text-[12px] text-gray-700">{d.agent_id}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="font-medium text-gray-900 truncate max-w-xs">{actionSummary(d)}</div>
                  <div className="text-[11px] text-gray-500 truncate font-mono max-w-xs">{d.proposal_hash}</div>
                </td>
                <td className="px-5 py-3.5"><RiskBadge level={d.risk.level} score={d.risk.score} withScore /></td>
                <td className="px-5 py-3.5"><StatusBadge status={d.status} /></td>
                <td className="px-5 py-3.5 text-gray-500 text-[13px] whitespace-nowrap">{relTime(d.created_at)}</td>
                <td className="px-5 py-3.5 text-right">
                  <button
                    onClick={(e) => { e.stopPropagation(); onView(d.id); }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="6" className="px-5 py-16 text-center text-sm text-gray-500">
                  No decisions match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Detail view ---------- */
