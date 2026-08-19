import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import type { Profile } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

export interface CurrentUser {
  user: User;
  profile: Profile | null;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile: profile as Profile | null };
}

export async function requireAdmin(): Promise<CurrentUser> {
  const current = await getCurrentUser();
  if (!current || current.profile?.role !== "admin") {
    throw new Error("Not authorized");
  }
  return current;
}

// For Server Components / pages — redirects instead of throwing.
export async function requireAdminPage(): Promise<CurrentUser> {
  const current = await getCurrentUser();
  if (!current || current.profile?.role !== "admin") {
    redirect("/");
  }
  return current;
}

/**
 * For Route Handlers. Returns the admin user, or a ready-to-return error
 * response — so callers can `if ("response" in guard) return guard.response;`
 * without a try/catch around every admin endpoint.
 */
export async function requireAdminApi(): Promise<
  { current: CurrentUser } | { response: NextResponse }
> {
  const current = await getCurrentUser();
  if (!current) {
    return {
      response: NextResponse.json({ error: "Please sign in." }, { status: 401 }),
    };
  }
  if (current.profile?.role !== "admin") {
    return {
      response: NextResponse.json({ error: "Admins only." }, { status: 403 }),
    };
  }
  return { current };
}

// ---------------------------------------------------------------------------
// Journal editors
//
// A `blogger` is an admin of the Journal and nothing else. Every blog route
// asks these three instead of the admin ones; every other admin route keeps
// asking the admin ones, which is what confines the role.
// ---------------------------------------------------------------------------

export function isBlogEditor(current: CurrentUser | null): boolean {
  return current?.profile?.role === "admin" || current?.profile?.role === "blogger";
}

export async function requireBlogEditor(): Promise<CurrentUser> {
  const current = await getCurrentUser();
  if (!isBlogEditor(current)) throw new Error("Not authorized");
  return current!;
}

/** For Server Components / pages — redirects instead of throwing. */
export async function requireBlogEditorPage(): Promise<CurrentUser> {
  const current = await getCurrentUser();
  if (!isBlogEditor(current)) redirect("/");
  return current!;
}

export async function requireBlogEditorApi(): Promise<
  { current: CurrentUser } | { response: NextResponse }
> {
  const current = await getCurrentUser();
  if (!current) {
    return {
      response: NextResponse.json({ error: "Please sign in." }, { status: 401 }),
    };
  }
  if (!isBlogEditor(current)) {
    return {
      response: NextResponse.json(
        { error: "You don't have access to the Journal." },
        { status: 403 }
      ),
    };
  }
  return { current };
}

/**
 * Any signed-in account, for the reader-submission endpoints.
 *
 * Submitting an article requires an account — not as a gate on the writing, but
 * so an accepted piece has a real byline behind it and a rejected one has
 * somewhere to be explained. Nothing here grants publishing rights.
 */
export async function requireUserApi(): Promise<
  { current: CurrentUser } | { response: NextResponse }
> {
  const current = await getCurrentUser();
  if (!current) {
    return {
      response: NextResponse.json(
        { error: "Please sign in to send us a piece." },
        { status: 401 }
      ),
    };
  }
  return { current };
}
