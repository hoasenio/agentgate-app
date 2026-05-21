import type { PrismaClient } from "@prisma/client";
import { computeProposalHash, computeReasonHash } from "./hash";
import { scoreRisk } from "./risk-engine";
import type { DecisionAction } from "./types";

const ORG_ID = "demo-dao";

// Mock anchor tx hashes (look real, point to nothing — fine for demo)
const MOCK_TX_HASHES = [
  "0xa1b2c3d4e5f6789012345678901234567890123456789012345678901234abcd",
  "0xb2c3d4e5f6789012345678901234567890123456789012345678901234abcde1",
  "0xc3d4e5f6789012345678901234567890123456789012345678901234abcde12f",
  "0xd4e5f6789012345678901234567890123456789012345678901234abcde123fa",
  "0xe5f6789012345678901234567890123456789012345678901234abcde1234fab",
  "0xf6789012345678901234567890123456789012345678901234abcde12345fabc",
  "0x789012345678901234567890123456789012345678901234abcde123456fabcd",
  "0x89012345678901234567890123456789012345678901234abcde1234567abcde",
  "0x9012345678901234567890123456789012345678901234abcde12345678bcdef",
  "0x012345678901234567890123456789012345678901234abcde123456789cdef0",
];

const REVIEWER_ADDRESSES = [
  "0x742d35Cc6634C0532925a3b8D8b4ed14cE9DcAfa",
  "0x8B5b9D5Eb6F4C8e7A2B3F1D9E0c6A7d4F1e2C3b9",
  "0x3F8e2A4d1B7c9E0F2A1B3C4D5E6F7a8B9C0d1E2F",
];

type Spec = {
  agent_id: string;
  action: DecisionAction;
  rationale_summary: string;
  status: "pending_approval" | "approved" | "rejected" | "auto_approved";
  /** Hours ago (relative to "now") */
  hours_ago: number;
  rejection_reason?: string;
};

