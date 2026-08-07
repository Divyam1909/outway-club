import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Promote or demote a user. Replaces the "run this SQL by hand" step —
 * admin rights are now granted from /admin/users.
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

  if (!userId || (role !== "admin" && role !== "customer")) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // An admin demoting themselves would lock the console if they're the last
  // one — check before, not after.
  if (userId === guard.current.user.id && role === "customer") {
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
