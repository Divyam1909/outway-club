"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { friendlyError, networkError } from "@/lib/error-messages";

/**
 * Deleting a trip is routinely refused by the database — bookings reference
 * it, and that constraint is what stops a paid customer's trip vanishing.
 *
 * The refusal has to be shown. Discarding the result and refreshing anyway
 * makes a blocked delete look like a successful one until the row reappears,
 * which reads as the console being broken rather than as a rule doing its job.
 */
export function DeleteTripButton({ tripId, tripTitle }: { tripId: string; tripTitle: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!window.confirm(`Delete "${tripTitle}"? This cannot be undone.`)) return;

    setDeleting(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase.from("trips").delete().eq("id", tripId);

      if (deleteError) {
        setError(
          deleteError.code === "23503"
            ? "This trip has bookings against it, so it can't be deleted. Unpublish it instead — that hides it from the site and keeps the booking history intact."
            : friendlyError(deleteError, "trip", "Couldn't delete that trip. Please try again.")
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
        className="flex items-center gap-1.5 text-sm text-clay hover:text-clay-600 disabled:opacity-50"
      >
        <Trash2 size={14} /> {deleting ? "Deleting…" : "Delete"}
      </button>
      {error && (
        <span role="alert" className="mt-1 max-w-[18rem] text-right text-xs leading-relaxed text-clay-600">
          {error}
        </span>
      )}
    </span>
  );
}
