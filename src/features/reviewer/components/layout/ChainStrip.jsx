"use client";

import { useEffect, useState } from "react";
import { getChainInfo } from "@/services/api/chain";

function shortAddr(addr) {
  if (!addr || addr.length < 10) return null;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function ago(iso) {
  if (!iso) return null;
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function ChainStrip() {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    let active = true;
    let timer;

    const tick = async () => {
      try {
        const d = await getChainInfo();
        if (active) setInfo(d);
      } catch {
        // silent
      }
      if (active) timer = setTimeout(tick, 5000);
    };
    tick();

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!info) {
    return (
      <div className="bg-white border-b border-gray-200 px-6 py-2 text-xs text-gray-400 font-mono">
        Loading chain status…
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-emerald-50/50 to-blue-50/50 border-b border-gray-200 px-6 py-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
      <span className="inline-flex items-center gap-1.5 font-medium text-gray-700">
        <span className="relative inline-flex w-1.5 h-1.5">
          <span className="absolute inset-0 rounded-full bg-emerald-500 ag-pulse-dot text-emerald-300" />
          <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-500" />
        </span>
        {info.network}
      </span>

      {info.contract_address && (
        <a
          href={info.contract_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900"
          title={info.contract_address}
        >
          <span className="text-gray-400">AuditLogger</span>
          <span className="font-mono text-gray-800">{shortAddr(info.contract_address)}</span>
          <span className="text-blue-600">↗</span>
        </a>
      )}

      {info.current_block != null && (
        <span className="inline-flex items-center gap-1 text-gray-600">
          <span className="text-gray-400">Block</span>
          <span className="font-mono text-gray-800">#{info.current_block.toLocaleString()}</span>
        </span>
      )}

      {info.last_anchor && (
        <a
          href={info.last_anchor.tx_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 ml-auto"
        >
          <span className="text-gray-400">Last anchor</span>
          <span className="font-mono text-gray-800">{ago(info.last_anchor.at)}</span>
          <span className="text-blue-600">↗</span>
        </a>
      )}
    </div>
  );
}
