"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AnimatedDecisionFlow from "./components/AnimatedDecisionFlow";
import { Icon } from "./components/IconSet";
import { Cmp, ProblemCard, StepCard } from "./components/SectionCards";

export default function LandingPage() {
  const [navScrolled, setNavScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="bg-white text-gray-900" data-screen-label="Landing Page">
      {/* NAV */}
      <header className={`sticky top-0 z-40 transition-colors ${navScrolled ? "bg-white/85 backdrop-blur border-b border-gray-200" : "bg-transparent"}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gray-900 text-white flex items-center justify-center">{Icon.shield("w-4 h-4")}</div>
            <span className="font-semibold tracking-tight">AgentGate</span>
            <span className="ml-2 text-[10px] font-mono uppercase tracking-wider text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">v0.4</span>
          </a>
          <nav className="hidden md:flex items-center gap-7 text-sm text-gray-600">
            <a href="#how" className="hover:text-gray-900">How it works</a>
            <a href="#compare" className="hover:text-gray-900">Comparison</a>
            <a href="#docs" className="hover:text-gray-900">Docs</a>
            <a href="#" className="hover:text-gray-900 inline-flex items-center gap-1.5">{Icon.github("w-4 h-4")} GitHub</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-1.5">
              Demo dashboard {Icon.arrowRight("w-4 h-4")}
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 ag-grid-bg pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-blue-50/70 to-transparent pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="text-center max-w-3xl mx-auto ag-slide-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 mb-6">
              <span className="relative inline-flex w-1.5 h-1.5">
                <span className="absolute inset-0 rounded-full bg-blue-600 ag-pulse-dot text-blue-300" />
                <span className="relative w-1.5 h-1.5 rounded-full bg-blue-600" />
              </span>
              Live on Polygon Amoy · open beta
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05]">
              Your AI agent acts.
              <br />
              <span className="text-blue-600">AgentGate</span> governs.
            </h1>
            <p className="mt-5 text-lg text-gray-600 leading-relaxed max-w-xl mx-auto">
              The authorization boundary between AI reasoning and on-chain execution — with cryptographic proof of every decision.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link href="/dashboard" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg px-5 py-3 shadow-sm transition-colors">
                Try the Demo {Icon.arrowRight("w-4 h-4")}
              </Link>
              <a href="#docs" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 rounded-lg px-5 py-3 border border-gray-200 hover:border-gray-300 bg-white">
                Read the Docs
              </a>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1.5">{Icon.lock("w-4 h-4")} EIP-712 signed</span>
              <span className="inline-flex items-center gap-1.5">{Icon.chain("w-4 h-4")} Anchored on Polygon</span>
              <span className="inline-flex items-center gap-1.5">{Icon.eye("w-4 h-4")} Private by default</span>
            </div>
          </div>

          <div className="mt-12 max-w-2xl mx-auto ag-slide-up" style={{ animationDelay: ".05s" }}>
            <AnimatedDecisionFlow />
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="max-w-2xl">
            <div className="text-xs font-mono uppercase tracking-wider text-blue-600 mb-3">The gap</div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Agents are getting capital. Governance hasn't caught up.</h2>
            <p className="mt-4 text-gray-600 leading-relaxed">DAOs are handing autonomous treasuries to LLMs, and the audit trail stops at a chat log. AgentGate closes the loop.</p>
          </div>
          <div className="mt-10 grid md:grid-cols-3 gap-5">
            <ProblemCard
              icon={Icon.eye("w-5 h-5")}
              title="AI decisions are opaque"
              body="There's no proof of who approved what, or why. A screenshot of a model's reasoning isn't an audit trail — and it doesn't hold up to legal review."
            />
            <ProblemCard
              icon={Icon.lock("w-5 h-5")}
              title="Public chains leak strategy"
              body="On-chain multisigs make every pending decision visible to front-runners and competitors before the human even clicks approve."
            />
            <ProblemCard
              icon={Icon.split("w-5 h-5")}
              title="Approval is disconnected"
              body="Reviewers see the transaction, not the reasoning. Without context, human approval becomes a rubber stamp instead of a control."
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="max-w-6xl mx-auto px-6 py-24">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <div className="text-xs font-mono uppercase tracking-wider text-blue-600 mb-3">How it works</div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Three steps from agent intent to on-chain proof.</h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="font-mono">avg. p95 latency</span>
            <span className="px-2 py-1 rounded-md bg-gray-100 font-mono text-gray-700">218 ms</span>
          </div>
        </div>

        {/* connector line behind cards */}
        <div className="relative">
          <div className="hidden md:block absolute top-12 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent" />
          <div className="grid md:grid-cols-3 gap-5">
            <StepCard
              n="1"
              kicker="capture"
              title="Agent proposes a decision"
              body="The agent emits a structured Governed Decision: action, params, rationale, and a reference to its reasoning trace. Nothing executes yet."
            />
            <StepCard
              n="2"
              kicker="score"
              title="Risk engine scores it"
              body="Policy rules evaluate notional, counterparty, and action type. LOW auto-clears in milliseconds. HIGH is paused and queued for a human."
            />
            <StepCard
              n="3"
              kicker="anchor"
              title="Reviewer signs, chain records"
              body="A reviewer approves or rejects with a written reason. The decision hash is anchored on Polygon, and an execution grant is issued to the agent."
            />
          </div>
        </div>

        {/* Code-style sample */}
        <div className="mt-12 grid md:grid-cols-5 gap-5">
          <div className="md:col-span-3 rounded-xl border border-gray-100 bg-gray-900 text-gray-100 p-5 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 mb-3 text-[11px] font-mono text-gray-400">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400/70"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70"></span>
              <span className="ml-2">decision.json</span>
            </div>
            <pre className="text-[12px] leading-6 font-mono whitespace-pre-wrap">
{`{
  "id": "dec-001",
  "agent_id": "agent-demo-01",
  "action": { "type": "treasury.swap",
              "params": { "from": "ETH", "to": "USDC", "pct": 5 } },
  "rationale_summary": "Reducing ETH concentration risk…",
  "risk": { "level": "high", "score": 0.85 },
  "status": "pending_approval",
  "proposal_hash": "0x9f3a…c7d2"
}`}
            </pre>
          </div>
          <div className="md:col-span-2 rounded-xl border border-gray-100 bg-white p-5 shadow-sm flex flex-col gap-4">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-gray-400">what reviewers see</div>
              <div className="mt-2 text-sm text-gray-900 font-medium">Swap 5% ETH → USDC · ~$150k</div>
              <div className="text-xs text-gray-500 mt-1">agent-demo-01 · 2 min ago</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-red-100 text-red-700">HIGH 0.85</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 inline-flex items-center gap-1">
                <span className="relative w-1.5 h-1.5 inline-flex">
                  <span className="absolute inset-0 rounded-full text-orange-400 ag-pulse-dot" />
                  <span className="relative w-1.5 h-1.5 rounded-full bg-orange-500" />
                </span>
                pending
              </span>
            </div>
            <div className="mt-auto flex gap-2">
              <button className="flex-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md py-2">Approve</button>
              <button className="flex-1 text-xs font-semibold text-red-700 border border-red-200 hover:bg-red-50 rounded-md py-2">Reject</button>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section id="compare" className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="max-w-2xl mb-10">
            <div className="text-xs font-mono uppercase tracking-wider text-blue-600 mb-3">Where it fits</div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Agent observability + multisig safety + policy automation — one layer.</h2>
            <p className="mt-4 text-gray-600">Each existing tool covers one face of the problem. AgentGate is built for the seam.</p>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-gray-400 bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 font-medium">Capability</th>
                  <th className="px-4 py-3 font-medium text-center">
                    <span className="inline-flex items-center gap-1.5 text-blue-600 font-semibold normal-case">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      AgentGate
                    </span>
                  </th>
                  <th className="px-4 py-3 font-medium text-center">LangSmith</th>
                  <th className="px-4 py-3 font-medium text-center">Safe Multisig</th>
                  <th className="px-4 py-3 font-medium text-center">Snapshot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  { row: "Audit Trail", v: [true, true, "partial", false] },
                  { row: "Human Approval", v: [true, false, true, true] },
                  { row: "On-Chain Proof", v: [true, false, true, "partial"] },
                  { row: "Policy Automation", v: [true, false, false, false] },
                  { row: "AI-Native", v: [true, true, false, false] },
                ].map((r) => (
                  <tr key={r.row} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.row}</td>
                    {r.v.map((v, i) => <Cmp key={i} value={v} />)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1.5 mr-4"><span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-50 text-emerald-600">{Icon.check("w-3 h-3")}</span> Native</span>
            <span className="inline-flex items-center gap-1.5 mr-4"><span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-50 text-amber-600">{Icon.dash("w-3 h-3")}</span> Partial</span>
            <span className="inline-flex items-center gap-1.5"><span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-50 text-gray-300">{Icon.dash("w-3 h-3")}</span> Not supported</span>
          </p>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-8 sm:p-10 grid sm:grid-cols-3 gap-8">
          {[
            { n: "45", label: "decisions governed", sub: "across 3 demo orgs" },
            { n: "3", label: "hallucinations caught", sub: "rejected by human reviewers" },
            { n: "100%", label: "audit coverage", sub: "anchored on Polygon Amoy" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">{s.n}</div>
              <div className="mt-1 text-sm font-medium text-gray-900">{s.label}</div>
              <div className="text-xs text-gray-500">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="relative overflow-hidden rounded-2xl bg-gray-900 text-white p-10 sm:p-14">
          <div className="absolute inset-0 opacity-[0.08] ag-grid-bg" />
          <div className="relative max-w-2xl">
            <div className="text-xs font-mono uppercase tracking-wider text-blue-300 mb-3">Not the agent. Not the wallet.</div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">The governance layer in between.</h2>
            <p className="mt-4 text-gray-300 max-w-lg">Spin up a reviewer dashboard against a live demo agent in under a minute. No wallet connect required — we mint you a session.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/dashboard" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg px-5 py-3 shadow-sm">
                Try the Demo {Icon.arrowRight("w-4 h-4")}
              </Link>
              <a href="#docs" className="inline-flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white rounded-lg px-5 py-3 border border-white/15 hover:border-white/30">
                Read the Docs
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gray-900 text-white flex items-center justify-center">{Icon.shield("w-4 h-4")}</div>
            <span className="font-semibold tracking-tight">AgentGate</span>
            <span className="text-sm text-gray-500 ml-3 hidden sm:inline">Not the agent. Not the wallet. The governance layer in between.</span>
          </div>
          <div className="md:ml-auto flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
            <a href="#docs" className="hover:text-gray-900">Docs</a>
            <a href="#" className="hover:text-gray-900 inline-flex items-center gap-1.5">{Icon.github("w-4 h-4")} GitHub</a>
            <Link href="/dashboard" className="hover:text-gray-900">Demo</Link>
            <span className="text-xs text-gray-400 font-mono ml-auto md:ml-0">© 2026 AgentGate Labs</span>
          </div>
        </div>
      </footer>

      <div className="h-16" /> {/* breathing room above floating switcher */}
    </div>
  );
}
