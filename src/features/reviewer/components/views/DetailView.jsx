import { useMemo } from "react";
import { Panel, RiskBadge, StatusBadge } from "@/components/shared/DecisionUi";
import { SNOWTRACE, REVIEWER_ADDR } from "../../data/seed";
import { actionSummary, relTime } from "../../utils/formatters";
import { DIcon } from "../Icons";

export default function DetailView({ decision, onBack, onReject, onApprove }) {
  const d = decision;
  const anchored = !!d.anchor_tx;

  const events = useMemo(() => {
    const items = [
      { label: "Proposed", at: d.created_at, kind: "neutral" },
      { label: "Risk scored", at: d.created_at, kind: "neutral", detail: `${d.risk.level.toUpperCase()} · ${d.risk.score.toFixed(2)}` },
    ];
    if (d.status === "auto_approved") items.push({ label: "Auto-approved", at: d.created_at, kind: "good" });
    if (d.status === "approved" && d.approvals) items.push({ label: "Approved by reviewer", at: d.approvals[0].timestamp, kind: "good", detail: d.approvals[0].approver });
    if (d.status === "rejected" && d.rejection) items.push({ label: "Rejected by reviewer", at: d.rejection.timestamp, kind: "bad", detail: d.rejection.rejected_by });
    if (anchored) items.push({ label: "Anchored on Avalanche", at: d.created_at, kind: "chain", detail: d.anchor_tx });
    return items;
  }, [d, anchored]);

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
        {DIcon.arrowLeft("w-4 h-4")} Back to timeline
      </button>

      {/* Header card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-mono uppercase tracking-wider text-gray-400">decision</div>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="font-mono text-sm text-gray-900 truncate">{d.id} · {d.proposal_hash}</div>
              <button title="Copy" className="text-gray-400 hover:text-gray-600">{DIcon.copy("w-3.5 h-3.5")}</button>
            </div>
            <div className="mt-2 text-lg font-semibold text-gray-900">{actionSummary(d)}</div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
              <span className="font-mono">{d.agent_id}</span>
              <span>·</span>
              <span>org <span className="font-mono">{d.org_id}</span></span>
              <span>·</span>
              <span>{relTime(d.created_at)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <RiskBadge level={d.risk.level} score={d.risk.score} withScore />
            <StatusBadge status={d.status} />
          </div>
        </div>

        {/* Action buttons */}
        {d.status === "pending_approval" && (
          <div className="mt-6 flex flex-wrap gap-2 border-t border-gray-100 pt-5">
            <button
              onClick={() => onApprove(d.id)}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg px-4 py-2"
            >
              Approve & anchor
            </button>
            <button
              onClick={() => onReject(d.id)}
              className="inline-flex items-center gap-2 text-red-700 border border-red-200 hover:bg-red-50 text-sm font-semibold rounded-lg px-4 py-2"
            >
              Reject
            </button>
            <div className="ml-auto text-xs text-gray-500 flex items-center gap-1.5">
              Signing as <span className="font-mono text-gray-700">{REVIEWER_ADDR}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Action block */}
          <Panel title="Action">
            <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-[12px] leading-6 font-mono whitespace-pre-wrap overflow-x-auto">
{JSON.stringify({ type: d.action.type, ...d.action.params && { params: d.action.params } }, null, 2)}
            </pre>
          </Panel>

          {/* Rationale */}
          <Panel title="Rationale summary"
            actions={d.reasoning_ref && (
              <a
                href={`https://smith.langchain.com/o/demo/runs/${d.reasoning_ref.run_id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                View Trace (LangSmith) {DIcon.ext("w-3.5 h-3.5")}
              </a>
            )}
          >
            <p className="text-sm text-gray-700 leading-relaxed">{d.rationale_summary}</p>
            {d.reasoning_ref && (
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono text-gray-500">
                <span>run_id: <span className="text-gray-700">{d.reasoning_ref.run_id}</span></span>
                <span>·</span>
                <span>hash: <span className="text-gray-700">{d.reasoning_ref.hash}</span></span>
              </div>
            )}
          </Panel>

          {/* Risk */}
          <Panel title="Risk assessment">
            <div className="flex items-center gap-3 mb-4">
              <RiskBadge level={d.risk.level} />
              <span className="font-mono text-xs text-gray-500">score</span>
              <span className="font-mono text-sm font-semibold text-gray-900">{d.risk.score.toFixed(2)}</span>
            </div>
            <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  d.risk.level === "high" ? "bg-red-500" : d.risk.level === "medium" ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${Math.round(d.risk.score * 100)}%` }}
              />
              {/* threshold mark */}
              <div className="absolute top-0 bottom-0 w-px bg-gray-400/60" style={{ left: "70%" }} />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-gray-400 font-mono">
              <span>0.00 safe</span>
              <span>0.70 threshold</span>
              <span>1.00 critical</span>
            </div>
            <div className="mt-5">
              <div className="text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-2">rules hit</div>
              <div className="flex flex-wrap gap-1.5">
                {d.risk.rules_hit.map((r) => (
                  <span key={r} className="inline-flex items-center text-[11px] font-mono px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 border border-gray-200">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </Panel>

          {/* Rejection block */}
          {d.status === "rejected" && d.rejection && (
            <Panel
              title="Rejection record"
              tone="red"
              actions={d.anchor_tx && (
                <a href={`${SNOWTRACE}${d.anchor_tx.replace(/\.\.\./g, "deadbeef")}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700">
                  On-chain rejection {DIcon.ext("w-3.5 h-3.5")}
                </a>
              )}
            >
              <p className="text-sm text-gray-800 leading-relaxed">"{d.rejection.reason}"</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                <span>by <span className="font-mono text-gray-700">{d.rejection.rejected_by}</span></span>
                <span>·</span>
                <span>{relTime(d.rejection.timestamp)}</span>
                <span>·</span>
                <span>reason hash <span className="font-mono text-gray-700">{d.rejection.reason_hash}</span></span>
              </div>
            </Panel>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* On-chain anchor */}
          <Panel title="On-chain anchor">
            <div className="text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1">proposal hash</div>
            <div className="font-mono text-xs text-gray-900 break-all">{d.proposal_hash}</div>
            <div className="mt-4 text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1">anchor tx</div>
            {anchored ? (
              <div>
                <div className="font-mono text-xs text-gray-900 break-all">{d.anchor_tx}</div>
                <a
                  href={`${SNOWTRACE}${d.anchor_tx.replace(/\.\.\./g, "deadbeef")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  View on Snowtrace {DIcon.ext("w-3.5 h-3.5")}
                </a>
              </div>
            ) : (
              <div className="mt-1 inline-flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2 py-1.5">
                <span className="relative inline-flex w-1.5 h-1.5">
                  <span className="absolute inset-0 rounded-full text-amber-400 ag-pulse-dot" />
                  <span className="relative w-1.5 h-1.5 rounded-full bg-amber-500" />
                </span>
                Pending anchor — waiting on reviewer signature
              </div>
            )}
          </Panel>

          {/* Status timeline */}
          <Panel title="Status history">
            <ol className="relative border-l border-gray-200 ml-1.5 space-y-4">
              {events.map((e, i) => (
                <li key={i} className="pl-4">
                  <span className={`absolute -left-[5px] mt-1 w-2.5 h-2.5 rounded-full border-2 border-white ${
                    e.kind === "good" ? "bg-emerald-500" : e.kind === "bad" ? "bg-red-500" : e.kind === "chain" ? "bg-blue-500" : "bg-gray-400"
                  }`} />
                  <div className="text-sm font-medium text-gray-900">{e.label}</div>
                  {e.detail && <div className="text-[11px] font-mono text-gray-500 truncate">{e.detail}</div>}
                  <div className="text-[11px] text-gray-400">{relTime(e.at)}</div>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ---------- Reject modal ---------- */
