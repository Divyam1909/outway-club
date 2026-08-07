"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, EyeOff, Trash2 } from "lucide-react";
import { messageFromResponse, networkError } from "@/lib/error-messages";

export function ReviewModeration({ reviewId, isApproved }: { reviewId: string; isApproved: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setApproval(next: boolean) {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: next }),
      });
      if (!response.ok) {
        setError(
          await messageFromResponse(
            response,
            next ? "Couldn't publish that review." : "Couldn't unpublish that review."
          )
        );
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

  async function handleDelete() {
    if (
      !window.confirm(
        "Delete this review permanently? Only do this for spam or abuse — never because a review is critical."
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, { method: "DELETE" });
      if (!response.ok) {
        setError(await messageFromResponse(response, "Couldn't delete that review."));
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
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <div className="flex flex-wrap gap-2">
        {isApproved ? (
          <button
            type="button"
            onClick={() => setApproval(false)}
            disabled={loading}
            className="btn-outline !px-3 !py-1.5 text-xs"
          >
            <EyeOff size={13} /> Unpublish
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setApproval(true)}
            disabled={loading}
            className="btn-primary !px-3 !py-1.5 text-xs"
          >
            <Check size={13} /> Publish
          </button>
        )}
        <button
          type="button"
          onClick={handleDelete}
          disabled={loading}
          aria-label="Delete review"
          className="btn-outline !px-2.5 !py-1.5 text-xs text-clay hover:border-clay hover:text-clay-600"
        >
          <Trash2 size={13} />
        </button>
      </div>
      {error && <span className="text-xs text-clay-600">{error}</span>}
    </div>
  );
}
