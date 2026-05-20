import { Fragment, useState } from "react";
import { POLYGONSCAN } from "../../data/seed";
import { actionSummary, relTime } from "../../utils/formatters";
import { DIcon } from "../Icons";

export default function OverrideLogView({ decisions, onView }) {
  const rejected = decisions
    .filter((d) => d.status === "rejected")
    .sort((a, b) => new Date(b.rejection?.timestamp || b.created_at) - new Date(a.rejection?.timestamp || a.created_at));

  const [expanded, setExpanded] = useState(null);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">Override Log — Human Rejections</h1>
        <p className="text-sm text-gray-500">Every override is an on-chain fact. This log proves governance has real teeth.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {rejected.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="text-sm text-gray-500">No overrides recorded yet. Clean governance so far.</div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500 bg-gray-50 border-b border-gray-100">
                <th className="px-5 py-3 font-medium">Agent</th>
                <th className="px-5 py-3 font-medium">Action</th>
                <th className="px-5 py-3 font-medium">Rejection reason</th>
                <th className="px-5 py-3 font-medium">Rejector</th>
                <th className="px-5 py-3 font-medium">Time</th>
                <th className="px-5 py-3 font-medium text-right">On-chain</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rejected.map((d) => {
                const isOpen = expanded === d.id;
                return (
                  <Fragment key={d.id}>
                    <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => onView(d.id)}>
                      <td className="px-5 py-3.5 font-mono text-[12px] text-gray-700">{d.agent_id}</td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-gray-900">{actionSummary(d)}</div>
                        <div className="text-[11px] font-mono text-gray-500">{d.proposal_hash}</div>
                      </td>
                      <td className="px-5 py-3.5 max-w-sm">
                        <button
                          onClick={(e) => { e.stopPropagation(); setExpanded(isOpen ? null : d.id); }}
                          className="text-left w-full"
                          title={d.rejection.reason}
                        >
                          <div className={`text-sm text-gray-800 ${isOpen ? "" : "truncate"}`}>"{d.rejection.reason}"</div>
                          <div className="text-[11px] text-blue-600 font-medium mt-0.5">{isOpen ? "Collapse" : "Expand"}</div>
                        </button>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[12px] text-gray-700">{d.rejection.rejected_by}</td>
                      <td className="px-5 py-3.5 text-gray-500 text-[13px] whitespace-nowrap">{relTime(d.rejection.timestamp)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <a
                          href={`${POLYGONSCAN}${(d.anchor_tx || "").replace(/\.\.\./g, "deadbeef")}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                        >
                          PolygonScan {DIcon.ext("w-3.5 h-3.5")}
                        </a>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-red-50/30">
                        <td colSpan="6" className="px-5 py-4">
                          <div className="grid sm:grid-cols-2 gap-4 text-xs">
                            <div>
                              <div className="font-mono uppercase tracking-wider text-gray-400 mb-1">reason hash</div>
                              <div className="font-mono text-gray-800 break-all">{d.rejection.reason_hash}</div>
                            </div>
                            <div>
                              <div className="font-mono uppercase tracking-wider text-gray-400 mb-1">rationale at time of proposal</div>
                              <div className="text-gray-700">{d.rationale_summary}</div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ---------- Audit Stats view ---------- */
