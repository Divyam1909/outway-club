"use client";

import { useSession } from "@/lib/use-session";

/**
 * Renders children only for a signed-in visitor, decided in the browser.
 *
 * The server alternative — `getCurrentUser()` during render — reads cookies and
 * would make the whole page dynamic and uncacheable. This is for cosmetic
 * affordances like "write a review": showing the link to the wrong person costs
 * nothing, because the page it leads to does its own real auth check.
 *
 * Renders nothing while auth is resolving, so a signed-out visitor never sees a
 * link appear and vanish.
 */
export function SignedInOnly({ children }: { children: React.ReactNode }) {
  const { loading, isSignedIn } = useSession();
  if (loading || !isSignedIn) return null;
  return <>{children}</>;
}
