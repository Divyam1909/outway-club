import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { isContentScope, revalidateContent } from "@/lib/revalidate";

/**
 * Purges cached public pages after an admin edit.
 *
 * The blog and moderation endpoints revalidate inline, because the write goes
 * through a route handler and the cache API is right there. Trips and
 * destinations are written straight from the browser to Supabase under RLS
 * (see trip-editor-form.tsx), so there is no server step to hang it on — this
 * is that step.
 *
 * Admin-only, and it takes a scope from a fixed set rather than an arbitrary
 * path. Letting a caller name any path to purge would hand an authenticated
 * user a cheap way to force regeneration of the whole site on demand.
 */
export async function POST(request: Request) {
  const guard = await requireAdminApi();
  if ("response" in guard) return guard.response;

  let body: { scope?: unknown; slug?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  if (!isContentScope(body.scope)) {
    return NextResponse.json({ error: "Unknown scope." }, { status: 400 });
  }

  // A slug is a path segment, not free text — anything else is dropped rather
  // than concatenated into a path.
  const slug =
    typeof body.slug === "string" && /^[a-z0-9-]{1,200}$/i.test(body.slug) ? body.slug : null;

  revalidateContent(body.scope, slug);

  return NextResponse.json({ ok: true });
}
