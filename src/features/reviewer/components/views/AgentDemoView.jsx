import { Panel, RiskBadge, StatusBadge } from "@/components/shared/DecisionUi";
import { actionSummary } from "../../utils/formatters";

export default function AgentDemoView({ decisions, onView }) {
  const pending = decisions.find((d) => d.status === "pending_approval");
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">Agent UI Demo</h1>
        <p className="text-sm text-gray-500">A reference view of what the agent sees when it asks AgentGate for an execution grant.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="agent.proposeDecision()">
          <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-[12px] leading-6 font-mono whitespace-pre-wrap overflow-x-auto">
{`const grant = await agentGate.propose({
  agent_id: "agent-demo-01",
  org_id: "demo-dao",
  action: {
    type: "treasury.swap",
    params: { from: "ETH", to: "USDC", pct: 5 }
  },
  rationale_summary: "Reducing ETH concentration risk…",
  reasoning_ref: { run_id: ctx.run_id }
});

if (grant.cleared) {
  await execute(grant.signed_payload);
} else {
  await waitForReview(grant.decision_id);
}`}
          </pre>
        </Panel>
        <Panel title="Live: latest pending decision">
          {pending ? (
            <div>
              <div className="text-sm font-semibold text-gray-900">{actionSummary(pending)}</div>
              <div className="mt-1 text-xs text-gray-500 font-mono">{pending.id} · {pending.proposal_hash}</div>
              <div className="mt-4 flex items-center gap-2">
                <RiskBadge level={pending.risk.level} score={pending.risk.score} withScore />
                <StatusBadge status={pending.status} />
              </div>
              <p className="mt-4 text-sm text-gray-700 leading-relaxed">{pending.rationale_summary}</p>
              <button
                onClick={() => onView(pending.id)}
                className="mt-5 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg px-4 py-2"
              >
                Open in reviewer
              </button>
            </div>
          ) : (
            <div className="text-sm text-gray-500">No pending decisions. The agent is waiting for new context.</div>
          )}
        </Panel>
      </div>
    </div>
  );
}

/* ---------- Root ---------- */
