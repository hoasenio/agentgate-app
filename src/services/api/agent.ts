import { API_BASE_URL } from "@/constants";

async function parseResponse(response: Response) {
  if (response.ok) return response.json();
  let message = "Request failed";
  try {
    const body = await response.json();
    if (body?.error) message = body.error;
  } catch {
    // ignore
  }
  throw new Error(message);
}

export async function sendAgentChat(input: {
  prompt: string;
  agent_id?: string;
  org_id?: string;
}) {
  const response = await fetch(`${API_BASE_URL}/agent/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseResponse(response);
}

export async function getDecision(id: string) {
  const response = await fetch(
    `${API_BASE_URL}/decisions/${encodeURIComponent(id)}`,
    { cache: "no-store" }
  );
  return parseResponse(response);
}
