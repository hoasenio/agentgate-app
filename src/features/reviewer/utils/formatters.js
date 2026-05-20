export function relTime(iso) {
  const t = new Date(iso).getTime();
  const now = new Date("2026-05-20T10:35:00Z").getTime(); // "demo now"
  const diff = Math.max(0, now - t);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d > 1 ? "s" : ""} ago`;
}

export function actionSummary(d) {
  const a = d.action;
  if (a.type === "treasury.swap") {
    return `Swap ${a.params.pct}% ${a.params.from} → ${a.params.to}${a.params.estimated_usd ? `, ~$${Math.round(a.params.estimated_usd / 1000)}k` : ""}`;
  }
  if (a.type === "treasury.transfer") {
    return `Transfer ${(a.params.amount_usdc / 1000).toFixed(0)}k USDC → ${a.params.to}`;
  }
  if (a.type === "claim_rewards") {
    return `Claim rewards · ${a.params.protocol}${a.params.estimated_usd ? `, ~$${a.params.estimated_usd}` : ""}`;
  }
  return a.type;
}


/* ---------- Icons ---------- */
