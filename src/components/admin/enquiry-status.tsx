"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "closed", label: "Closed" },
] as const;

export function EnquiryStatus({ enquiryId, status }: { enquiryId: string; status: string }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);

  async function handleChange(next: string) {
    const previous = value;
    setValue(next);
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/enquiries/${enquiryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!response.ok) {
        setValue(previous);
      } else {
        router.refresh();
      }
    } catch {
      setValue(previous);
    } finally {
      setSaving(false);
    }
  }

  return (
    <label className="flex items-center gap-2 text-xs text-ink-400">
      <span className="sr-only">Enquiry status</span>
      <select
        value={value}
        disabled={saving}
        onChange={(event) => handleChange(event.target.value)}
        className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-ink-700 focus:border-pine focus:outline-none"
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
