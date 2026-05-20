import { NextResponse } from "next/server";
import type { Decision } from "./types";
import type { Decision as PrismaDecision } from "@prisma/client";

export function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** Map Prisma row → API Decision shape */
export function toApiDecision(row: PrismaDecision): Decision {
  return {
    id: row.id,
    org_id: row.orgId,
    agent_id: row.agentId,
    action: row.action as Decision["action"],
    rationale_summary: row.rationaleSummary,
    reasoning_ref: (row.reasoningRef as Decision["reasoning_ref"]) ?? null,
    risk: {
      level: row.riskLevel as Decision["risk"]["level"],
      score: row.riskScore,
      rules_hit: row.rulesHit,
    },
    status: row.status as Decision["status"],
    approvals: (row.approvals as Decision["approvals"]) ?? [],
    rejection: (row.rejection as Decision["rejection"]) ?? null,
    proposal_hash: row.proposalHash,
    anchor_tx: row.anchorTx ?? null,
    rejection_anchor_tx: row.rejectionAnchorTx ?? null,
    execution_grant: (row.executionGrant as Decision["execution_grant"]) ?? null,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}
