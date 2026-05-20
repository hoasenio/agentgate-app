import { Icon } from "./IconSet";

export function ProblemCard({ icon, title, body }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1.5">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
    </div>
  );
}

export function StepCard({ n, title, body, kicker }) {
  return (
    <div className="relative rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-7 h-7 rounded-full bg-gray-900 text-white text-xs font-semibold flex items-center justify-center">{n}</div>
        <div className="text-[11px] font-mono uppercase tracking-wider text-gray-400">{kicker}</div>
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1.5">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
    </div>
  );
}

/* Comparison row helper */
export function Cmp({ value }) {
  if (value === true) return <td className="px-4 py-3 text-center"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 text-emerald-600">{Icon.check("w-4 h-4")}</span></td>;
  if (value === false) return <td className="px-4 py-3 text-center"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-50 text-gray-300">{Icon.dash("w-4 h-4")}</span></td>;
  if (value === "partial") return <td className="px-4 py-3 text-center"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-50 text-amber-600">{Icon.dash("w-4 h-4")}</span></td>;
  return <td className="px-4 py-3 text-center text-sm text-gray-600">{value}</td>;
}

/* ---------- Page ---------- */
