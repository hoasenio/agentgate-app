import { keccak256, toHex } from "viem";

export function computeProposalHash(payload: {
  org_id: string;
  agent_id: string;
  action: unknown;
  rationale_summary: string;
  created_at: string;
}): string {
  const canonical = JSON.stringify({
    org_id: payload.org_id,
    agent_id: payload.agent_id,
    action: payload.action,
    rationale_summary: payload.rationale_summary,
    created_at: payload.created_at,
  });
  return keccak256(toHex(canonical));
}

export function computeReasonHash(reason: string): string {
  return keccak256(toHex(reason));
}

/** Converts a 0x hex string into a `bytes32` padded hex for on-chain use */
export function toBytes32(hex: string): `0x${string}` {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  return `0x${clean.padEnd(64, "0").slice(0, 64)}`;
}
