import { useEffect, useState } from "react";

const SCENARIOS = [
  {
    id: "s1",
    accent: "red",
    dotCls: "bg-red-500",
    borderCls: "border-red-500",
    chips: [{ label: "HIGH RISK", cls: "bg-red-100 text-red-700" }],
    steps: [
      {
        icon: "🤖",
        title: "Agent proposes",
        body: <>&quot;Rebalance 5% ETH → USDC · est. $150k&quot;</>,
      },
      {
        icon: "⚖️",
        title: "Risk engine: HIGH",
        body: (
          <>
            <RuleChip>notional_above_threshold</RuleChip>
            <span className="mx-1.5 text-gray-400">·</span>
            <RuleChip>action_type_swap</RuleChip>
            <span className="mx-1.5 text-gray-400">·</span>
            score <span className="font-mono">0.85</span>
          </>
        ),
        badge: { label: "pending_approval", cls: "bg-orange-100 text-orange-700", pulse: true, pulseCls: "bg-orange-500 text-orange-400" },
      },
      {
        icon: "🔗",
        title: "Oracle verifies",
        body: (
          <>
            Chainlink ETH/USD <span className="font-mono">$3,240.50</span> · verified notional{" "}
            <strong className="text-gray-900">$162,025</strong>
          </>
        ),
        badge: { label: "Verified ✓", cls: "bg-emerald-100 text-emerald-700" },
      },
      {
        icon: "👤",
        title: "Treasury lead reviews",
        body: <>reads rationale · sees HIGH badge · Chainlink-verified $162k</>,
      },
      {
        icon: "✅",
        title: "Approved",
        body: <>status flips green · <em>&quot;Execution grant issued&quot;</em></>,
        badge: { label: "approved", cls: "bg-green-100 text-green-700" },
      },
      {
        icon: "⛓️",
        title: "Anchored on-chain",
        body: (
          <>
            <span className="font-mono">0x9f3a…c7d2</span> on Polygon Amoy
          </>
        ),
        badge: { label: "PolygonScan ↗", cls: "bg-blue-100 text-blue-700" },
      },
    ],
  },
  {
    id: "s2",
    accent: "amber",
    dotCls: "bg-amber-500",
    borderCls: "border-amber-500",
    chips: [
      { label: "HIGH RISK", cls: "bg-red-100 text-red-700" },
      { label: "⚠ Discrepancy", cls: "bg-amber-100 text-amber-700" },
    ],
    steps: [
      {
        icon: "🤖",
        title: "Agent proposes",
        body: <>&quot;Re-enter ETH — up 15% this week, strong momentum&quot;</>,
      },
      {
        icon: "⚖️",
        title: "Risk engine: HIGH",
        body: (
          <>
            <RuleChip>notional_above_threshold</RuleChip>
            <span className="mx-1.5 text-gray-400">·</span>
            <RuleChip tone="amber">oracle_discrepancy +12%</RuleChip>
            <span className="mx-1.5 text-gray-400">·</span>
            score <span className="font-mono">0.88</span>
          </>
        ),
      },
      {
        icon: "⚠️",
        title: "Oracle disputes rationale",
        body: (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-sm text-amber-800 mt-1">
            Agent claimed ETH <strong>+15%</strong> · Oracle: ETH <strong>–3%</strong> this week
          </div>
        ),
        alarm: true,
      },
      {
        icon: "👤",
        title: "Treasury lead reviews",
        body: <>sees ⚠ warning · rationale contradicted by on-chain data</>,
      },
      {
        icon: "❌",
        title: "Rejected",
        body: <>&quot;ETH is down 3% per oracle — agent claimed +15%. Hallucination.&quot;</>,
        badge: { label: "rejected", cls: "bg-red-100 text-red-700" },
      },
      {
        icon: "🧪",
        title: "Added to eval dataset",
        body: (
          <>
            failure type <RuleChip tone="red">Hallucination</RuleChip>
            <span className="mx-1.5 text-gray-400">·</span>
            LangSmith <RuleChip>hallucination_catches</RuleChip> updated · rejection hash anchored
          </>
        ),
      },
    ],
  },
  {
    id: "s3",
    accent: "emerald",
    dotCls: "bg-emerald-500",
    borderCls: "border-emerald-500",
    chips: [{ label: "LOW RISK", cls: "bg-emerald-100 text-emerald-700" }],
    steps: [
      {
        icon: "🤖",
        title: "Agent proposes",
        body: <>&quot;Claim daily Lido staking rewards · ~$420&quot;</>,
      },
      {
        icon: "⚖️",
        title: "Risk engine: LOW",
        body: (
          <>
            <RuleChip tone="emerald">whitelisted_action</RuleChip>
            <span className="mx-1.5 text-gray-400">·</span>
            <RuleChip tone="emerald">below_threshold</RuleChip>
            <span className="mx-1.5 text-gray-400">·</span>
            score <span className="font-mono">0.08</span>
          </>
        ),
      },
      {
        icon: "✅",
        title: "Auto-approved by policy",
        body: <>&quot;No human review required&quot; — execution grant issued instantly</>,
        badge: { label: "auto_approved", cls: "bg-blue-100 text-blue-700" },
      },
      {
        icon: "⛓️",
        title: "Still anchored on-chain",
        body: <>&quot;Every decision leaves a trail — even automated ones&quot;</>,
      },
    ],
  },
];

