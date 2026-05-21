import { createPublicClient, http } from "viem";
import { avalancheFuji } from "viem/chains";

const FALLBACK_RPC = "https://api.avax-test.network/ext/bc/C/rpc";

export function getRpcUrl(): string {
  return process.env.RPC_URL ?? FALLBACK_RPC;
}

let _publicClient: ReturnType<typeof createPublicClient> | null = null;
export function getPublicClient() {
  if (_publicClient) return _publicClient;
  _publicClient = createPublicClient({
    chain: avalancheFuji,
    transport: http(getRpcUrl()),
  });
  return _publicClient;
}

export const CHAIN_INFO = {
  name: "Avalanche Fuji",
  chainId: 43113,
  explorer: (
    process.env.NEXT_PUBLIC_BASE_EXPLORER ?? "https://testnet.snowtrace.io"
  ).replace(/\/+$/, ""),
};
