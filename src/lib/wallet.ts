import { privateKeyToAccount } from "viem/accounts";

const PK_REGEX = /^0x[0-9a-fA-F]{64}$/;

function isValidKey(key: string | undefined): key is `0x${string}` {
  return !!key && PK_REGEX.test(key);
}

/** Resolve a private key from a list of env vars; first valid one wins. */
function pickKey(...envNames: string[]): `0x${string}` | null {
  for (const name of envNames) {
    const value = process.env[name];
    if (isValidKey(value)) return value;
  }
  return null;
}

/**
 * The reviewer/runtime wallet — used for displaying the reviewer's address
 * AND for signing anchor txs (it pays the gas).
 * Resolution order: USER_WALLET → AGENT_WALLET → DEPLOYER (first valid 64-hex key wins).
 */
export function getReviewerPrivateKey(): `0x${string}` | null {
  return pickKey(
    "USER_WALLET_PRIVATE_KEY",
    "AGENT_WALLET_PRIVATE_KEY",
    "DEPLOYER_PRIVATE_KEY"
  );
}

/** The agent's wallet identity (for display in agent UI). Falls back to reviewer if unset. */
export function getAgentPrivateKey(): `0x${string}` | null {
  return (
    pickKey("AGENT_WALLET_PRIVATE_KEY", "USER_WALLET_PRIVATE_KEY") ??
    getReviewerPrivateKey()
  );
}

export function getReviewerAddress(): `0x${string}` | null {
  const key = getReviewerPrivateKey();
  if (!key) return null;
  try {
    return privateKeyToAccount(key).address;
  } catch {
    return null;
  }
}

export function getAgentAddress(): `0x${string}` | null {
  const key = getAgentPrivateKey();
  if (!key) return null;
  try {
    return privateKeyToAccount(key).address;
  } catch {
    return null;
  }
}
