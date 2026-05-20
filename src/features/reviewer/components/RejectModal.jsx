import { useState } from "react";
import { REVIEWER_ADDR } from "../data/seed";
import { actionSummary } from "../utils/formatters";
import { DIcon } from "./Icons";

export default function RejectModal({ decision, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  const max = 500;
  const ok = reason.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 ag-fade">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-lg overflow-hidden ag-slide-up">
        <div className="px-6 py-5 border-b border-gray-100 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0">{DIcon.alert("w-5 h-5")}</div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900">Record Override Reason</h3>
            <p className="mt-0.5 text-xs text-gray-500">
              This rejection will be recorded on-chain. Your reason becomes part of the immutable audit trail.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">{DIcon.close("w-4 h-4")}</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-xs">
            <div className="text-gray-500">You are rejecting</div>
            <div className="mt-0.5 text-sm font-medium text-gray-900">{actionSummary(decision)}</div>
            <div className="mt-1 font-mono text-[11px] text-gray-500">{decision.id} · {decision.proposal_hash}</div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Rejection reason <span className="text-red-600">*</span></label>
            <textarea
              autoFocus
              maxLength={max}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this decision is being overridden. Be specific — this text is hashed and anchored."
              className="mt-1.5 w-full h-32 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm text-gray-900 p-3 resize-none placeholder:text-gray-400"
            />
            <div className="mt-1 flex items-center justify-between">
              <div className="text-[11px] text-gray-500">
                Signing as <span className="font-mono text-gray-700">{REVIEWER_ADDR}</span>
              </div>
              <div className={`text-[11px] font-mono ${reason.length > max * 0.9 ? "text-amber-600" : "text-gray-400"}`}>
                {reason.length} / {max}
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
          <button onClick={onClose} className="text-sm font-semibold text-gray-700 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-white">
            Cancel
          </button>
          <button
            disabled={!ok}
            onClick={() => onConfirm(reason.trim())}
            className={`text-sm font-semibold rounded-lg px-4 py-2 text-white ${
              ok ? "bg-red-600 hover:bg-red-700" : "bg-red-300 cursor-not-allowed"
            }`}
          >
            Confirm Reject
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Override Log view ---------- */
