import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toApiDecision, err } from "@/lib/api-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const row = await prisma.decision.findUnique({ where: { id } });
    if (!row) return err("Decision not found", 404);
    return NextResponse.json(toApiDecision(row));
  } catch (e) {
    console.error("[decisions/get]", e);
    return err("Internal server error", 500);
  }
}
