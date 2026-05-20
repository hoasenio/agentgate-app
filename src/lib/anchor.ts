import { createWalletClient, createPublicClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { toBytes32 } from "./hash";

const AUDIT_LOGGER_ABI = parseAbi([
  "function recordDecision(bytes32 proposalHash, bytes32 status, address approver, bytes32 decisionId) external",
  "event DecisionRecorded(bytes32 indexed proposalHash, bytes32 status, address indexed approver, bytes32 indexed decisionId, uint256 timestamp)",
]);

function getClients() {
  const rpcUrl = process.env.RPC_URL;
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;

  if (!rpcUrl || !privateKey || privateKey.includes("your_funded")) {
    return null;
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const transport = http(rpcUrl);

  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport,
  });

  const publicClient = createPublicClient({
    chain: baseSepolia,
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
    console.warn("[anchor] Skipping — RPC_URL, DEPLOYER_PRIVATE_KEY, or AUDIT_LOGGER_ADDRESS not configured");
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
