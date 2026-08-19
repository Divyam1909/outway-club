import "server-only";

import { site } from "@/config/site";

/**
 * IndexNow — tell the non-Google engines a page changed, instead of waiting.
 *
 * This is the single highest-leverage thing a small site can do about showing
 * up somewhere other than Google. Google runs its own discovery and ignores
 * IndexNow; everybody else is slower to find a new site and faster to act on a
 * direct ping. One POST reaches Bing, Yandex, Seznam, Naver and Yep, and Bing's
 * index is what DuckDuckGo, Ecosia, Yahoo and a large share of Brave's results
 * are built on — so "we published a trip" propagates in hours rather than the
 * weeks a fresh domain waits to be recrawled.
 *
 * Two requirements, both handled:
 *
 *   1. A key, and a file at https://host/<key>.txt containing exactly that key.
 *      `INDEXNOW_KEY` supplies it and `public/<key>.txt` is the file. Without
 *      the file the API answers 403 and nothing is submitted, which is why this
 *      is a no-op when the variable is unset rather than a best-effort guess.
 *   2. Every URL submitted must be on the host that owns the key. Anything else
 *      gets the whole batch rejected, so URLs are built from `site.url` here
 *      rather than accepted from callers.
 *
 * Fire-and-forget by design. This is called after a write that has already
 * succeeded, and a search engine being unreachable must never turn into a
 * failed publish.
 */

const ENDPOINT = "https://api.indexnow.org/indexnow";

export function isIndexNowConfigured(): boolean {
  return Boolean(process.env.INDEXNOW_KEY && site.host && !site.host.startsWith("localhost"));
}

/**
 * Submit one or more paths ("/blog/my-post", "/trips/udaipur-jawai").
 *
 * Paths, not URLs: the host is ours to decide, and a caller passing a full URL
 * for another domain is the one mistake that gets a key banned.
 */
export async function pingIndexNow(paths: string[]): Promise<void> {
  const key = process.env.INDEXNOW_KEY;
  if (!key || !isIndexNowConfigured()) return;

  const urlList = [...new Set(paths)]
    .filter((path) => path.startsWith("/"))
    .map((path) => `${site.url}${path}`);

  if (urlList.length === 0) return;

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: site.host,
        key,
        keyLocation: `${site.url}/${key}.txt`,
        urlList,
      }),
    });

    // 200 and 202 both mean accepted. 422 means a URL didn't belong to the
    // host, 403 means the key file is missing or wrong — both are worth seeing
    // in the logs, because the failure is otherwise completely silent.
    if (!response.ok && response.status !== 202) {
      console.error(`[indexnow] ${response.status} for ${urlList.length} url(s)`);
    }
  } catch (error) {
    console.error("[indexnow] submit threw:", error);
  }
}
