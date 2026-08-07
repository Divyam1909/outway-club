import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/** Approve or unpublish a submitted review. */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminApi();
  if ("response" in guard) return guard.response;

  const { id } = await context.params;

  let body: { isApproved?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  if (typeof body.isApproved !== "boolean") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("reviews")
    .update({ is_approved: body.isApproved })
    .eq("id", id);

  if (error) {
    console.error("[admin/reviews] update failed:", error.message);
    return NextResponse.json({ error: "Couldn't update that review." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

/** Permanently delete a review — used for spam and abuse, not criticism. */
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminApi();
  if ("response" in guard) return guard.response;

  const { id } = await context.params;
  const admin = createAdminClient();
  const { error } = await admin.from("reviews").delete().eq("id", id);

  if (error) {
    console.error("[admin/reviews] delete failed:", error.message);
    return NextResponse.json({ error: "Couldn't delete that review." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
