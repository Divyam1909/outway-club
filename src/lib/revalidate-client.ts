import type { ContentScope } from "@/lib/revalidate";

/**
 * Asks the server to purge the public pages a just-saved edit affects.
 *
 * For the admin screens that write to Supabase directly from the browser.
 * Deliberately never throws and never reports: the record is already saved by
 * the time this runs, and failing a save with "couldn't clear the cache" would
 * be both alarming and wrong. A missed purge means the page refreshes on its
 * own timer instead — the behaviour before any of this existed.
 */
export async function revalidatePublicPages(
  scope: ContentScope,
  slug?: string | null
): Promise<void> {
  try {
    await fetch("/api/admin/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope, slug: slug ?? null }),
      keepalive: true,
    });
  } catch {
    // Intentionally silent — see above.
  }
}
