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

Choose the most appropriate action.type from this list. READ THE DISAMBIGUATION CAREFULLY — picking the wrong type breaks risk scoring:
- treasury.swap — swap one asset for another. Use for ANY "rebalance X% of treasury" where X >= 1%, ANY explicit asset-for-asset trade, or any swap of named dollar amount.
- treasury.transfer — transfer assets to another address / multisig / payroll.
- treasury.claim — claim staking/yield rewards (typically a few hundred dollars; auto-approved).
- treasury.stake — stake assets into a protocol (Lido, Rocket Pool, etc).
- treasury.harvest — harvest+restake yield (Convex, Curve, etc; typically small).
- governance.vote — cast a vote on a Snapshot or on-chain proposal.
- portfolio.rebalance_small — ONLY for sub-1% drift corrections under $10k. NEVER use this for anything described as "X% rebalance" where X >= 1, or any swap larger than $10k. If in doubt, use treasury.swap.
- contract.deploy / contract.upgrade — smart contract operations.

ESTIMATING ESTIMATED_USD when scale is unclear:
- demo-dao's treasury is approximately $3M total: ~$2M in ETH, ~$1M in USDC.
- "X% rebalance" → multiply X% by the relevant asset balance. e.g. "5% of ETH" ≈ $100k. "10% of ETH" ≈ $200k.
- "Send $X to multisig" → use the literal dollar amount.
- "Claim daily rewards" → assume ~$200 unless specified.
- When in doubt, ROUND UP. Better to over-flag than to slip a large action through.

Always include "estimated_usd" in params (your best-effort dollar value of the action).

Rationale quality matters — your output goes to a human reviewer who will challenge weak reasoning:
- "rationale_summary" must be 2-3 sentences, action-specific. Reference concrete numbers (percentages, dollar amounts, time horizons). NEVER generic phrases like "aligns with risk management policy" or "strengthens reserves" without supporting data.
- "key_signals" must be 2-4 specific observed data points or market conditions that drove this decision (e.g. "ETH +22% over past 14 days", "Treasury USDC runway at 9 months", "Snapshot vote AGGR-047 closes in 36h"). These are the *facts*, not the *conclusion*.
- "considerations" must be 2-3 reasoning factors weighed (e.g. "Slippage on Uniswap v3 ETH/USDC pool < 0.1% at this size", "Counterparty risk: USDC > USDT for our jurisdiction").
- "risks_acknowledged" must be 1-2 things that could go wrong (e.g. "ETH could continue rallying — opportunity cost ~$8k if +5%", "Gas spike on settlement window").

Be intellectually honest. If you don't have specific data, say so explicitly in "key_signals" (e.g. "No real-time market data available — using policy defaults").`;

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
            "2-3 sentences explaining the WHY. MUST reference concrete numbers (percentages, dollar amounts, time windows). NO generic risk-management boilerplate.",
        },
        key_signals: {
          type: "array",
          items: { type: "string" },
          minItems: 2,
          maxItems: 4,
          description:
            "2-4 specific observed data points that triggered this proposal. Each is one short factual statement (e.g. 'ETH +22% past 14d', 'USDC treasury runway: 9 months', 'Snapshot vote AGGR-047 closes in 36h').",
        },
        considerations: {
          type: "array",
          items: { type: "string" },
          minItems: 2,
          maxItems: 3,
          description:
            "2-3 reasoning factors weighed (e.g. 'Slippage on Uniswap v3 ETH/USDC < 0.1% at this size', 'Counterparty risk: prefer USDC over USDT for our jurisdiction').",
        },
        risks_acknowledged: {
          type: "array",
          items: { type: "string" },
          minItems: 1,
          maxItems: 2,
          description:
            "1-2 things that could go wrong (e.g. 'ETH continues rallying — opportunity cost ~$8k if +5%', 'Gas spike during settlement window').",
        },
      },
      required: [
        "action_type",
        "params",
        "rationale_summary",
        "key_signals",
        "considerations",
        "risks_acknowledged",
      ],
      additionalProperties: false,
    },
  },
};

