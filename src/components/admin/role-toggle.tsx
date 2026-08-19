"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { clsx } from "clsx";
import { messageFromResponse, networkError } from "@/lib/error-messages";
import type { Role } from "@/lib/types";

/**
 * Set someone's role, from /admin/users.
 *
 * A picker rather than the old on/off button, because there are three answers
 * now and the middle one is the point: a `blogger` gets the Journal — write,
 * edit, publish, moderate comments, approve reader submissions — and sees
 * nothing else. No bookings, no customers, no revenue, no promo codes.
 *
 * Each change is confirmed by name, and the confirmation spells out what the
 * role can actually do, because "make admin" is a sentence people click through
 * without reading and "can see every booking and payment" is not.
 */
const ROLES: { value: Role; label: string; blurb: string; confirm: string }[] = [
  {
    value: "customer",
    label: "Customer",
    blurb: "Books trips. No console access.",
    confirm: "remove all console access from",
  },
  {
    value: "blogger",
    label: "Blogger",
    blurb: "The Journal only — writes, publishes and moderates. Sees nothing commercial.",
    confirm:
      "give the Journal to — they can write, publish, edit and delete posts, moderate comments and approve reader submissions, and will see nothing else in the console:",
  },
  {
    value: "admin",
    label: "Admin",
    blurb: "Everything, including bookings, customers, payments and promo codes.",
    confirm:
      "give full admin access to — they will see every booking, customer, payment and promo code:",
  },
];

export function RoleToggle({
  userId,
  role,
  name,
  isSelf,
}: {
  userId: string;
  role: Role;
  name: string;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function setRole(next: Role) {
    if (next === role) return;

    const copy = ROLES.find((entry) => entry.value === next)!;
    const subject = isSelf ? `${name} (that's you)` : name;

    if (!window.confirm(`Are you sure you want to ${copy.confirm} ${subject}?`)) return;

    setLoading(next);
    setError(null);

    try {
      const response = await fetch("/api/admin/users/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: next }),
      });

      if (!response.ok) {
        setError(await messageFromResponse(response, "Couldn't update that user's access."));
        setLoading(null);
        return;
      }

      router.refresh();
      setLoading(null);
    } catch {
      setError(networkError());
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div
        role="group"
        aria-label={`Role for ${name}`}
        className="inline-flex rounded-full border border-border bg-white p-0.5"
      >
        {ROLES.map((entry) => {
          const active = entry.value === role;
          return (
            <button
              key={entry.value}
              type="button"
              onClick={() => setRole(entry.value)}
              disabled={loading !== null}
              aria-pressed={active}
              title={entry.blurb}
              className={clsx(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
                active ? "bg-pine text-cream-100" : "text-ink-500 hover:text-pine"
              )}
            >
              {loading === entry.value ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                active && entry.value !== "customer" && <ShieldCheck size={12} />
              )}
              {entry.label}
            </button>
          );
        })}
      </div>

      <span className="max-w-xs text-right text-[11px] leading-snug text-ink-500">
        {ROLES.find((entry) => entry.value === role)?.blurb}
      </span>

      {error && <span className="max-w-xs text-right text-xs text-clay-600">{error}</span>}
    </div>
  );
}
