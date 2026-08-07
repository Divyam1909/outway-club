import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/** Publish or hide a reader comment. */
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
    .from("blog_comments")
    .update({ is_approved: body.isApproved })
    .eq("id", id);

  if (error) {
    console.error("[admin/blog-comments] update failed:", error.message);
    return NextResponse.json({ error: "Couldn't update that comment." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

/** Permanently delete a comment — for spam and abuse, not disagreement. */
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminApi();
  if ("response" in guard) return guard.response;

  const { id } = await context.params;
  const admin = createAdminClient();
  const { error } = await admin.from("blog_comments").delete().eq("id", id);

  if (error) {
    console.error("[admin/blog-comments] delete failed:", error.message);
    return NextResponse.json({ error: "Couldn't delete that comment." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