function RuleChip({ children, tone }) {
  const toneCls = tone === "amber"
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : tone === "red"
    ? "bg-red-50 text-red-700 border-red-200"
    : tone === "emerald"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-gray-100 text-gray-700 border-gray-200";
  return (
    <span className={`inline-flex items-center font-mono text-[11px] px-1.5 py-0.5 rounded border ${toneCls}`}>
      {children}
    </span>
  );
}

function StepRow({ step, isActive, borderCls, animKey }) {
  return (
    <div
      key={animKey}
      className={`ag-step-in flex gap-3 py-3 pl-4 pr-3 rounded-lg border-l-4 transition-opacity duration-200 ${
        isActive
          ? `${borderCls} bg-gray-50/40 opacity-100 ${step.alarm ? "ag-alarm" : ""}`
          : "border-transparent opacity-60"
      }`}
    >
      <div className="text-xl shrink-0 leading-none mt-0.5" aria-hidden="true">{step.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-sm font-semibold text-gray-900">{step.title}</div>
          {step.badge && (
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold ${step.badge.cls}`}>
              {step.badge.pulse && (
                <span className="relative inline-flex w-1.5 h-1.5">
                  <span className={`absolute inset-0 rounded-full ag-pulse-dot ${step.badge.pulseCls || ""}`} />
                  <span className="relative w-1.5 h-1.5 rounded-full bg-current" />
                </span>
              )}
              {step.badge.label}
            </span>
          )}
        </div>
        <div className="text-sm text-gray-600 mt-1 leading-relaxed">{step.body}</div>
      </div>
    </div>
  );
}

export default function AnimatedDecisionFlow() {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  // phase: "playing" | "fading"
  const [phase, setPhase] = useState("playing");

  const scenario = SCENARIOS[scenarioIdx];

  useEffect(() => {
    const isLast = stepIdx >= scenario.steps.length - 1;
    if (!isLast) {
      const t = setTimeout(() => setStepIdx((s) => s + 1), 1800);
      return () => clearTimeout(t);
    }
    // last step: hold 3s, fade out, then advance to next scenario.
    // NOTE: do NOT include `phase` in deps — the cleanup on a phase change
    // would otherwise kill the pending flip timer before it can fire.
    const tHold = setTimeout(() => setPhase("fading"), 3000);
    const tFlip = setTimeout(() => {
      setScenarioIdx((s) => (s + 1) % SCENARIOS.length);
      setStepIdx(0);
      setPhase("playing");
    }, 3000 + 320);
    return () => { clearTimeout(tHold); clearTimeout(tFlip); };
  }, [scenarioIdx, stepIdx, scenario.steps.length]);

  const jumpTo = (i) => {
    if (i === scenarioIdx) return;
    setScenarioIdx(i);
    setStepIdx(0);
    setPhase("playing");
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-gray-400 uppercase tracking-widest">Live governance loop · auto-playing</span>
        </div>
        <div className="text-[11px] font-mono text-gray-400">
          {String(scenarioIdx + 1).padStart(2, "0")} / {String(SCENARIOS.length).padStart(2, "0")}
        </div>
      </div>

      {/* Scenario body — fades as a whole during transition */}
      <div className={phase === "fading" ? "ag-fade-out" : "ag-fade-in"}>
        {/* Scenario header */}
        <div key={`hdr-${scenario.id}`} className="ag-header-in flex items-center gap-2 mb-4 flex-wrap">
          {scenario.chips.map((c) => (
            <span key={c.label} className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.cls}`}>
              {c.label}
            </span>
          ))}
          <span className="ml-auto text-[11px] font-mono uppercase tracking-wider text-gray-400">
            step {stepIdx + 1} / {scenario.steps.length}
          </span>
        </div>

        {/* Progress rail */}
        <div className="flex gap-1.5 mb-4">
          {scenario.steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                i <= stepIdx ? scenario.dotCls : "bg-gray-100"
              }`}
            />
          ))}
        </div>

        {/* Steps */}
        <div className="space-y-1.5 min-h-[360px]">
          {scenario.steps.slice(0, stepIdx + 1).map((step, i) => (
            <StepRow
              key={`${scenario.id}-${i}`}
              animKey={`${scenario.id}-${i}`}
              step={step}
              isActive={i === stepIdx}
              borderCls={scenario.borderCls}
            />
          ))}
        </div>
      </div>

      {/* Scenario dots */}
      <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {SCENARIOS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => jumpTo(i)}
              aria-label={`Scenario ${i + 1}`}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === scenarioIdx ? `${s.dotCls} scale-110` : "bg-gray-200 hover:bg-gray-300"
              }`}
            />
          ))}
          <span className="ml-2 text-xs text-gray-500">
            {scenarioIdx === 0 && "High risk → human approves"}
            {scenarioIdx === 1 && "Hallucination caught → rejected"}
            {scenarioIdx === 2 && "Low risk → auto-approved"}
          </span>
        </div>
        <div className="text-[11px] font-mono text-gray-400">v0.4 · amoy testnet</div>
      </div>
    </div>
  );
}

/* ---------- Sections ---------- */
