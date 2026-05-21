import { NextRequest, NextResponse } from "next/server";
import { getPublicClient, CHAIN_INFO } from "@/lib/chain";
import { err } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TX_REGEX = /^0x[0-9a-fA-F]{64}$/;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ txHash: string }> }
) {
  try {
    const { txHash } = await params;
    if (!TX_REGEX.test(txHash)) {
      return err("Invalid tx hash", 400);
    }
    const client = getPublicClient();

    let receipt;
    try {
      receipt = await client.getTransactionReceipt({
        hash: txHash as `0x${string}`,
      });
    } catch {
      return NextResponse.json({
        tx_hash: txHash,
        tx_url: `${CHAIN_INFO.explorer}/tx/${txHash}`,
        status: "not_found",
      });
    }

    let block;
    try {
      block = await client.getBlock({ blockNumber: receipt.blockNumber });
    } catch {
      // ignore
    }

    return NextResponse.json({
      tx_hash: txHash,
      tx_url: `${CHAIN_INFO.explorer}/tx/${txHash}`,
      block_number: Number(receipt.blockNumber),
      block_url: `${CHAIN_INFO.explorer}/block/${receipt.blockNumber}`,
      from: receipt.from,
      to: receipt.to,
      gas_used: receipt.gasUsed.toString(),
      effective_gas_price: receipt.effectiveGasPrice?.toString() ?? null,
      status: receipt.status,
      timestamp: block ? Number(block.timestamp) : null,
    });
  } catch (e) {
    console.error("[anchor/get]", e);
    return err("Internal server error", 500);
  }
}
