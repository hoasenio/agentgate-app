export function RiskBadge({ level, score, withScore }) {
  const map = {
    high: "bg-red-100 text-red-700",
    medium: "bg-amber-100 text-amber-700",
    low: "bg-emerald-100 text-emerald-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider ${map[level]}`}
    >
      {level}
      {withScore && score != null && (
        <span className="font-mono normal-case opacity-70">{score.toFixed(2)}</span>
      )}
    </span>
  );
}

export function StatusBadge({ status }) {
  const toSentenceCase = (value) => {
    if (!value) return value;
    const normalized = value.replaceAll("_", "-");
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };

  if (status === "pending_approval") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-orange-100 text-orange-700">
        <span className="relative inline-flex w-1.5 h-1.5">
          <span className="absolute inset-0 rounded-full text-orange-400 ag-pulse-dot" />
          <span className="relative w-1.5 h-1.5 rounded-full bg-orange-500" />
        </span>
        Pending
      </span>
    );
  }
  if (status === "approved") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-green-100 text-green-700">
        Approved
      </span>
    );
  }
  if (status === "auto_approved") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-100 text-blue-700">
        Auto-approved
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-red-100 text-red-700">
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-gray-100 text-gray-700">
      {toSentenceCase(status)}
    </span>
  );
}

export function Panel({ title, children, actions, tone }) {
  const ring = tone === "red" ? "border-red-100" : "border-gray-100";
  return (
    <section className={`bg-white rounded-xl shadow-sm border ${ring} p-5`}>
      <header className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <div>{actions}</div>
      </header>
      {children}
    </section>
  );
}
