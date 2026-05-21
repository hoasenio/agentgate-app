import { NextResponse } from "next/server";
import { getReviewerAddress, getAgentAddress } from "@/lib/wallet";

export async function GET() {
  return NextResponse.json({
    reviewer_address: getReviewerAddress(),
    agent_address: getAgentAddress(),
  });
}
