"use client";

import { useMemo, useState } from "react";
import AgentDemoView from "./components/views/AgentDemoView";
import RejectModal from "./components/RejectModal";
import Sidebar from "./components/layout/Sidebar";
import TopBar from "./components/layout/TopBar";
import DetailView from "./components/views/DetailView";
import OverrideLogView from "./components/views/OverrideLogView";
import StatsView from "./components/views/StatsView";
import TimelineView from "./components/views/TimelineView";
import { REVIEWER_ADDR, SEED } from "./data/seed";

export default function ReviewerDashboard() {
  const [decisions, setDecisions] = useState(SEED);
  const [view, setView] = useState("timeline");
  const [selectedId, setSelectedId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [toast, setToast] = useState(null);

  const selected = useMemo(() => decisions.find((d) => d.id === selectedId), [decisions, selectedId]);
  const rejecting = useMemo(() => decisions.find((d) => d.id === rejectingId), [decisions, rejectingId]);

  const counts = {
    pending: decisions.filter((d) => d.status === "pending_approval").length,
    rejected: decisions.filter((d) => d.status === "rejected").length,
  };

  function showToast(msg, kind = "info") {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 2600);
  }

  function handleView(id) {
    setSelectedId(id);
    setView("detail");
  }

  function handleApprove(id) {
    setDecisions((all) =>
      all.map((d) =>
        d.id === id
          ? {
              ...d,
              status: "approved",
              approvals: [{ approver: REVIEWER_ADDR, timestamp: new Date().toISOString() }],
              anchor_tx: "0xnew" + Math.random().toString(16).slice(2, 10) + "...approve",
            }
          : d
      )
    );
    showToast("Approved · anchor tx submitted to Polygon", "good");
  }

  function handleConfirmReject(reason) {
    const id = rejectingId;
    setDecisions((all) =>
      all.map((d) =>
        d.id === id
          ? {
              ...d,
              status: "rejected",
              rejection: {
                rejected_by: REVIEWER_ADDR,
                reason,
                reason_hash: "0x" + Math.random().toString(16).slice(2, 6) + "..." + Math.random().toString(16).slice(2, 6),
                timestamp: new Date().toISOString(),
              },
              anchor_tx: "0xnew" + Math.random().toString(16).slice(2, 10) + "...reject",
            }
          : d
      )
    );
    setRejectingId(null);
    showToast("Rejection recorded · reason anchored on-chain", "bad");
  }

  const body = (() => {
    if (view === "timeline") return <TimelineView decisions={decisions} onView={handleView} />;
    if (view === "detail" && selected) return (
      <DetailView
        decision={selected}
        onBack={() => setView("timeline")}
        onApprove={handleApprove}
        onReject={(id) => setRejectingId(id)}
      />
    );
    if (view === "overrides") return <OverrideLogView decisions={decisions} onView={handleView} />;
    if (view === "stats") return <StatsView decisions={decisions} />;
    if (view === "agent") return <AgentDemoView decisions={decisions} onView={handleView} />;
    return <TimelineView decisions={decisions} onView={handleView} />;
  })();

  return (
    <div className="h-screen flex flex-col bg-white" data-screen-label="Reviewer Dashboard">
      <TopBar />
      <div className="flex flex-1 min-h-0">
        <Sidebar
          view={view === "detail" ? "timeline" : view}
          setView={(v) => { setView(v); setSelectedId(null); }}
          counts={counts}
        />
        <main className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-6xl mx-auto p-6 pb-24">
            {body}
          </div>
        </main>
      </div>

      {/* Reject modal */}
      {rejecting && (
        <RejectModal
          decision={rejecting}
          onClose={() => setRejectingId(null)}
          onConfirm={handleConfirmReject}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 right-6 z-50 ag-slide-up">
          <div className={`flex items-center gap-2.5 rounded-lg shadow-lg border px-4 py-3 bg-white ${
            toast.kind === "good" ? "border-emerald-200" : toast.kind === "bad" ? "border-red-200" : "border-gray-200"
          }`}>
            <span className={`w-2 h-2 rounded-full ${toast.kind === "good" ? "bg-emerald-500" : toast.kind === "bad" ? "bg-red-500" : "bg-blue-500"}`} />
            <span className="text-sm text-gray-800">{toast.msg}</span>
          </div>
        </div>
      )}
    </div>
  );
}
