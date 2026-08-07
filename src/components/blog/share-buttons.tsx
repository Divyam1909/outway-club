"use client";

import { useState } from "react";
import { Check, Link2, MessageCircle, Share2 } from "lucide-react";

/**
 * Share a post. Uses the native share sheet where the browser offers one
 * (every mobile browser does), and falls back to explicit WhatsApp / X /
 * copy-link buttons on desktop.
 */
export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access denied — the URL bar is still right there.
    }
  }

  async function nativeShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // Cancelled by the reader; nothing to report.
        return;
      }
    }
    copy();
  }

  const base =
    "inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3.5 py-2 text-xs font-medium text-ink-700 transition-colors hover:border-pine hover:text-pine";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
        Share
      </span>

      <button type="button" onClick={nativeShare} className={base}>
        <Share2 size={13} /> Share
      </button>

      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${title}: ${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={base}
      >
        <MessageCircle size={13} /> WhatsApp
      </a>

      <button type="button" onClick={copy} className={base} aria-live="polite">
        {copied ? <Check size={13} className="text-pine" /> : <Link2 size={13} />}
        {copied ? "Link copied" : "Copy link"}
      </button>
    </div>
  );
}
