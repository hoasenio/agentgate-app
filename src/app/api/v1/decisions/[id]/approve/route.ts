import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { issueGrant } from "@/lib/execution-grant";
import { anchorDecision } from "@/lib/anchor";
import { toApiDecision, err } from "@/lib/api-helpers";

const ApproveSchema = z.object({
  approver: z.string().min(1).default("reviewer"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const parsed = ApproveSchema.safeParse(body);
    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const row = await prisma.decision.findUnique({ where: { id } });
    if (!row) return err("Decision not found", 404);
    if (row.status !== "pending_approval") {
      return err(`Decision is already ${row.status}`, 409);
    }

    const { approver } = parsed.data;
    const now = new Date();

    // Anchor on-chain (graceful degrade)
    const anchorTx = await anchorDecision({
      proposal_hash: row.proposalHash,
      status: "approved",
      approver,
      decision_id: row.id,
    });

    const grant = await issueGrant({
      decision_id: row.id,
      status: "approved",
      approver,
      anchor_tx: anchorTx,
    });

    const updated = await prisma.decision.update({
      where: { id },
      data: {
        status: "approved",
        approvals: [{ approver, timestamp: now.toISOString() }],
        anchorTx,
        executionGrant: grant,
      },
    });

    return NextResponse.json(toApiDecision(updated));
  } catch (e) {
    console.error("[approve]", e);
    return err("Internal server error", 500);
  }
}
