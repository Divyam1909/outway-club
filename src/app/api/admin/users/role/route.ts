import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Role } from "@/lib/types";

const ROLES: Role[] = ["customer", "blogger", "admin"];

/**
 * Set a user's role. Replaces the "run this SQL by hand" step.
 *
 * Three roles: `customer`, `blogger` (the Journal and nothing else) and
 * `admin`. Only an admin can call this, so a blogger cannot promote themselves
 * — and the database's own role guard in 0002_launch.sql backs that up in case
 * this route is ever bypassed.
 */
export async function POST(request: Request) {
  const guard = await requireAdminApi();
  if ("response" in guard) return guard.response;

  let body: { userId?: string; role?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const { userId, role } = body;

  if (!userId || !ROLES.includes(role as Role)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // An admin stepping down would lock the console if they're the last one —
  // check before, not after. Moving to `blogger` counts: it takes away every
  // admin screen, including this one.
  if (userId === guard.current.user.id && role !== "admin") {
    const admin = createAdminClient();
    const { count } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");

    if ((count ?? 0) <= 1) {
      return NextResponse.json(
        { error: "You're the only admin, promote someone else before stepping down." },
        { status: 409 }
      );
    }
  }

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ role }).eq("id", userId);

  if (error) {
    console.error("[admin/users/role] update failed:", error.message);
    return NextResponse.json({ error: "Couldn't update that user." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, role });
}
