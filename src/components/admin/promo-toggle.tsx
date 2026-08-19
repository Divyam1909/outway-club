"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Power, PowerOff, Trash2 } from "lucide-react";
import { messageFromResponse, networkError } from "@/lib/error-messages";

/**
 * Stop a code, or delete one that never ran.
 *
 * The switch is the primary action and delete is the quiet one, which is the
 * right way round: a code being abused needs stopping in one click, and a code
 * that has already been used should never be deleted at all — the server
 * refuses, because `promo_redemptions` is what a collaborator gets paid on.
 */
export function PromoToggle({
  promoId,
  code,
  isActive,
  redemptionCount,
}: {
  promoId: string;
  code: string;
  isActive: boolean;
  redemptionCount: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    if (
      isActive &&
      !window.confirm(`Switch ${code} off? Nobody will be able to apply it from that moment.`)
    ) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/promo-codes/${promoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!response.ok) {
        setError(await messageFromResponse(response, "Couldn't change that code."));
        setBusy(false);
        return;
      }
      router.refresh();
      setBusy(false);
    } catch {
      setError(networkError());
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete ${code} for good? This cannot be undone.`)) return;

    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/promo-codes/${promoId}`, { method: "DELETE" });
      if (!response.ok) {
        setError(await messageFromResponse(response, "Couldn't delete that code."));
        setBusy(false);
        return;
      }
      router.refresh();
      setBusy(false);
    } catch {
      setError(networkError());
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <span className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          disabled={busy}
          className="flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-pine disabled:opacity-50"
        >
          {isActive ? <PowerOff size={14} /> : <Power size={14} />}
          {isActive ? "Switch off" : "Switch on"}
        </button>

        {/* Only offered when it can actually succeed — the server refuses to
            delete a code with redemptions, and an always-visible button that
            always errors is worse than no button. */}
        {redemptionCount === 0 && (
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="flex items-center gap-1.5 text-sm text-clay hover:text-clay-600 disabled:opacity-50"
          >
            <Trash2 size={14} /> Delete
          </button>
        )}
      </span>
      {error && <span className="max-w-xs text-right text-xs text-clay-600">{error}</span>}
    </span>
  );
}
