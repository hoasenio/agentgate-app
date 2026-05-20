import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toApiDecision, err } from "@/lib/api-helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status") ?? undefined;
    const agentId = searchParams.get("agent_id") ?? undefined;
    const limitParam = searchParams.get("limit");
    const take = limitParam ? Math.min(parseInt(limitParam, 10), 200) : 50;

    const rows = await prisma.decision.findMany({
      where: {
        orgId,
        ...(status && { status: status as never }),
        ...(agentId && { agentId }),
      },
      orderBy: { createdAt: "desc" },
      take,
    });

    const stats = await prisma.decision.groupBy({
      by: ["status"],
      where: { orgId },
      _count: { status: true },
    });

    const counts: Record<string, number> = {};
    for (const s of stats) {
      counts[s.status] = s._count.status;
    }

    return NextResponse.json({
      decisions: rows.map(toApiDecision),
      stats: {
        total: Object.values(counts).reduce((a, b) => a + b, 0),
        pending_approval: counts.pending_approval ?? 0,
        approved: counts.approved ?? 0,
        rejected: counts.rejected ?? 0,
        auto_approved: counts.auto_approved ?? 0,
      },
    });
  } catch (e) {
    console.error("[decisions/list]", e);
    return err("Internal server error", 500);
  }
}
