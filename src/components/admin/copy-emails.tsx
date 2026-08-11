"use client";

import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";

/**
 * Bulk export for the waitlist — clipboard for a quick BCC, CSV for a real send.
 *
 * The clipboard API is blocked outright on insecure origins and in some
 * browsers without a user gesture. A blocked copy that says nothing is
 * indistinguishable from a successful one until you paste into an email and
 * find it empty, so both outcomes are reported.
 */
export function CopyEmails({ emails }: { emails: string[] }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCopy() {
    setError(null);

    if (emails.length === 0) {
      setError("There are no addresses on the waitlist yet.");
      return;
    }

    try {
      await navigator.clipboard.writeText(emails.join(", "));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Your browser blocked clipboard access. Use the CSV button instead, same list.");
    }
  }

  function handleDownload() {
    setError(null);

    if (emails.length === 0) {
      setError("There are no addresses on the waitlist yet.");
      return;
    }

    try {
      const csv = ["email", ...emails].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `outway-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Couldn't build the CSV file. Try the copy button instead.");
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex gap-2">
        <button type="button" onClick={handleCopy} className="btn-outline btn-sm">
          {copied ? (
            <>
              <Check size={13} /> Copied
            </>
          ) : (
            <>
              <Copy size={13} /> Copy all
            </>
          )}
        </button>
        <button type="button" onClick={handleDownload} className="btn-outline btn-sm">
          <Download size={13} /> CSV
        </button>
      </div>

      {error && (
        <span role="alert" className="max-w-[18rem] text-right text-xs leading-relaxed text-clay-600">
          {error}
        </span>
      )}
    </div>
  );
}
