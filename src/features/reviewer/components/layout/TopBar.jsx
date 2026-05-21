"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { DIcon } from "../Icons";
import { getMe } from "@/services/api/me";
import agentGateLogo from "@/assets/agentgate-logo.svg";

function shortAddr(addr) {
  if (!addr || addr.length < 10) return addr ?? "0x…";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function TopBar() {
  const [addr, setAddr] = useState(null);

  useEffect(() => {
    let active = true;
    getMe()
      .then((d) => {
        if (active && d?.reviewer_address) setAddr(d.reviewer_address);
      })
      .catch(() => {
        // keep null — UI shows placeholder
      });
    return () => {
      active = false;
    };
  }, []);

  const baseExplorer =
    process.env.NEXT_PUBLIC_BASE_EXPLORER ?? "https://testnet.snowtrace.io";

  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4">
      <Link href="/" className="flex items-center gap-2">
        <Image
          src={agentGateLogo}
          alt="AgentGate logo"
          width={28}
          height={28}
          className="w-7 h-7 rounded-md object-cover"
        />
        <span className="font-semibold tracking-tight">AgentGate</span>
        <span className="ml-1 text-[10px] font-mono uppercase tracking-wider text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">v0.4</span>
      </Link>
      <span className="text-gray-300">/</span>
      <span className="text-sm text-gray-700">demo-dao</span>
      <Link href="/agent" className="ml-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
        Agent chat →
      </Link>
      <div className="ml-auto flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 w-72">
          {DIcon.search("w-4 h-4 text-gray-400")}
          <input className="bg-transparent outline-none text-sm flex-1 placeholder:text-gray-400" placeholder="Search decisions, agents, hashes" />
          <span className="text-[10px] font-mono text-gray-400 border border-gray-200 rounded px-1 py-0.5">⌘K</span>
        </div>
        <a
          href={addr ? `${baseExplorer}/address/${addr}` : "#"}
          target={addr ? "_blank" : undefined}
          rel="noreferrer"
          className="flex items-center gap-2 text-sm bg-white border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50"
          title={addr ?? "Wallet not configured"}
        >
          <span className={`w-2 h-2 rounded-full ${addr ? "bg-emerald-500" : "bg-amber-500"}`} />
          <span
            className="text-gray-700"
            style={{
              fontFamily:
                'ui-monospace, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              fontSize: "0.75rem",
            }}
          >
            {shortAddr(addr)}
          </span>
          {DIcon.chev("w-4 h-4 text-gray-400")}
        </a>
      </div>
    </div>
  );
}
