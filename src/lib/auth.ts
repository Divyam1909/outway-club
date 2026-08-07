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
