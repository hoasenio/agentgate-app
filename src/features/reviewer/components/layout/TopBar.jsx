import { DIcon } from "../Icons";

export default function TopBar() {
  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-md bg-gray-900 text-white flex items-center justify-center">{DIcon.shield("w-4 h-4")}</div>
        <span className="font-semibold tracking-tight">AgentGate</span>
        <span className="ml-1 text-[10px] font-mono uppercase tracking-wider text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">v0.4</span>
      </div>
      <span className="text-gray-300">/</span>
      <span className="text-sm text-gray-700">demo-dao</span>
      <div className="ml-auto flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 w-72">
          {DIcon.search("w-4 h-4 text-gray-400")}
          <input className="bg-transparent outline-none text-sm flex-1 placeholder:text-gray-400" placeholder="Search decisions, agents, hashes" />
          <span className="text-[10px] font-mono text-gray-400 border border-gray-200 rounded px-1 py-0.5">⌘K</span>
        </div>
        <button className="flex items-center gap-2 text-sm bg-white border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-mono text-xs text-gray-700">0x1a2b…3c4d</span>
          {DIcon.chev("w-4 h-4 text-gray-400")}
        </button>
      </div>
    </div>
  );
}

/* ---------- Timeline view ---------- */
