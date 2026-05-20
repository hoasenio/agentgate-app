import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { err } from "@/lib/api-helpers";

export async function POST() {
  try {
    const deleted = await prisma.decision.deleteMany({
      where: { orgId: "demo-dao" },
    });

    return NextResponse.json({
      ok: true,
      deleted: deleted.count,
      message: `Demo reset complete. Deleted ${deleted.count} decision(s) for demo-dao.`,
    });
  } catch (e) {
    console.error("[demo/reset]", e);
    return err("Internal server error", 500);
  }
}
