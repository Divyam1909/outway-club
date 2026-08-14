"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * A value someone has to retype into their banking app, with a button so they
 * don't have to.
 *
 * An account number typed by hand is the one part of a manual payment that
 * actually goes wrong, and it goes wrong silently — the money leaves and lands
 * somewhere else. The value stays selectable text as well as copyable, because
 * `navigator.clipboard` is unavailable on insecure origins and inside some
 * in-app browsers, and the fallback there is to select it by hand.
 */
export function CopyValue({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked. The value is select-all-able either way, so there
      // is nothing useful to say here beyond not pretending it worked.
    }
  }

  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border py-2.5 last:border-b-0">
      <span className="text-xs uppercase tracking-[0.12em] text-ink-500">{label}</span>
      <span className="flex items-center gap-2">
        <span className="select-all break-all font-mono text-sm font-medium text-ink">{value}</span>
        <button
          type="button"
          onClick={copy}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-pine-50 hover:text-pine"
        >
          {copied ? (
            <Check size={14} className="text-pine" aria-hidden="true" />
          ) : (
            <Copy size={14} aria-hidden="true" />
          )}
          <span className="sr-only">{copied ? `${label} copied` : `Copy ${label}`}</span>
        </button>
        <output aria-live="polite" className="sr-only">
          {copied ? `${label} copied` : ""}
        </output>
      </span>
    </div>
  );
}