export interface AgentThoughts {
  key_signals: string[];
  considerations: string[];
  risks_acknowledged: string[];
}

export interface TraceMeta {
  latency_ms: number;
  tokens_in: number | null;
  tokens_out: number | null;
  tokens_total: number | null;
}

export type AgentLLMResult =
  | {
      kind: "action";
      proposal: ProposeInput;
      thoughts: AgentThoughts;
      langsmith_run_id: string | null;
      langsmith_share_url: string | null;
      model: string;
      raw_assistant_text: string | null;
      trace: TraceMeta;
    }
  | {
      kind: "refusal";
      refusal_message: string;
      langsmith_run_id: string | null;
      langsmith_share_url: string | null;
      model: string;
      trace: TraceMeta;
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

type LLMCallResult = {
  trace: TraceMeta;
} & (
  | {
      kind: "action";
      action: DecisionAction;
      rationale: string;
      thoughts: AgentThoughts;
      raw_text: string | null;
    }
  | {
      kind: "refusal";
      message: string;
    }
);

const llmCall = traceable(
  async (prompt: string): Promise<LLMCallResult> => {
    const openRouter = getOpenRouter();
    const startedAt = Date.now();
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
    const latency_ms = Date.now() - startedAt;

    type Usage = {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    };
    const usage = (response as { usage?: Usage }).usage ?? {};
    const trace: TraceMeta = {
      latency_ms,
      tokens_in: usage.promptTokens ?? null,
      tokens_out: usage.completionTokens ?? null,
      tokens_total: usage.totalTokens ?? null,
    };

    const choice = response.choices?.[0];
    const message = choice?.message;
    const toolCall = message?.toolCalls?.[0];

    if (toolCall && toolCall.function?.name === "propose_action") {
      const args = JSON.parse(toolCall.function.arguments ?? "{}") as {
        action_type: string;
        params: Record<string, unknown>;
        rationale_summary: string;
        key_signals?: string[];
        considerations?: string[];
        risks_acknowledged?: string[];
      };
      return {
        kind: "action",
        trace,
        action: { type: args.action_type, params: args.params ?? {} },
        rationale: args.rationale_summary,
        thoughts: {
          key_signals: Array.isArray(args.key_signals) ? args.key_signals : [],
          considerations: Array.isArray(args.considerations) ? args.considerations : [],
          risks_acknowledged: Array.isArray(args.risks_acknowledged) ? args.risks_acknowledged : [],
        },
        raw_text: typeof message?.content === "string" ? message.content : null,
      };
    }

    // No tool call → out-of-scope refusal. Surface the plain-text content.
    const refusalText =
      (typeof message?.content === "string" && message.content.trim()) ||
      "I can only act on treasury operations or governance votes for demo-dao. Try something like: \"Claim our daily Lido staking rewards\" or \"Rebalance 5% of ETH into USDC.\"";
    return { kind: "refusal", trace, message: refusalText };
  },
  { name: "agentgate.agent.propose", project_name: process.env.LANGSMITH_PROJECT ?? "agentgate-demo" }
);

export async function generateProposal(params: {
  prompt: string;
  agent_id: string;
  org_id: string;
  session_id?: string | null;
}): Promise<AgentLLMResult> {
  let runId: string | null = null;

  // Wrapper to capture the run_id from inside the traced fn
  const tracedWithCapture = traceable(
    async (prompt: string) => {
      const runTree = getCurrentRunTree();
      runId = runTree?.id ?? null;
      return llmCall(prompt);
    },
    {
      name: "agentgate.chat",
      project_name: process.env.LANGSMITH_PROJECT ?? "agentgate-demo",
      metadata: {
        session_id: params.session_id ?? null,
        agent_id: params.agent_id,
        org_id: params.org_id,
      },
    }
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
      trace: result.trace,
    };
  }

  const { action, rationale, raw_text, thoughts } = result;

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
    thoughts,
    langsmith_run_id: runId,
    langsmith_share_url: shareUrl,
    model: DEFAULT_MODEL,
    raw_assistant_text: raw_text,
    trace: result.trace,
  };
}
