import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CHAIN_INFO, getPublicClient } from "@/lib/chain";
import { err } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const contractAddress =
      (process.env.AUDIT_LOGGER_ADDRESS as `0x${string}` | undefined) ?? null;

    let currentBlock: number | null = null;
    try {
      const client = getPublicClient();
      const bn = await client.getBlockNumber();
      currentBlock = Number(bn);
    } catch (e) {
      console.warn("[chain] getBlockNumber failed:", e);
    }

    const lastAnchor = await prisma.decision.findFirst({
      where: {
        orgId: "demo-dao",
        anchorTx: { not: null },
      },
      orderBy: { updatedAt: "desc" },
      select: {
        anchorTx: true,
        updatedAt: true,
        status: true,
      },
    });

    return NextResponse.json({
      network: CHAIN_INFO.name,
      chain_id: CHAIN_INFO.chainId,
      explorer_base: CHAIN_INFO.explorer,
      contract_address: contractAddress,
      contract_url: contractAddress
        ? `${CHAIN_INFO.explorer}/address/${contractAddress}`
        : null,
      current_block: currentBlock,
      last_anchor: lastAnchor
        ? {
            tx_hash: lastAnchor.anchorTx,
            tx_url: `${CHAIN_INFO.explorer}/tx/${lastAnchor.anchorTx}`,
            at: lastAnchor.updatedAt.toISOString(),
            status: lastAnchor.status,
          }
        : null,
    });
  } catch (e) {
    console.error("[chain]", e);
    return err("Internal server error", 500);
  }
}
