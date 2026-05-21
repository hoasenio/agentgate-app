import { API_BASE_URL } from "@/constants";

export async function getMe() {
  const response = await fetch(`${API_BASE_URL}/me`, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to load identity");
  return response.json();
}
