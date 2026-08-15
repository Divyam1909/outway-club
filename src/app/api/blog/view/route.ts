import { NextResponse } from "next/server";
import { recordPostView } from "@/lib/blog";
import { RATE_LIMITS, rateLimitRequest, sanitizeText } from "@/lib/rate-limit";

/**
 * Counts one read of a journal post.
 *
 * This used to happen during the page render. That stopped being correct the
 * moment the article page became cacheable: the render now runs once per
 * revalidation window, not once per reader, so a server-side counter would
 * report roughly "how often the cache expired". Counting from the browser puts
 * it back to one increment per actual reader.
 *
 * Always answers 204, whatever happened. A view counter is not worth surfacing
 * an error to a reader over, and a bot learning nothing from the response is a
 * small bonus.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const slug = sanitizeText(body.slug, 200);
    if (!slug) return new NextResponse(null, { status: 204 });

    // Keyed by IP + slug, so one determined tab can't inflate a single post
    // while a shared office IP can still read the whole journal.
    if (!(await rateLimitRequest(RATE_LIMITS.blogView, request, slug))) {
      return new NextResponse(null, { status: 204 });
    }

    await recordPostView(slug);
  } catch {
    // Swallowed deliberately — see above.
  }

  return new NextResponse(null, { status: 204 });
}
