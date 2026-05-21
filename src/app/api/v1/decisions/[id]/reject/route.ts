import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { computeReasonHash } from "@/lib/hash";
import { anchorDecision } from "@/lib/anchor";
import { getReviewerAddress } from "@/lib/wallet";
import { toApiDecision, err } from "@/lib/api-helpers";

const ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;

const RejectSchema = z.object({
  reason: z.string().min(1, "Reason is required").max(500),
  rejector: z.string().default("reviewer"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = RejectSchema.safeParse(body);
    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const row = await prisma.decision.findUnique({ where: { id } });
    if (!row) return err("Decision not found", 404);
    if (row.status !== "pending_approval") {
      return err(`Decision is already ${row.status}`, 409);
    }

    const { reason, rejector } = parsed.data;
    const now = new Date();
    const reasonHash = computeReasonHash(reason);

    const serverAddr = getReviewerAddress();
    const onChainRejector = ADDRESS_REGEX.test(rejector)
      ? (rejector as `0x${string}`)
      : (serverAddr ?? "0x0000000000000000000000000000000000000000");

    // Anchor rejection on-chain (graceful degrade)
    const rejectionAnchorTx = await anchorDecision({
      proposal_hash: row.proposalHash,
      status: "rejected",
      approver: onChainRejector,
      decision_id: row.id,
    });

    const rejection = {
      rejected_by: rejector,
      reason,
      reason_hash: reasonHash,
      timestamp: now.toISOString(),
    };

    const updated = await prisma.decision.update({
      where: { id },
      data: {
        status: "rejected",
        rejection,
        rejectionAnchorTx,
      },
    });

    return NextResponse.json(toApiDecision(updated));
  } catch (e) {
    console.error("[reject]", e);
    return err("Internal server error", 500);
  }
}
