"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { messageFromResponse, networkError } from "@/lib/error-messages";

/**
 * Replaces the old "run an UPDATE against profiles by hand" step.
 * The server route refuses to demote the last remaining admin.
 */
export function RoleToggle({
  userId,
  role,
  name,
  isSelf,
}: {
  userId: string;
  role: "customer" | "admin";
  name: string;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextRole = role === "admin" ? "customer" : "admin";

  async function handleToggle() {
    const message =
      nextRole === "admin"
        ? `Give ${name} full admin access? They'll be able to see every booking, customer and payment.`
        : `Remove admin access from ${name}${isSelf ? " (that's you)" : ""}?`;

    if (!window.confirm(message)) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/users/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: nextRole }),
      });

      if (!response.ok) {
        setError(await messageFromResponse(response, "Couldn't update that user's access."));
        setLoading(false);
        return;
      }

      router.refresh();
      setLoading(false);
    } catch {
      setError(networkError());
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        className="btn-outline btn-sm"
      >
        {role === "admin" ? (
          <>
            <ShieldOff size={13} /> Remove admin
          </>
        ) : (
          <>
            <ShieldCheck size={13} /> Make admin
          </>
        )}
      </button>
      {error && <span className="text-right text-xs text-clay-600">{error}</span>}
    </div>
  );
}
