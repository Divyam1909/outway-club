"use client";

import { useEffect, useRef } from "react";

/**
 * Fires one view count for a post, from the reader's browser.
 *
 * Renders nothing. Lives on the client because the article page is now cached —
 * see the route handler for why counting during render stopped being accurate.
 * Failures are ignored entirely: nobody's reading experience should depend on
 * a statistic.
 */
export function RecordView({ slug }: { slug: string }) {
  const sent = useRef(false);

  useEffect(() => {
    // StrictMode double-mounts in development, and this must not double-count.
    if (sent.current) return;
    sent.current = true;

    // keepalive so the count still lands if the reader navigates away in the
    // moment between mount and response.
    void fetch("/api/blog/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
      keepalive: true,
    }).catch(() => {});
  }, [slug]);

  return null;
}
