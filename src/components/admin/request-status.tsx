"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { messageFromResponse, networkError } from "@/lib/error-messages";

const OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "confirmed", label: "Confirmed" },
  { value: "closed", label: "Closed" },
] as const;

/**
 * Same optimistic-with-rollback contract as EnquiryStatus: the dropdown moves
 * immediately, and a rejected save puts it back *with the reason*, because a
 * value that silently returns to where it was is indistinguishable from a slow
 * network.
 */
export function RequestStatus({ requestId, status }: { requestId: string; status: string }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(next: string) {
    const previous = value;
    setValue(next);
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/trip-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });

      if (!response.ok) {
        setValue(previous);
        setError(await messageFromResponse(response, "Couldn't save that status. Try again."));
        return;
      }

      router.refresh();
    } catch {
      setValue(previous);
      setError(networkError());
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <label className="flex items-center gap-2 text-xs text-ink-500">
        <span className="sr-only">Request status</span>
        <select
          value={value}
          disabled={saving}
          onChange={(event) => handleChange(event.target.value)}
          className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-ink-700 focus:border-pine focus:outline-none disabled:opacity-60"
        >
          {OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {error && (
        <span role="alert" className="max-w-[16rem] text-right text-xs text-clay-600">
          {error}
        </span>
      )}
    </div>
  );
}
