"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Eye, X } from "lucide-react";
import { messageFromResponse, networkError } from "@/lib/error-messages";

/**
 * Accept or decline one submission.
 *
 * Publishing is one click and takes effect immediately — the server purges the
 * cached Journal pages before it answers, so "approved" and "live" are the same
 * moment rather than two things an editor has to believe happened.
 *
 * Declining opens a note field first, and deliberately does not let you skip
 * it: the note is the entire content of the email the writer gets, and "we're
 * not running this" with nothing after it is the reason people stop
 * contributing.
 */
export function SubmissionReview({
  postId,
  title,
  editHref,
}: {
  postId: string;
  title: string;
  editHref: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "publish" | "decline">(null);
  const [declining, setDeclining] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function decide(action: "publish" | "decline") {
    if (action === "publish" && !window.confirm(`Publish "${title}" now? It goes live immediately.`)) {
      return;
    }

    setBusy(action);
    setError(null);

    try {
      const response = await fetch(`/api/admin/blog/posts/${postId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: action === "decline" ? note : null }),
      });

      if (!response.ok) {
        setError(await messageFromResponse(response, "Couldn't record that decision."));
        setBusy(null);
        return;
      }

      setBusy(null);
      setDeclining(false);
      router.refresh();
    } catch {
      setError(networkError());
      setBusy(null);
    }
  }

  return (
    <div className="mt-4 border-t border-border pt-4">
      {declining ? (
        <div>
          <label htmlFor={`note-${postId}`} className="mb-1.5 block text-sm font-medium text-ink-700">
            What should we tell them?
          </label>
          <textarea
            id={`note-${postId}`}
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="It reads more like a listicle than a piece — if you rewrote it around the two days you actually spent there, we'd run it."
            className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm focus:border-pine focus:outline-none"
          />
          <p className="mt-1.5 text-xs text-ink-500">
            This is the whole email they get. Write it as though you're saying it to them.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => decide("decline")}
              disabled={busy !== null || note.trim().length < 15}
              className="btn-outline btn-sm"
            >
              {busy === "decline" ? "Sending…" : "Send and decline"}
            </button>
            <button
              type="button"
              onClick={() => {
                setDeclining(false);
                setError(null);
              }}
              className="btn-ghost btn-sm text-ink-500"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => decide("publish")}
            disabled={busy !== null}
            className="btn-primary btn-sm"
          >
            <Check size={14} /> {busy === "publish" ? "Publishing…" : "Publish now"}
          </button>
          <Link href={editHref} className="btn-outline btn-sm">
            <Eye size={14} /> Read &amp; edit first
          </Link>
          <button
            type="button"
            onClick={() => setDeclining(true)}
            disabled={busy !== null}
            className="btn-ghost btn-sm text-clay"
          >
            <X size={14} /> Decline
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 text-xs text-clay-600">
          {error}
        </p>
      )}
    </div>
  );
}
