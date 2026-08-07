"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { messageFromResponse, networkError } from "@/lib/error-messages";

export function DeletePostButton({ postId, title }: { postId: string; title: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (
      !window.confirm(
        `Delete "${title}"? Its comments go with it, and any link to it will 404. This cannot be undone.`
      )
    ) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/blog/posts/${postId}`, { method: "DELETE" });
      if (!response.ok) {
        setError(await messageFromResponse(response, "Couldn't delete that post."));
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
      {error && <span className="mt-1 text-xs text-clay-600">{error}</span>}
    </span>
  );
}
