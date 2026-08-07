import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const STATUSES = new Set(["new", "contacted", "closed"]);

/** Move an enquiry through new → contacted → closed. */
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
  const { error } = await admin.from("enquiries").update({ status: body.status }).eq("id", id);

  if (error) {
    console.error("[admin/enquiries] update failed:", error.message);
    return NextResponse.json({ error: "Couldn't update that enquiry." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
