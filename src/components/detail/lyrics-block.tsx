"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

interface LyricsBlockProps {
  lines: string[];
  title: string;
}

export function LyricsBlock({ lines, title }: LyricsBlockProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      toast.success("Lyrics copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <section className="rounded-2xl border border-white/5 bg-white/[0.03] p-6 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-white">Lyrics</h2>
        <button
          onClick={copy}
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/10 px-3.5 text-xs font-medium text-zinc-300 transition hover:border-white/25 hover:bg-white/5"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="mt-1 text-xs text-zinc-500">{title}</p>
      <div className="mt-5 space-y-2.5 text-[15px] leading-relaxed text-zinc-300">
        {lines.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    </section>
  );
}
