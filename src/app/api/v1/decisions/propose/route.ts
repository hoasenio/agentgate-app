import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { scoreRisk, shouldAutoApprove } from "@/lib/risk-engine";
import { computeProposalHash } from "@/lib/hash";
import { issueGrant } from "@/lib/execution-grant";
import { toApiDecision, err } from "@/lib/api-helpers";
import { CANNED_HIGH, CANNED_LOW } from "@/lib/canned-payloads";
import type { ProposeInput } from "@/lib/types";

const ProposeSchema = z.object({
  agent_id: z.string().min(1),
  org_id: z.string().min(1),
  action: z.object({
    type: z.string().min(1),
    params: z.record(z.unknown()).default({}),
  }),
  rationale_summary: z.string().min(1).max(2000),
  reasoning_ref: z
    .object({ run_id: z.string().optional(), hash: z.string().optional() })
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const canned = req.nextUrl.searchParams.get("canned");

    let input: ProposeInput;
    if (canned === "high") {
      input = CANNED_HIGH;
    } else if (canned === "low") {
      input = CANNED_LOW;
    } else {
      const body = await req.json().catch(() => null);
      const parsed = ProposeSchema.safeParse(body);
      if (!parsed.success) {
        return err(parsed.error.issues[0]?.message ?? "Invalid input", 400);
      }
      input = parsed.data as ProposeInput;
    }

    const now = new Date();
    const risk = scoreRisk(input.action);
    const auto = shouldAutoApprove(risk);
    const status = auto ? "auto_approved" : "pending_approval";
    const proposalHash = computeProposalHash({
      org_id: input.org_id,
      agent_id: input.agent_id,
      action: input.action,
      rationale_summary: input.rationale_summary,
      created_at: now.toISOString(),
    });

    const grant = auto
      ? await issueGrant({
          decision_id: "pending", // will update below
          status,
          approver: "policy-engine",
          anchor_tx: null,
        })
      : null;

    const row = await prisma.decision.create({
      data: {
        orgId: input.org_id,
        agentId: input.agent_id,
        action: input.action,
        rationaleSummary: input.rationale_summary,
        reasoningRef: input.reasoning_ref ?? null,
        riskLevel: risk.level,
        riskScore: risk.score,
        rulesHit: risk.rules_hit,
        status,
        approvals: [],
        proposalHash,
        executionGrant: grant
          ? { ...grant, decision_id: "placeholder" }
          : null,
      },
    });

    // Re-issue grant with real decision_id for auto-approved
    let finalGrant = null;
    if (auto) {
      finalGrant = await issueGrant({
        decision_id: row.id,
        status,
        approver: "policy-engine",
        anchor_tx: null,
      });
      await prisma.decision.update({
        where: { id: row.id },
        data: { executionGrant: finalGrant },
      });
      row.executionGrant = finalGrant;
    }

    return NextResponse.json(toApiDecision(row), { status: 201 });
  } catch (e) {
    console.error("[propose]", e);
    return err("Internal server error", 500);
  }
}
