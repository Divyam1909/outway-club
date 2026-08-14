import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const STATUSES = new Set(["new", "contacted", "confirmed", "closed"]);

/** Move a booking request through new → contacted → confirmed → closed. */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminApi();
  if ("response" in guard) return guard.response;

  const { id } = await context.params;

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  if (!body.status || !STATUSES.has(body.status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("trip_requests").update({ status: body.status }).eq("id", id);

  if (error) {
    console.error("[admin/trip-requests] update failed:", error.message);
    return NextResponse.json({ error: "Couldn't update that request." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
