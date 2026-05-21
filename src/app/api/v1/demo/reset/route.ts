import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { err } from "@/lib/api-helpers";
import { seedDemoData } from "@/lib/demo-seed";

export async function POST(req: NextRequest) {
  try {
    const skipSeed = req.nextUrl.searchParams.get("seed") === "false";

    if (skipSeed) {
      const deleted = await prisma.decision.deleteMany({
        where: { orgId: "demo-dao" },
      });
      return NextResponse.json({
        ok: true,
        deleted: deleted.count,
        seeded: 0,
        message: `Cleared ${deleted.count} decision(s) for demo-dao (no reseed).`,
      });
    }

    const seeded = await seedDemoData(prisma);

    return NextResponse.json({
      ok: true,
      seeded,
      message: `Demo reset complete. Seeded ${seeded} mock decision(s) for demo-dao.`,
    });
  } catch (e) {
    console.error("[demo/reset]", e);
    return err("Internal server error", 500);
  }
}
