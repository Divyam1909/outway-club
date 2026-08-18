import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // `sitemap.xml` and `robots.txt` are excluded alongside the static assets.
  // Neither has a user, but both were still running `updateSession`, which
  // makes a live `supabase.auth.getUser()` call — a network round trip in the
  // request path of the two routes crawlers hit most, and a failure mode that
  // would surface as an intermittent fetch error rather than anything obvious.
  // The extension alternation below does not cover them: it lists image types
  // only, so `.xml` and `.txt` need naming outright.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
