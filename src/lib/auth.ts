import { redirect } from "next/navigation";
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
