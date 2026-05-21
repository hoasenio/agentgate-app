"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { RiskBadge, StatusBadge } from "@/components/shared/DecisionUi";
import { sendAgentChat, getDecision } from "@/services/api/agent";
import { getMe } from "@/services/api/me";
import { getAnchorReceipt } from "@/services/api/chain";
import agentGateLogo from "@/assets/AgentGate-logo.png";

function shortAddr(addr) {
  if (!addr || addr.length < 10) return null;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

const QUICK_PROMPTS = [
  {
    label: "HIGH · Large rebalance",
    text:
      "Rebalance 8% of our ETH treasury into USDC. Recent on-chain whale outflow data suggests a 5-10% correction is likely in the next 14 days.",
  },
  {
    label: "MEDIUM · Governance vote",
    text:
      "Vote FOR Snapshot proposal AGGR-047 (increase grant pool to 750k USDC). Last 12 quarters were under-allocated and current utilization is 91%.",
  },
  {
    label: "LOW · Claim rewards",
    text: "Claim our daily Lido staking rewards.",
  },
  {
    label: "LOW · Micro-rebalance",
    text:
      "Auto-correct the ETH/USDC drift back to 60/40 — we're 0.4% off target.",
  },
];

const AGENT_ID = "agent-treasury-01";
const ORG_ID = "demo-dao";

const TERMINAL_STATUSES = new Set(["approved", "rejected", "auto_approved"]);

export default function AgentChatPage() {
  const [messages, setMessages] = useState([
    {
      role: "agent",
      kind: "text",
      content:
        "Hi. I'm your treasury operations agent. Tell me what you'd like me to do — I'll draft a structured proposal and run it through AgentGate before executing anything.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [activeDecisionId, setActiveDecisionId] = useState(null);
  const [activeDecision, setActiveDecision] = useState(null);
  const [shareUrl, setShareUrl] = useState(null);
  const [model, setModel] = useState(null);
  const [agentAddr, setAgentAddr] = useState(null);
  const [reviewerAddr, setReviewerAddr] = useState(null);
  const logRef = useRef(null);

  useEffect(() => {
    let active = true;
    getMe()
      .then((d) => {
        if (!active) return;
        if (d?.agent_address) setAgentAddr(d.agent_address);
        if (d?.reviewer_address) setReviewerAddr(d.reviewer_address);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages, activeDecision]);

  // Poll the active decision until it reaches a terminal status
  useEffect(() => {
    if (!activeDecisionId || !activeDecision) return;
    if (TERMINAL_STATUSES.has(activeDecision.status)) return;

    let stop = false;
    const tick = async () => {
      if (stop) return;
      try {
        const fresh = await getDecision(activeDecisionId);
        if (stop) return;
        setActiveDecision(fresh);
        if (TERMINAL_STATUSES.has(fresh.status)) {
          appendTerminalMessage(fresh);
          return;
        }
      } catch (err) {
        console.warn("poll failed", err);
      }
      setTimeout(tick, 1500);
    };
    const handle = setTimeout(tick, 1500);
    return () => {
      stop = true;
      clearTimeout(handle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDecisionId, activeDecision?.status]);

  function appendTerminalMessage(decision) {
    if (decision.status === "approved") {
      setMessages((m) => [
        ...m,
        {
          role: "agent",
          kind: "text",
          content: `✅ Cleared for execution. ${decision.approvals?.[0]?.approver ?? "Reviewer"} approved at ${new Date(decision.updated_at).toLocaleTimeString()}. Execution grant (JWT) issued${decision.anchor_tx ? `, anchor tx ${decision.anchor_tx.slice(0, 14)}…` : ""}.`,
        },
      ]);
    } else if (decision.status === "rejected") {
      setMessages((m) => [
        ...m,
        {
          role: "agent",
          kind: "text",
          content: `❌ Rejected by ${decision.rejection?.rejected_by ?? "reviewer"}. Reason: "${decision.rejection?.reason}". I won't execute. Submitting feedback to refine future proposals.`,
        },
      ]);
    } else if (decision.status === "auto_approved") {
      setMessages((m) => [
        ...m,
        {
          role: "agent",
          kind: "text",
          content: `⚡ Auto-approved by policy (LOW risk). Executing now. Execution grant issued${decision.anchor_tx ? `, anchor tx ${decision.anchor_tx.slice(0, 14)}…` : ""}.`,
        },
      ]);
    }
  }

  async function send(textOverride) {
    const text = (textOverride ?? input).trim();
    if (!text || busy) return;
    setError(null);
    setBusy(true);
    setInput("");
    setMessages((m) => [...m, { role: "user", kind: "text", content: text }]);
    setMessages((m) => [
      ...m,
      { role: "agent", kind: "thinking", content: "Drafting proposal…" },
    ]);

    try {
      const result = await sendAgentChat({
        prompt: text,
        agent_id: AGENT_ID,
        org_id: ORG_ID,
      });
      // Remove the thinking placeholder
      setMessages((m) => m.filter((x) => x.kind !== "thinking"));

      if (result.refused) {
        setMessages((m) => [
          ...m,
          { role: "agent", kind: "refusal", content: result.agent_message },
        ]);
        setShareUrl(result.langsmith_share_url);
        setModel(result.model);
        return;
      }

      setMessages((m) => [
        ...m,
        { role: "agent", kind: "text", content: result.agent_message },
      ]);
      setActiveDecisionId(result.decision.id);
      setActiveDecision(result.decision);
      setShareUrl(result.langsmith_share_url);
      setModel(result.model);
    } catch (e) {
      setMessages((m) => m.filter((x) => x.kind !== "thinking"));
      setError(e.message ?? "Agent failed");
    } finally {
      setBusy(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src={agentGateLogo}
              alt="AgentGate logo"
              width={28}
              height={28}
              className="w-7 h-7 rounded-md object-cover"
            />
            <span className="font-semibold tracking-tight">AgentGate</span>
            <span className="ml-2 text-[10px] font-mono uppercase tracking-wider text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">Agent</span>
          </Link>
          <div className="flex items-center gap-3">
            {agentAddr && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-gray-500">Agent</span>
                <span className="font-mono text-gray-800">{shortAddr(agentAddr)}</span>
              </span>
            )}
            <Link href="/dashboard" className="text-sm font-medium text-gray-700 hover:text-gray-900">
              Open Reviewer Dashboard →
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 grid lg:grid-cols-[1fr_360px] gap-6">
        {/* CHAT COLUMN */}
        <section className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col h-[calc(100vh-9rem)] min-h-[560px]">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Treasury Operations Agent</div>
              <div className="text-xs text-gray-500 font-mono">
                {AGENT_ID} · {ORG_ID}
                {reviewerAddr && (
                  <>
                    {" · reviewer "}
                    <span className="text-gray-700">{shortAddr(reviewerAddr)}</span>
                  </>
                )}
              </div>
            </div>
            {model && (
              <div className="text-[11px] font-mono text-gray-500 bg-gray-50 border border-gray-200 rounded px-2 py-1">
                {model}
              </div>
            )}
          </div>

          <div ref={logRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {messages.map((m, i) => (
              <Bubble key={i} m={m} />
            ))}
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 ag-step-in">
                {error}
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 p-3">
            <div className="flex flex-wrap gap-2 mb-2">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q.label}
                  onClick={() => send(q.text)}
                  disabled={busy}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50 transition-colors"
                >
                  {q.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <textarea
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                disabled={busy}
                placeholder="e.g. Rebalance 5% of ETH treasury into USDC…"
                className="flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
              />
              <button
                onClick={() => send()}
                disabled={busy || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg px-4 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {busy ? "…" : "Send"}
              </button>
            </div>
          </div>
        </section>

        {/* DECISION PANEL */}
        <aside className="space-y-4">
          <DecisionStatusPanel
            decision={activeDecision}
            shareUrl={shareUrl}
          />
          <AnchoredCard decision={activeDecision} />
          <InstructionsPanel />
        </aside>
      </main>
    </div>
  );
}

function Bubble({ m }) {
  if (m.role === "user") {
    return (
      <div className="flex justify-end ag-step-in">
        <div className="max-w-[80%] bg-blue-600 text-white rounded-2xl rounded-br-sm px-4 py-2 text-sm leading-relaxed">
          {m.content}
        </div>
      </div>
    );
  }
  if (m.kind === "thinking") {
    return (
      <div className="flex justify-start ag-step-in">
        <div className="bg-gray-100 text-gray-500 rounded-2xl rounded-bl-sm px-4 py-2 text-sm italic">
          <span className="inline-flex items-center gap-2">
            <span className="relative inline-flex w-1.5 h-1.5">
              <span className="absolute inset-0 rounded-full bg-gray-400 ag-pulse-dot text-gray-300" />
              <span className="relative w-1.5 h-1.5 rounded-full bg-gray-500" />
            </span>
            {m.content}
          </span>
        </div>
      </div>
    );
  }
  if (m.kind === "refusal") {
    return (
      <div className="flex justify-start ag-step-in">
        <div className="max-w-[85%] bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed">
          <div className="flex items-center gap-1.5 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-700">
            <span>🛡️</span>
            <span>Out of scope · policy guardrail</span>
          </div>
          <div className="whitespace-pre-wrap">{m.content}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start ag-step-in">
      <div className="max-w-[85%] bg-gray-100 text-gray-900 rounded-2xl rounded-bl-sm px-4 py-2 text-sm leading-relaxed whitespace-pre-wrap">
        {m.content}
      </div>
    </div>
  );
}

function DecisionStatusPanel({ decision, shareUrl }) {
  if (!decision) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">Active Decision</div>
        <div className="text-sm text-gray-500">No proposal in flight. Send a prompt to draft one.</div>
      </div>
    );
  }
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-mono uppercase tracking-wider text-gray-400">Active Decision</div>
        <StatusBadge status={decision.status} />
      </div>
      <div className="text-sm font-semibold text-gray-900 break-all">
        {decision.action.type}
      </div>
      <div className="text-[11px] font-mono text-gray-500 break-all">
        {decision.id}
      </div>
      <div className="flex items-center gap-2">
        <RiskBadge level={decision.risk.level} score={decision.risk.score} withScore />
        {decision.risk.rules_hit?.map((r) => (
          <span key={r} className="text-[10px] font-mono text-gray-500 bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5">
            {r}
          </span>
        ))}
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">
        {decision.rationale_summary}
      </p>
      {decision.status === "pending_approval" && (
        <div className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded px-2 py-1.5">
          ⏳ Awaiting reviewer in the dashboard.
        </div>
      )}
      {decision.execution_grant?.token && (
        <details className="text-xs">
          <summary className="cursor-pointer text-blue-600 font-medium">View execution grant (JWT)</summary>
          <pre className="mt-2 bg-gray-900 text-green-400 rounded p-2 font-mono text-[10px] whitespace-pre-wrap break-all">{decision.execution_grant.token}</pre>
        </details>
      )}
      {(shareUrl || decision.reasoning_ref?.share_url) && (
        <a
          href={shareUrl ?? decision.reasoning_ref?.share_url}
          target="_blank"
          rel="noreferrer"
          className="block text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          ↗ View AI reasoning trace (LangSmith)
        </a>
      )}
    </div>
  );
}

function AnchoredCard({ decision }) {
  const [receipt, setReceipt] = useState(null);
  const [fetching, setFetching] = useState(false);
  const baseExplorer =
    process.env.NEXT_PUBLIC_BASE_EXPLORER ?? "https://testnet.snowtrace.io";

  useEffect(() => {
    if (!decision?.anchor_tx) {
      setReceipt(null);
      return;
    }
    setFetching(true);
    let active = true;
    getAnchorReceipt(decision.anchor_tx)
      .then((r) => {
        if (active) setReceipt(r);
      })
      .catch(() => {})
      .finally(() => active && setFetching(false));
    return () => {
      active = false;
    };
  }, [decision?.anchor_tx]);

  if (!decision?.anchor_tx) return null;

  const tx = decision.anchor_tx;
  const shortTx = `${tx.slice(0, 10)}…${tx.slice(-8)}`;
  const gasUsed = receipt?.gas_used ? Number(receipt.gas_used).toLocaleString() : null;
  const block = receipt?.block_number;
  const age = receipt?.timestamp
    ? Math.max(0, Math.floor(Date.now() / 1000 - receipt.timestamp))
    : null;

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-blue-50 border-2 border-emerald-200 rounded-xl p-4 space-y-3 ag-slide-up shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-lg">🔗</span>
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-700">Anchored on-chain</div>
          <div className="text-sm font-bold text-emerald-900">Avalanche Fuji</div>
        </div>
        <div className="ml-auto">
          {fetching && !receipt ? (
            <span className="text-[10px] font-mono text-gray-500">confirming…</span>
          ) : receipt?.status === "success" ? (
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 border border-emerald-200 rounded px-1.5 py-0.5">
              ✓ confirmed
            </span>
          ) : null}
        </div>
      </div>

      <div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-0.5">tx hash</div>
        <div className="font-mono text-xs text-gray-900 break-all bg-white/60 rounded px-2 py-1 border border-emerald-100">
          {shortTx}
        </div>
      </div>

      {(block || gasUsed || age !== null) && (
        <div className="grid grid-cols-3 gap-2 text-center">
          {block && (
            <div className="bg-white/60 rounded px-2 py-1.5 border border-emerald-100">
              <div className="text-[9px] font-mono uppercase tracking-wider text-gray-500">block</div>
              <div className="text-xs font-mono font-semibold text-gray-900">#{block.toLocaleString()}</div>
            </div>
          )}
          {gasUsed && (
            <div className="bg-white/60 rounded px-2 py-1.5 border border-emerald-100">
              <div className="text-[9px] font-mono uppercase tracking-wider text-gray-500">gas</div>
              <div className="text-xs font-mono font-semibold text-gray-900">{gasUsed}</div>
            </div>
          )}
          {age !== null && (
            <div className="bg-white/60 rounded px-2 py-1.5 border border-emerald-100">
              <div className="text-[9px] font-mono uppercase tracking-wider text-gray-500">age</div>
              <div className="text-xs font-mono font-semibold text-gray-900">{age}s</div>
            </div>
          )}
        </div>
      )}

      <a
        href={`${baseExplorer}/tx/${tx}`}
        target="_blank"
        rel="noreferrer"
        className="block text-center bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg py-2.5 transition-colors"
      >
        View on Snowtrace ↗
      </a>
    </div>
  );
}

function InstructionsPanel() {
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-900 leading-relaxed">
      <div className="font-semibold mb-1">Live demo flow</div>
      <ol className="list-decimal list-inside space-y-1">
        <li>Send a prompt above. The agent calls an LLM to draft a structured proposal.</li>
        <li>The proposal is submitted to AgentGate, scored by the risk engine.</li>
        <li>HIGH/MEDIUM → human reviewer must approve in the dashboard.</li>
        <li>On approval, hash is anchored on Avalanche Fuji and a JWT grant is issued.</li>
      </ol>
    </div>
  );
}
