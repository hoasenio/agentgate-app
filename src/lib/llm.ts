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

If the operator's request maps to a valid treasury or governance action, you MUST call the propose_action tool with one structured action.

If the request is OUT OF SCOPE for a treasury agent (e.g. personal advice, off-topic chatter, anything that doesn't translate to an on-chain action), DO NOT call the tool. Instead respond in plain text with one short paragraph (2-3 sentences) explaining:
1. That you can only act on treasury / governance operations for demo-dao
2. What kinds of requests you CAN handle (give 2-3 concrete examples)

Choose the most appropriate action.type from this list:
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

export type AgentLLMResult =
  | {
      kind: "action";
      proposal: ProposeInput;
      langsmith_run_id: string | null;
      langsmith_share_url: string | null;
      model: string;
      raw_assistant_text: string | null;
    }
  | {
      kind: "refusal";
      refusal_message: string;
      langsmith_run_id: string | null;
      langsmith_share_url: string | null;
      model: string;
    };

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

// Auto-enable LangSmith tracing whenever an API key is present.
// Without this flag, `traceable()` becomes a no-op and run_ids are never captured.
if (process.env.LANGSMITH_API_KEY) {
  if (!process.env.LANGSMITH_TRACING) process.env.LANGSMITH_TRACING = "true";
  if (!process.env.LANGCHAIN_TRACING_V2)
    process.env.LANGCHAIN_TRACING_V2 = "true";
}

type LLMCallResult =
  | {
      kind: "action";
      action: DecisionAction;
      rationale: string;
      raw_text: string | null;
    }
  | {
      kind: "refusal";
      message: string;
    };

const llmCall = traceable(
  async (prompt: string): Promise<LLMCallResult> => {
    const openRouter = getOpenRouter();
    const response = await openRouter.chat.send({
      chatRequest: {
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        tools: [PROPOSE_TOOL],
        toolChoice: "auto",
        temperature: 0.3,
        maxTokens: 1024,
      },
    });

    const choice = response.choices?.[0];
    const message = choice?.message;
    const toolCall = message?.toolCalls?.[0];

    if (toolCall && toolCall.function?.name === "propose_action") {
      const args = JSON.parse(toolCall.function.arguments ?? "{}") as {
        action_type: string;
        params: Record<string, unknown>;
        rationale_summary: string;
      };
      return {
        kind: "action",
        action: { type: args.action_type, params: args.params ?? {} },
        rationale: args.rationale_summary,
        raw_text: typeof message?.content === "string" ? message.content : null,
      };
    }

    // No tool call → out-of-scope refusal. Surface the plain-text content.
    const refusalText =
      (typeof message?.content === "string" && message.content.trim()) ||
      "I can only act on treasury operations or governance votes for demo-dao. Try something like: \"Claim our daily Lido staking rewards\" or \"Rebalance 5% of ETH into USDC.\"";
    return { kind: "refusal", message: refusalText };
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

  const result = await tracedWithCapture(params.prompt);

  // Try to make the run publicly shareable for the dashboard "View Trace" link
  let shareUrl: string | null = null;
  const ls = getLangSmith();
  if (ls && runId) {
    try {
      shareUrl = await ls.shareRun(runId);
    } catch (e) {
      console.warn("[llm] shareRun failed (non-fatal), using fallback URL:", e);
    }
    // Fallback: deep-link into the authenticated LangSmith UI. Works for the
    // LangSmith account that owns the project; useful when shareRun is
    // disabled (e.g. on free plans or with org-level sharing restrictions).
    if (!shareUrl) {
      shareUrl = `https://smith.langchain.com/runs/${runId}`;
    }
  }

  if (result.kind === "refusal") {
    return {
      kind: "refusal",
      refusal_message: result.message,
      langsmith_run_id: runId,
      langsmith_share_url: shareUrl,
      model: DEFAULT_MODEL,
    };
  }

  const { action, rationale, raw_text } = result;

  const proposal: ProposeInput = {
    agent_id: params.agent_id,
    org_id: params.org_id,
    action,
    rationale_summary: rationale,
    reasoning_ref: runId ? { run_id: runId } : undefined,
  };

  return {
    kind: "action",
    proposal,
    langsmith_run_id: runId,
    langsmith_share_url: shareUrl,
    model: DEFAULT_MODEL,
    raw_assistant_text: raw_text,
  };
}
