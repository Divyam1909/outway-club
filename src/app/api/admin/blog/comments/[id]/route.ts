import { NextResponse } from "next/server";
import { requireBlogEditorApi } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidateContent } from "@/lib/revalidate";
import type { SupabaseClient } from "@supabase/supabase-js";

/** The article a comment sits on — the only page a comment edit can change. */
async function postSlugForComment(
  admin: SupabaseClient,
  commentId: string
): Promise<string | null> {
  const { data } = await admin
    .from("blog_comments")
    .select("post:blog_posts(slug)")
    .eq("id", commentId)
    .maybeSingle();

  const post = data?.post as { slug?: string } | { slug?: string }[] | null | undefined;
  const row = Array.isArray(post) ? post[0] : post;
  return row?.slug ?? null;
}

/** Publish or hide a reader comment. */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requireBlogEditorApi();
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

  // Approving a comment has to show up on the article now, not in five minutes.
  revalidateContent("comment", await postSlugForComment(admin, id));

  return NextResponse.json({ ok: true });
}

/** Permanently delete a comment — for spam and abuse, not disagreement. */
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requireBlogEditorApi();
  if ("response" in guard) return guard.response;

  const { id } = await context.params;
  const admin = createAdminClient();

  // Resolved before the delete, while the row still points at its post.
  const slug = await postSlugForComment(admin, id);

  const { error } = await admin.from("blog_comments").delete().eq("id", id);

  if (error) {
    console.error("[admin/blog-comments] delete failed:", error.message);
    return NextResponse.json({ error: "Couldn't delete that comment." }, { status: 500 });
  }

  revalidateContent("comment", slug);

  return NextResponse.json({ ok: true });
}
