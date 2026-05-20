import { API_BASE_URL } from "@/constants";

async function parseResponse(response) {
  if (response.ok) return response.json();

  let message = "Request failed";
  try {
    const body = await response.json();
    if (body?.error) message = body.error;
  } catch {
    // ignore parsing error and keep generic message
  }
  throw new Error(message);
}

export async function listDecisions(orgId) {
  const url = `${API_BASE_URL}/orgs/${encodeURIComponent(orgId)}/decisions`;
  const response = await fetch(url, { cache: "no-store" });
  return parseResponse(response);
}

export async function approveDecision(id, approver) {
  const url = `${API_BASE_URL}/decisions/${encodeURIComponent(id)}/approve`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ approver }),
  });
  return parseResponse(response);
}

export async function rejectDecision(id, reason, rejector) {
  const url = `${API_BASE_URL}/decisions/${encodeURIComponent(id)}/reject`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason, rejector }),
  });
  return parseResponse(response);
}
