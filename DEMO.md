# AgentGate — Demo Runbook

For the 60-90s judge walkthrough. Maps to PRD §D (Flows 1–4) and §Hackathon Demo Script.

---

## Setup (do once before the demo starts)

1. Make sure dev server is up: `npm run dev -- --port 3333`
2. Confirm `.env.local` has: `DATABASE_URL`, `OPENROUTER_API_KEY`, `RPC_URL`, `DEPLOYER_PRIVATE_KEY`, `AUDIT_LOGGER_ADDRESS`, and (optional) `LANGSMITH_API_KEY`.
3. Open two browser tabs side-by-side:
   - **Left:** `http://localhost:3333/agent` (Agent chat)
   - **Right:** `http://localhost:3333/dashboard` (Reviewer dashboard)
4. (Optional) Reset to fresh seed: `curl -X POST http://localhost:3333/api/v1/demo/reset` — drops + reseeds 30 mock decisions in <2s.

---

## The 30-Second Linear Flow (start here)

Follow these steps in order. Nothing else.

1. **Left tab.** Click the button labeled **HIGH · Large rebalance**.
   → A chat bubble appears, then the right-side panel shows a **Pending** badge.

2. **Right tab.** Within ~2s, a new row appears at the top of the timeline with a red HIGH badge.

3. **Right tab.** Click that new row. Then click the green **Approve** button.

4. **Left tab.** Within ~1.5s, status flips to **Approved** and a new bubble appears: "✅ Cleared for execution… anchor tx 0x…"

That's the demo. ~30 seconds.

---

## The Full PRD Script (60–90s)

Maps to PRD §Hackathon Demo Script.

| # | Window | Action | What judges see |
|---|---|---|---|
| 1 | Agent | Click **HIGH · Large rebalance** | "I've drafted a `treasury.swap` proposal ($240k, risk: **HIGH**)…" |
| 2 | Agent | Right panel | Status: **Pending** + "⏳ Awaiting reviewer" |
| 3 | Dashboard | Watch timeline | New row appears within 2s |
| 4 | Dashboard | Click the row | Detail view: rationale, HIGH badge, rules_hit chips (`notional_above_threshold`, `action_type_elevated`), optional **View Trace ↗** to LangSmith |
| 5 | Dashboard | Click **Approve** | Toast: "Approved · anchor tx submitted to Avalanche" |
| 6 | Agent | Watch | Status flips to **Approved** + bubble: "✅ Cleared for execution… anchor tx 0x…" + expandable "View execution grant (JWT)" |
| 7 *(bonus +20s)* | Agent | Click **LOW · Claim rewards** | Instantly: "⚡ Auto-approved by policy. Executing now." No human touch needed |

---

## Quick-Prompt Buttons (in the agent UI)

| Button | Risk | What it proves |
|---|---|---|
| **HIGH · Large rebalance** | high | R1 ($240k > $100k) + R2 (treasury.swap) → score ≈ 0.9 |
| **MEDIUM · Governance vote** | medium | R2 only (governance.vote, no notional) → score ≈ 0.3 → pending |
| **LOW · Claim rewards** | low | R3 (treasury.claim whitelisted, ~$200) → auto-approve |
| **LOW · Micro-rebalance** | low | R3 (portfolio.rebalance_small, < $10k) → auto-approve |

---

## Override Flow (PRD §D.5 — proves humans aren't rubber-stamping)

1. **Agent tab.** Click **HIGH · Large rebalance**.
2. **Dashboard tab.** Click the new pending row.
3. Click **Reject** → modal opens with required reason textarea.
4. Type something specific: *"15% rotation too aggressive given current vol regime. Cap at 5% max and resubmit with updated rationale."*
5. Click **Confirm Reject** → toast: "Rejection recorded · reason anchored on-chain".
6. **Agent tab.** Updates: "❌ Rejected by reviewer. Reason: '…'. I won't execute."

---

## Free-Type Prompts (for when judges want to see real LLM intelligence)

These exercise the LLM's English → structured-action mapping:

| Prompt | Mapped action | Risk |
|---|---|---|
| *"It's payroll Friday — send 125k USDC to the ops multisig"* | `treasury.transfer` $125k | **HIGH** |
| *"Vote NO on UNI-58, the fee switch will trigger SEC scrutiny"* | `governance.vote` | **MEDIUM** |
| *"Harvest and restake the Convex CRV rewards"* | `treasury.harvest` ~$200 | **LOW (auto)** |
| *"Deploy our new vault contract to mainnet"* | `contract.deploy` | **HIGH** |
| *"Stake 50 ETH with Lido"* | `treasury.stake` ~$180k | **HIGH** (R1 notional) |
| *"Stake 0.5 ETH with Lido"* | `treasury.stake` ~$1.8k | **LOW (auto)** |

**The killer pair** = the last two. Same action type, different amounts → different policy outcomes. Proves the risk engine isn't a dumb type whitelist.

---

## Audit Timeline View (PRD §D.3)

After running a few flows, switch to dashboard → **Stats** view. You'll see:
- Total / Auto-approved / Human-approved / Rejected counts
- Per-agent breakdown
- Click any historical row → full detail + Snowtrace link

Use this to tell the "compounding reputation" story (PRD §D.3).

---

## Reset Between Demos

```bash
curl -X POST http://localhost:3333/api/v1/demo/reset
```

Clears + reseeds the 30 mock decisions in <2s. PRD §FR-12 + §US-22 (target <5s).

To clear only without reseeding (empty timeline):
```bash
curl -X POST 'http://localhost:3333/api/v1/demo/reset?seed=false'
```

---

## If Something Breaks Mid-Demo

| Symptom | Fix |
|---|---|
| Agent bubble shows "LLM error" | OpenRouter key/credit issue — fall back to `curl -X POST 'http://localhost:3333/api/v1/decisions/propose?canned=high'` to bypass LLM |
| Timeline shows API-unavailable toast | Dashboard auto-falls-back to its own seed data — demo still continues |
| Anchor tx is `null` after approve | `RPC_URL` / `DEPLOYER_PRIVATE_KEY` / `AUDIT_LOGGER_ADDRESS` not set, or wallet out of test AVAX. Demo flow still completes; just no Snowtrace link |
| Dev server died | `npm run dev -- --port 3333` |

---

## Talking Points (one-liners for each beat)

- **When HIGH appears:** *"The agent doesn't execute — it asks for permission first. The proposal is captured as a Governed Decision Object with cryptographic hash."*
- **When showing the dashboard row:** *"This is what a human reviewer sees. AI rationale + risk score + which policy rules fired."*
- **When clicking Approve:** *"The hash gets anchored on Avalanche Fuji. The agent receives a signed JWT execution grant — 1 hour TTL."*
- **When the LOW path runs:** *"Not every action needs a human. Policy whitelist + threshold = auto-approval. The audit hash is still anchored."*
- **When rejecting:** *"Every override is on-chain. The rejection reason hash is immutable. This is the dataset agents learn from."*
