import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { generateProposal } from "@/lib/llm";
import { scoreRisk, shouldAutoApprove } from "@/lib/risk-engine";
import { computeProposalHash } from "@/lib/hash";
import { issueGrant } from "@/lib/execution-grant";
import { toApiDecision, err } from "@/lib/api-helpers";

const ChatSchema = z.object({
  prompt: z.string().min(1).max(2000),
  agent_id: z.string().min(1).default("agent-treasury-01"),
  org_id: z.string().min(1).default("demo-dao"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = ChatSchema.safeParse(body);
    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const { prompt, agent_id, org_id } = parsed.data;

    // 1. Ask the LLM (via OpenRouter) for a structured proposal — traced through LangSmith
    let llmResult;
    try {
      llmResult = await generateProposal({ prompt, agent_id, org_id });
    } catch (e) {
      console.error("[agent/chat] LLM failure:", e);
      return err(
        e instanceof Error ? `LLM error: ${e.message}` : "LLM call failed",
        502
      );
    }

    // 1a. If the agent refused (out-of-scope prompt), return without creating a decision.
    //     This is a feature, not a failure — surfaces the agent's policy boundary.
    if (llmResult.kind === "refusal") {
      return NextResponse.json(
        {
          refused: true,
          decision: null,
          agent_message: llmResult.refusal_message,
          langsmith_share_url: llmResult.langsmith_share_url,
          model: llmResult.model,
        },
        { status: 200 }
      );
    }

    const { proposal, langsmith_run_id, langsmith_share_url, model } = llmResult;

    // 2. Run risk engine + persist decision (mirrors /decisions/propose pipeline)
    const now = new Date();
    const risk = scoreRisk(proposal.action);
    const auto = shouldAutoApprove(risk);
    const status = auto ? "auto_approved" : "pending_approval";

    const proposalHash = computeProposalHash({
      org_id: proposal.org_id,
      agent_id: proposal.agent_id,
      action: proposal.action,
      rationale_summary: proposal.rationale_summary,
      created_at: now.toISOString(),
    });

    const row = await prisma.decision.create({
      data: {
        orgId: proposal.org_id,
        agentId: proposal.agent_id,
        action: proposal.action as object,
        rationaleSummary: proposal.rationale_summary,
        reasoningRef: {
          run_id: langsmith_run_id,
          share_url: langsmith_share_url,
          model,
        },
        riskLevel: risk.level,
        riskScore: risk.score,
        rulesHit: risk.rules_hit,
        status,
        approvals: [],
        proposalHash,
      },
    });

    let finalRow = row;
    if (auto) {
      const grant = await issueGrant({
        decision_id: row.id,
        status,
        approver: "policy-engine",
        anchor_tx: null,
      });
      finalRow = await prisma.decision.update({
        where: { id: row.id },
        data: { executionGrant: grant as object },
      });
    }

    return NextResponse.json(
      {
        refused: false,
        decision: toApiDecision(finalRow),
        agent_message: buildAgentMessage(proposal, risk.level),
        langsmith_share_url,
        model,
      },
      { status: 201 }
    );
  } catch (e) {
    console.error("[agent/chat]", e);
    return err("Internal server error", 500);
  }
}

function buildAgentMessage(
  proposal: { action: { type: string; params: Record<string, unknown> }; rationale_summary: string },
  riskLevel: string
): string {
  const usd = proposal.action.params.estimated_usd;
  const usdStr = typeof usd === "number" ? `$${usd.toLocaleString()}` : "unknown notional";
  return `I've drafted a **${proposal.action.type}** proposal (${usdStr}, risk: **${riskLevel.toUpperCase()}**). ${proposal.rationale_summary} Submitting to AgentGate now.`;
}
