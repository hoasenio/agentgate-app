import { API_BASE_URL } from "@/constants";

export async function getChainInfo() {
  const r = await fetch(`${API_BASE_URL}/chain`, { cache: "no-store" });
  if (!r.ok) throw new Error("Failed to load chain info");
  return r.json();
}

export async function getAnchorReceipt(txHash: string) {
  const r = await fetch(`${API_BASE_URL}/anchor/${txHash}`, {
    cache: "no-store",
  });
  if (!r.ok) throw new Error("Failed to load tx receipt");
  return r.json();
}
