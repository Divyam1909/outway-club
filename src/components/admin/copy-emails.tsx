"use client";

import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";

/** Bulk export for the waitlist — clipboard for a quick BCC, CSV for a real send. */
export function CopyEmails({ emails }: { emails: string[] }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(emails.join(", "));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be blocked; the CSV download still works.
    }
  }

  function handleDownload() {
    const csv = ["email", ...emails].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `outway-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex gap-2">
      <button type="button" onClick={handleCopy} className="btn-outline !px-4 !py-2 text-xs">
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
      <button type="button" onClick={handleDownload} className="btn-outline !px-4 !py-2 text-xs">
        <Download size={13} /> CSV
      </button>
    </div>
  );
}
