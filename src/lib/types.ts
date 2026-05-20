export type RiskLevel = "low" | "medium" | "high";

export type DecisionStatus =
  | "pending_approval"
  | "approved"
  | "rejected"
  | "auto_approved";

export interface DecisionAction {
  type: string;
  params: Record<string, unknown>;
}

export interface ReasoningRef {
  run_id?: string;
  hash?: string;
}

export interface RiskResult {
  level: RiskLevel;
  score: number;
  rules_hit: string[];
}

export interface Approval {
  approver: string;
  timestamp: string;
}

export interface Rejection {
  rejected_by: string;
  reason: string;
  reason_hash: string;
  timestamp: string;
}

export interface ExecutionGrant {
  token: string;
  decision_id: string;
  status: DecisionStatus;
  approver: string;
  anchor_tx: string | null;
  issued_at: string;
  expires_at: string;
}

export interface Decision {
  id: string;
  org_id: string;
  agent_id: string;
  action: DecisionAction;
  rationale_summary: string;
  reasoning_ref: ReasoningRef | null;
  risk: RiskResult;
  status: DecisionStatus;
  approvals: Approval[];
  rejection: Rejection | null;
  proposal_hash: string;
  anchor_tx: string | null;
  rejection_anchor_tx: string | null;
  execution_grant: ExecutionGrant | null;
  created_at: string;
  updated_at: string;
}

export interface ProposeInput {
  agent_id: string;
  org_id: string;
  action: DecisionAction;
  rationale_summary: string;
  reasoning_ref?: ReasoningRef;
}

export interface ApproveInput {
  approver: string;
}

export interface RejectInput {
  reason: string;
  rejector?: string;
}
