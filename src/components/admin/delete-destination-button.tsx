"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { friendlyError, networkError } from "@/lib/error-messages";

/**
 * Deleting a destination that trips point at is blocked by the database
 * (trips.destination_id is ON DELETE RESTRICT). That's the right behaviour —
 * it stops a trip losing the place it goes to — so the button explains it in
 * plain language instead of showing the Postgres error.
 */
export function DeleteDestinationButton({
  destinationId,
  name,
  tripCount,
}: {
  destinationId: string;
  name: string;
  tripCount: number;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const blocked = tripCount > 0;

  async function handleDelete() {
    if (blocked) {
      setError(
        `${tripCount} trip${tripCount === 1 ? "" : "s"} still point here. Move or delete ${tripCount === 1 ? "it" : "them"} first.`
      );
      return;
    }
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;

    setDeleting(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase
        .from("destinations")
        .delete()
        .eq("id", destinationId);

      if (deleteError) {
        setError(
          deleteError.code === "23503"
            ? "A trip still points at this destination, so it can't be deleted."
            : friendlyError(
                deleteError,
                "destination",
                "Couldn't delete that destination. Please try again."
              )
        );
        setDeleting(false);
        return;
      }

      router.refresh();
      setDeleting(false);
    } catch {
      setError(networkError());
      setDeleting(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        title={blocked ? `${tripCount} trip(s) still use this destination` : undefined}
        className="flex items-center gap-1.5 text-sm text-clay hover:text-clay-600 disabled:opacity-50"
      >
        <Trash2 size={14} /> {deleting ? "Deleting…" : "Delete"}
      </button>
      {error && <span className="mt-1 max-w-[15rem] text-right text-xs text-clay-600">{error}</span>}
    </span>
  );
}
