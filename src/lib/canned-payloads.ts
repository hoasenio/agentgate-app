import type { ProposeInput } from "./types";

export const CANNED_HIGH: ProposeInput = {
  agent_id: "agent-demo-01",
  org_id: "demo-dao",
  action: {
    type: "treasury.swap",
    params: {
      from: "ETH",
      to: "USDC",
      pct: 5,
      estimated_usd: 150000,
    },
  },
  rationale_summary:
    "Reducing ETH concentration risk following a 15% price run-up over the past 30 days. A USDC buffer improves 30-day operational runway and hedges against short-term volatility.",
};

export const CANNED_LOW: ProposeInput = {
  agent_id: "agent-demo-01",
  org_id: "demo-dao",
  action: {
    type: "treasury.claim",
    params: {
      protocol: "Lido",
      asset: "stETH",
      estimated_usd: 200,
    },
  },
  rationale_summary:
    "Routine daily staking reward claim from Lido. No market exposure change. Estimated yield: ~0.013% daily.",
};
