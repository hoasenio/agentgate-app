import { createWalletClient, createPublicClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { avalancheFuji } from "viem/chains";
import { toBytes32 } from "./hash";
import { getReviewerPrivateKey } from "./wallet";

const AUDIT_LOGGER_ABI = parseAbi([
  "function recordDecision(bytes32 proposalHash, bytes32 status, address approver, bytes32 decisionId) external",
  "event DecisionRecorded(bytes32 indexed proposalHash, bytes32 status, address indexed approver, bytes32 indexed decisionId, uint256 timestamp)",
]);

function getClients() {
  const rpcUrl = process.env.RPC_URL;
  const privateKey = getReviewerPrivateKey();

  if (!rpcUrl || !privateKey) {
    return null;
  }

  const account = privateKeyToAccount(privateKey);
  const transport = http(rpcUrl);

  const walletClient = createWalletClient({
    account,
    chain: avalancheFuji,
    transport,
  });

  const publicClient = createPublicClient({
    chain: avalancheFuji,
    transport,
  });

  return { walletClient, publicClient, account };
}

export async function anchorDecision(params: {
  proposal_hash: string;
  status: string;
  approver: string;
  decision_id: string;
}): Promise<string | null> {
  const contractAddress = process.env.AUDIT_LOGGER_ADDRESS as `0x${string}` | undefined;
  const clients = getClients();

  if (!clients || !contractAddress) {
    console.warn("[anchor] Skipping — RPC_URL, wallet key, or AUDIT_LOGGER_ADDRESS not configured");
    return null;
  }

  try {
    const { walletClient } = clients;

    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: AUDIT_LOGGER_ABI,
      functionName: "recordDecision",
      args: [
        toBytes32(params.proposal_hash),
        toBytes32(Buffer.from(params.status.padEnd(32, "\0")).toString("hex")),
        params.approver as `0x${string}`,
        toBytes32(Buffer.from(params.decision_id.replace(/-/g, "")).toString("hex")),
      ],
    });

    return hash;
  } catch (e) {
    console.error("[anchor] Failed to anchor on-chain:", e);
    return null;
  }
}