const SPECS: Spec[] = [
  // -- Recent pending items (top of timeline, live demo interaction) --
  {
    agent_id: "agent-treasury-01",
    action: {
      type: "treasury.swap",
      params: { from: "ETH", to: "USDC", pct: 8, estimated_usd: 240000 },
    },
    rationale_summary:
      "Reducing ETH exposure after the 22% run-up over the past 14 days. On-chain flow analysis shows large CEX inflows from whale wallets — typically precedes 5-10% pullback. Moving 8% to USDC to extend operational runway and rebalance toward our 60/40 target.",
    status: "pending_approval",
    hours_ago: 0.25,
  },
  {
    agent_id: "agent-governance-03",
    action: {
      type: "governance.vote",
      params: {
        proposal_id: "AGGR-047",
        vote: "FOR",
        snapshot_space: "aggr.eth",
        voting_power_usd: 180000,
      },
    },
    rationale_summary:
      "Vote FOR AGGR-047 (Increase Grant Pool to 750k USDC). Analysis: 12 of last 15 quarters under-allocated; current grant utilization is 91%; expected ROI based on funded project performance is 2.3x over 18mo.",
    status: "pending_approval",
    hours_ago: 1.5,
  },
  {
    agent_id: "agent-treasury-01",
    action: {
      type: "treasury.transfer",
      params: {
        to: "0x9eD8...Multisig",
        asset: "USDC",
        amount: 125000,
        estimated_usd: 125000,
      },
    },
    rationale_summary:
      "Quarterly contributor payroll allocation to ops multisig. Matches Q2 budget approved in DAO vote AGGR-031. No new deviation from baseline.",
    status: "pending_approval",
    hours_ago: 4,
  },

  // -- Recent approved (HIGH risk that got human approval) --
  {
    agent_id: "agent-treasury-01",
    action: {
      type: "treasury.swap",
      params: { from: "ETH", to: "USDC", pct: 5, estimated_usd: 150000 },
    },
    rationale_summary:
      "Reducing ETH concentration risk following 15% price run-up. USDC buffer improves 30-day runway by 11 days.",
    status: "approved",
    hours_ago: 18,
  },
  {
    agent_id: "agent-yield-02",
    action: {
      type: "treasury.stake",
      params: {
        protocol: "Lido",
        asset: "ETH",
        amount: 20,
        estimated_usd: 72000,
      },
    },
    rationale_summary:
      "Staking 20 ETH with Lido for ~3.4% APY. Current treasury ETH idle balance is 145 ETH — staking 14% reduces opportunity cost without impacting operational liquidity.",
    status: "approved",
    hours_ago: 28,
  },
  {
    agent_id: "agent-governance-03",
    action: {
      type: "governance.vote",
      params: {
        proposal_id: "UNI-58",
        vote: "AGAINST",
        snapshot_space: "uniswap",
        voting_power_usd: 95000,
      },
    },
    rationale_summary:
      "Vote AGAINST UNI-58 (Fee Switch Activation v2). Risks: triggers regulatory securities classification per recent SEC guidance; modeling shows -8% to -15% TVL outflow in first 30 days.",
    status: "approved",
    hours_ago: 42,
  },
  {
    agent_id: "agent-treasury-01",
    action: {
      type: "treasury.swap",
      params: { from: "USDC", to: "ETH", pct: 3, estimated_usd: 110000 },
    },
    rationale_summary:
      "DCA buy: ETH retraced 12% from recent high, RSI(14) at 38 indicates oversold. Adding 3% to maintain target allocation.",
    status: "approved",
    hours_ago: 65,
  },

  // -- Rejections (with reasons) --
  {
    agent_id: "agent-treasury-01",
    action: {
      type: "treasury.swap",
      params: { from: "ETH", to: "USDC", pct: 15, estimated_usd: 450000 },
    },
    rationale_summary:
      "Defensive rotation: macro indicators suggest 30-day downturn probability at 68%. Rotating 15% ETH → USDC.",
    status: "rejected",
    hours_ago: 11,
    rejection_reason:
      "15% rotation is too aggressive given current vol regime. Macro signal is conflicted (DXY weakening contradicts the agent's read). Cap at 5% max per swap and resubmit with updated rationale.",
  },
  {
    agent_id: "agent-yield-02",
    action: {
      type: "treasury.swap",
      params: {
        from: "USDC",
        to: "WBTC",
        amount: 200000,
        estimated_usd: 200000,
      },
    },
    rationale_summary:
      "Diversifying treasury into BTC. Target allocation: 10% BTC, 50% ETH, 40% stables. Currently 0% BTC.",
    status: "rejected",
    hours_ago: 36,
    rejection_reason:
      "Treasury diversification policy requires DAO vote for any new asset class. WBTC is not currently in the approved-assets registry. Submit a Snapshot proposal first.",
  },
  {
    agent_id: "agent-governance-03",
    action: {
      type: "governance.vote",
      params: {
        proposal_id: "AAVE-211",
        vote: "FOR",
        snapshot_space: "aave.eth",
        voting_power_usd: 80000,
      },
    },
    rationale_summary:
      "Support AAVE-211 (List frxETH as collateral). Frax ecosystem alignment + projected lending revenue uplift.",
    status: "rejected",
    hours_ago: 88,
    rejection_reason:
      "frxETH price oracle is still using a single Chainlink feed without TWAP backup. Counterparty exposure to Frax is already 8% of treasury — adding lending exposure compounds risk. Vote NO or abstain.",
  },

  // -- Auto-approved (LOW risk, no human action) --
  ...generateAutoApproved(),
];

function generateAutoApproved(): Spec[] {
  const types: Array<{
    type: string;
    summary: string;
    paramsFn: () => DecisionAction["params"];
  }> = [
    {
      type: "treasury.claim",
      summary: "Daily Lido staking rewards claim. Routine yield harvest.",
      paramsFn: () => ({
        protocol: "Lido",
        asset: "stETH",
        estimated_usd: 180 + Math.floor(Math.random() * 80),
      }),
    },
    {
      type: "treasury.claim",
      summary: "Aave aUSDC interest sweep. Compounds to USDC treasury wallet.",
      paramsFn: () => ({
        protocol: "Aave v3",
        asset: "aUSDC",
        estimated_usd: 95 + Math.floor(Math.random() * 60),
      }),
    },
    {
      type: "treasury.harvest",
      summary:
        "Convex CRV reward harvest + restake. Auto-compound cycle. No principal movement.",
      paramsFn: () => ({
        protocol: "Convex",
        asset: "CRV",
        estimated_usd: 220 + Math.floor(Math.random() * 150),
      }),
    },
    {
      type: "portfolio.rebalance_small",
      summary:
        "Micro-rebalance: ETH/USDC drifted 0.4% from 60/40 target. Auto-correcting within policy band.",
      paramsFn: () => ({
        from: "ETH",
        to: "USDC",
        pct: 0.4,
        estimated_usd: 4800 + Math.floor(Math.random() * 3000),
      }),
    },
    {
      type: "treasury.stake",
      summary:
        "Rolling 0.5 ETH into Lido stake (auto-cycle, sub-threshold). Maintains target staking ratio.",
      paramsFn: () => ({
        protocol: "Lido",
        asset: "ETH",
        amount: 0.5,
        estimated_usd: 1800,
      }),
    },
  ];

  const specs: Spec[] = [];
  // 20 auto-approved events spread across the past 6 days
  for (let i = 0; i < 20; i++) {
    const t = types[i % types.length];
    specs.push({
      agent_id: i % 3 === 0 ? "agent-treasury-01" : "agent-yield-02",
      action: { type: t.type, params: t.paramsFn() },
      rationale_summary: t.summary,
      status: "auto_approved",
      hours_ago: 2 + i * 7 + Math.random() * 4,
    });
  }
  return specs;
}

