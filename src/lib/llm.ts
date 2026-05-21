import { OpenRouter } from "@openrouter/sdk";
import { traceable, getCurrentRunTree } from "langsmith/traceable";
import { Client as LangSmithClient } from "langsmith";
import type { DecisionAction, ProposeInput } from "./types";

const DEFAULT_MODEL =
  process.env.OPENROUTER_MODEL ?? "openai/gpt-oss-120b:free";

const ACTION_TYPES = [
  "treasury.swap",
  "treasury.transfer",
  "treasury.claim",
  "treasury.stake",
  "treasury.harvest",
  "governance.vote",
  "portfolio.rebalance_small",
  "contract.deploy",
  "contract.upgrade",
] as const;

const SYSTEM_PROMPT = `You are an autonomous treasury operations agent for a DAO called "demo-dao". You receive natural-language instructions from a human operator and must convert them into a single structured action proposal that will be submitted to the AgentGate governance API for human review.

You MUST call the propose_action tool with one structured action. NEVER respond with plain text. Choose the most appropriate action.type from this list:
- treasury.swap — swap one asset for another (HIGH if notional > $100k)
- treasury.transfer — transfer assets to another address
- treasury.claim — claim staking/yield rewards (typically LOW)
- treasury.stake — stake assets into a protocol
- treasury.harvest — harvest+restake yield (typically LOW)
- governance.vote — cast a vote on a Snapshot/on-chain proposal
- portfolio.rebalance_small — micro-rebalance to maintain target ratios
- contract.deploy / contract.upgrade — smart contract operations

Always include "estimated_usd" in params (your best-effort dollar value of the action). Be specific in rationale_summary — explain WHY this action, not just WHAT. 2-4 sentences.`;

const PROPOSE_TOOL = {
  type: "function" as const,
  function: {
    name: "propose_action",
    description:
      "Submit a structured governed-action proposal to AgentGate for risk scoring and (if needed) human approval.",
    parameters: {
      type: "object",
      properties: {
        action_type: {
          type: "string",
          enum: ACTION_TYPES,
          description: "The category of action being proposed",
        },
        params: {
          type: "object",
          description:
            "Action-specific parameters. MUST include 'estimated_usd' (number). Other fields depend on action_type: from/to/pct for swaps, asset/amount/protocol for stakes, proposal_id/vote for governance, etc.",
          properties: {
            estimated_usd: { type: "number" },
          },
          required: ["estimated_usd"],
          additionalProperties: true,
        },
        rationale_summary: {
          type: "string",
          description:
            "A 2-4 sentence justification explaining the WHY of this action (market context, data signal, risk reasoning). Will be shown to the human reviewer.",
        },
      },
      required: ["action_type", "params", "rationale_summary"],
      additionalProperties: false,
    },
  },
};

export interface AgentLLMResult {
  proposal: ProposeInput;
  langsmith_run_id: string | null;
  langsmith_share_url: string | null;
  model: string;
  raw_assistant_text: string | null;
}

let _orClient: OpenRouter | null = null;
function getOpenRouter(): OpenRouter {
  if (_orClient) return _orClient;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");
  _orClient = new OpenRouter({
    apiKey,
    httpReferer: "https://agentgate.demo",
    appTitle: "AgentGate",
    appCategories: "ai-governance",
  });
  return _orClient;
}

let _lsClient: LangSmithClient | null = null;
function getLangSmith(): LangSmithClient | null {
  if (_lsClient) return _lsClient;
  if (!process.env.LANGSMITH_API_KEY) return null;
  _lsClient = new LangSmithClient({
    apiKey: process.env.LANGSMITH_API_KEY,
    apiUrl:
      process.env.LANGSMITH_ENDPOINT ?? "https://api.smith.langchain.com",
  });
  return _lsClient;
}

const llmCall = traceable(
  async (prompt: string): Promise<{
    action: DecisionAction;
    rationale: string;
    raw_text: string | null;
  }> => {
    const openRouter = getOpenRouter();
    const response = await openRouter.chat.send({
      chatRequest: {
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        tools: [PROPOSE_TOOL],
        toolChoice: {
          type: "function",
          function: { name: "propose_action" },
        },
        temperature: 0.3,
        maxTokens: 1024,
      },
    });

    const choice = response.choices?.[0];
    const message = choice?.message;
    const toolCall = message?.toolCalls?.[0];

    if (!toolCall || toolCall.function?.name !== "propose_action") {
      throw new Error("LLM did not call propose_action tool");
    }

    const args = JSON.parse(toolCall.function.arguments ?? "{}") as {
      action_type: string;
      params: Record<string, unknown>;
      rationale_summary: string;
    };

    return {
      action: { type: args.action_type, params: args.params ?? {} },
      rationale: args.rationale_summary,
      raw_text: typeof message?.content === "string" ? message.content : null,
    };
  },
  { name: "agentgate.agent.propose", project_name: process.env.LANGSMITH_PROJECT ?? "agentgate-demo" }
);

export async function generateProposal(params: {
  prompt: string;
  agent_id: string;
  org_id: string;
}): Promise<AgentLLMResult> {
  let runId: string | null = null;

  // Wrapper to capture the run_id from inside the traced fn
  const tracedWithCapture = traceable(
    async (prompt: string) => {
      const runTree = getCurrentRunTree();
      runId = runTree?.id ?? null;
      return llmCall(prompt);
    },
    { name: "agentgate.chat", project_name: process.env.LANGSMITH_PROJECT ?? "agentgate-demo" }
  );

  const { action, rationale, raw_text } = await tracedWithCapture(params.prompt);

  // Try to make the run publicly shareable for the dashboard "View Trace" link
  let shareUrl: string | null = null;
  const ls = getLangSmith();
  if (ls && runId) {
    try {
      shareUrl = await ls.shareRun(runId);
    } catch (e) {
      console.warn("[llm] shareRun failed (non-fatal):", e);
    }
  }

  const proposal: ProposeInput = {
    agent_id: params.agent_id,
    org_id: params.org_id,
    action,
    rationale_summary: rationale,
    reasoning_ref: runId ? { run_id: runId } : undefined,
  };

  return {
    proposal,
    langsmith_run_id: runId,
    langsmith_share_url: shareUrl,
    model: DEFAULT_MODEL,
    raw_assistant_text: raw_text,
  };
}
