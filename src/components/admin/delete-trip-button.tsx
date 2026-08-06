"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function DeleteTripButton({ tripId, tripTitle }: { tripId: string; tripTitle: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${tripTitle}"? This cannot be undone.`)) return;
    setDeleting(true);
    const supabase = createClient();
    await supabase.from("trips").delete().eq("id", tripId);
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="flex items-center gap-1.5 text-sm text-clay hover:text-clay-600 disabled:opacity-50"
    >
      <Trash2 size={14} /> {deleting ? "Deleting…" : "Delete"}
    </button>
  );
}
