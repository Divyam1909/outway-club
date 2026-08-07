"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { messageFromResponse, networkError } from "@/lib/error-messages";

const OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "closed", label: "Closed" },
] as const;

/**
 * The dropdown updates optimistically, so a failed save has to roll the value
 * back — and rolling it back silently is worse than not saving at all: the
 * admin sees the status flick to what they picked and then quietly return,
 * with no way to tell a rejected write from a slow one. The revert now always
 * comes with the reason.
 */
export function EnquiryStatus({ enquiryId, status }: { enquiryId: string; status: string }) {
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
      const response = await fetch(`/api/admin/enquiries/${enquiryId}`, {
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
      <label className="flex items-center gap-2 text-xs text-ink-400">
        <span className="sr-only">Enquiry status</span>
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
