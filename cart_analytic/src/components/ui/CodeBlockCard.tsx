"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          window.setTimeout(() => setDone(false), 2000);
        } catch {
          /* Алдааг зориуд үл тооно. */
        }
      }}
      className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[0.6875rem] font-semibold uppercase tracking-wide text-white hover:bg-white/10"
    >
      {done ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {done ? "Хуулагдсан" : "Хуулах"}
    </button>
  );
}

export default function CodeBlockCard({ code, language }: { code: string; language?: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-md">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
        <span className="text-[0.6875rem] font-mono text-slate-400">{language ?? "code"}</span>
        <CopyButton text={code} />
      </div>
      <pre className="p-4 text-xs leading-relaxed text-slate-100 overflow-x-auto font-mono">{code}</pre>
    </div>
  );
}
