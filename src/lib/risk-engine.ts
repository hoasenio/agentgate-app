import type { DecisionAction, RiskLevel, RiskResult } from "./types";

const HIGH_NOTIONAL_THRESHOLD_USD = 100_000;
const LOW_NOTIONAL_THRESHOLD_USD = 10_000;

const HIGH_RISK_ACTION_TYPES = new Set([
  "treasury.swap",
  "treasury.transfer",
  "governance.vote",
  "contract.deploy",
  "contract.upgrade",
]);

const WHITELISTED_LOW_RISK_TYPES = new Set([
  "treasury.claim",
  "treasury.stake",
  "treasury.harvest",
  "portfolio.rebalance_small",
]);

export function scoreRisk(action: DecisionAction): RiskResult {
  const rules_hit: string[] = [];
  let score = 0;

  const estimatedUsd =
    typeof action.params?.estimated_usd === "number"
      ? action.params.estimated_usd
      : 0;

  // R1: notional above high threshold
  if (estimatedUsd > HIGH_NOTIONAL_THRESHOLD_USD) {
    rules_hit.push("notional_above_threshold");
    score += 0.6;
  }

  // R2: high-risk action type
  if (HIGH_RISK_ACTION_TYPES.has(action.type)) {
    rules_hit.push("action_type_elevated");
    score += 0.3;
  }

  // R3: whitelisted + below low threshold → auto-approve
  const isWhitelisted = WHITELISTED_LOW_RISK_TYPES.has(action.type);
  const belowLowThreshold = estimatedUsd <= LOW_NOTIONAL_THRESHOLD_USD;

  if (isWhitelisted && belowLowThreshold && rules_hit.length === 0) {
    rules_hit.push("whitelisted_low_value");
    score = 0.05;
  }

  score = Math.min(score, 1.0);

  let level: RiskLevel;
  if (score >= 0.6) {
    level = "high";
  } else if (score >= 0.2) {
    level = "medium";
  } else {
    level = "low";
  }

  return { level, score: Math.round(score * 100) / 100, rules_hit };
}

export function shouldAutoApprove(risk: RiskResult): boolean {
  return risk.level === "low";
}
