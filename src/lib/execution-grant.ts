import { SignJWT } from "jose";
import type { DecisionStatus, ExecutionGrant } from "./types";

function getSecret(): Uint8Array {
  const secret = process.env.AGENTGATE_JWT_SECRET;
  if (!secret) throw new Error("AGENTGATE_JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function issueGrant(params: {
  decision_id: string;
  status: DecisionStatus;
  approver: string;
  anchor_tx: string | null;
}): Promise<ExecutionGrant> {
  const now = new Date();
  const expires = new Date(now.getTime() + 60 * 60 * 1000); // 1h

  const token = await new SignJWT({
    decision_id: params.decision_id,
    status: params.status,
    approver: params.approver,
    anchor_tx: params.anchor_tx,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(expires)
    .setIssuer("agentgate")
    .sign(getSecret());

  return {
    token,
    decision_id: params.decision_id,
    status: params.status,
    approver: params.approver,
    anchor_tx: params.anchor_tx,
    issued_at: now.toISOString(),
    expires_at: expires.toISOString(),
  };
}