function pickTx(seed: number): string {
  return MOCK_TX_HASHES[seed % MOCK_TX_HASHES.length];
}

function pickReviewer(seed: number): string {
  return REVIEWER_ADDRESSES[seed % REVIEWER_ADDRESSES.length];
}

export async function seedDemoData(prisma: PrismaClient): Promise<number> {
  await prisma.decision.deleteMany({ where: { orgId: ORG_ID } });

  const now = Date.now();
  let i = 0;
  for (const spec of SPECS) {
    const createdAt = new Date(now - spec.hours_ago * 3600 * 1000);
    const risk = scoreRisk(spec.action);
    const proposalHash = computeProposalHash({
      org_id: ORG_ID,
      agent_id: spec.agent_id,
      action: spec.action,
      rationale_summary: spec.rationale_summary,
      created_at: createdAt.toISOString(),
    });

    const baseData = {
      orgId: ORG_ID,
      agentId: spec.agent_id,
      action: spec.action as object,
      rationaleSummary: spec.rationale_summary,
      reasoningRef: {
        run_id: `run_${i.toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`,
      },
      riskLevel: risk.level,
      riskScore: risk.score,
      rulesHit: risk.rules_hit,
      proposalHash,
      createdAt,
      updatedAt: createdAt,
    };

    if (spec.status === "approved") {
      const reviewer = pickReviewer(i);
      const approvedAt = new Date(createdAt.getTime() + 90 * 60 * 1000);
      await prisma.decision.create({
        data: {
          ...baseData,
          status: "approved",
          approvals: [
            { approver: reviewer, timestamp: approvedAt.toISOString() },
          ],
          anchorTx: pickTx(i),
          executionGrant: mockGrant({
            decision_id: "filled-on-read",
            status: "approved",
            approver: reviewer,
            anchor_tx: pickTx(i),
            issued_at: approvedAt.toISOString(),
          }),
          updatedAt: approvedAt,
        },
      });
    } else if (spec.status === "rejected") {
      const reviewer = pickReviewer(i);
      const rejectedAt = new Date(createdAt.getTime() + 75 * 60 * 1000);
      const reason = spec.rejection_reason ?? "Insufficient justification.";
      await prisma.decision.create({
        data: {
          ...baseData,
          status: "rejected",
          rejection: {
            rejected_by: reviewer,
            reason,
            reason_hash: computeReasonHash(reason),
            timestamp: rejectedAt.toISOString(),
          },
          rejectionAnchorTx: pickTx(i + 5),
          updatedAt: rejectedAt,
        },
      });
    } else if (spec.status === "auto_approved") {
      await prisma.decision.create({
        data: {
          ...baseData,
          status: "auto_approved",
          anchorTx: pickTx(i),
          executionGrant: mockGrant({
            decision_id: "filled-on-read",
            status: "auto_approved",
            approver: "policy-engine",
            anchor_tx: pickTx(i),
            issued_at: createdAt.toISOString(),
          }),
        },
      });
    } else {
      // pending_approval
      await prisma.decision.create({
        data: {
          ...baseData,
          status: "pending_approval",
        },
      });
    }
    i++;
  }

  return SPECS.length;
}

function mockGrant(params: {
  decision_id: string;
  status: string;
  approver: string;
  anchor_tx: string;
  issued_at: string;
}) {
  const issued = new Date(params.issued_at);
  return {
    token: `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify(params)).toString("base64url").slice(0, 80)}.mock-signature-not-verified`,
    decision_id: params.decision_id,
    status: params.status,
    approver: params.approver,
    anchor_tx: params.anchor_tx,
    issued_at: params.issued_at,
    expires_at: new Date(issued.getTime() + 60 * 60 * 1000).toISOString(),
  };
}
