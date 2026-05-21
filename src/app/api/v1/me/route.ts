import { NextResponse } from "next/server";
import { getReviewerAddress, getAgentAddress } from "@/lib/wallet";

export async function GET() {
  return NextResponse.json({
    reviewer_address: getReviewerAddress(),
    agent_address: getAgentAddress(),
    default_model:
      process.env.OPENROUTER_MODEL ?? "openai/gpt-oss-120b:free",
    langsmith_project: process.env.LANGSMITH_PROJECT ?? "agentgate-demo",
  });
}
