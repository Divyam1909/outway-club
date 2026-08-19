import { NextResponse } from "next/server";
import { requireBlogEditorApi } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidateContent } from "@/lib/revalidate";
import { notifyWriter } from "@/lib/blog-review";
import { sanitizeMultiline } from "@/lib/rate-limit";

/**
 * Accept or decline a submission.
 *
 * Split out from the ordinary post PATCH on purpose. That route is for editing
 * an article; this one is for the decision, and the decision has consequences
 * the editor screen shouldn't have to remember: the page has to be purged so
 * the piece is genuinely live the moment it's approved, and the writer has to
 * be told either way.
 *
 * "Instantly visible, with no formatting surprises" is not a hope here — an
 * approved post renders through exactly the same path as one we wrote
 * ourselves, from HTML that was already sanitised at submission, and
 * `revalidateContent` drops the cached /blog and /blog/[slug] entries before
 * this returns.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requireBlogEditorApi();
  if ("response" in guard) return guard.response;

  const { id } = await context.params;

  let body: { action?: string; note?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const action = body.action;
  if (action !== "publish" && action !== "decline" && action !== "unpublish") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const note = sanitizeMultiline(body.note, 1500) || null;
  const admin = createAdminClient();

  const { data: post } = await admin
    .from("blog_posts")
    .select("id, slug, title, status, source, author_name, submitter_email")
    .eq("id", id)
    .maybeSingle();

  if (!post) {
    return NextResponse.json({ error: "That post no longer exists." }, { status: 404 });
  }

  const nextStatus =
    action === "publish" ? "published" : action === "decline" ? "rejected" : "draft";

  const { error } = await admin
    .from("blog_posts")
    .update({
      status: nextStatus,
      review_note: note,
      reviewed_by: guard.current.user.id,
      // Stamped by the trigger on a submitted → decided transition; set here
      // too so an unpublish (which the trigger ignores) still records who and
      // when.
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("[admin/blog/review] update failed:", error.message);
    return NextResponse.json({ error: "Couldn't record that decision." }, { status: 500 });
  }

  revalidateContent("post", post.slug);

  await notifyWriter({
    slug: post.slug,
    title: post.title,
    authorName: post.author_name,
    submitterEmail: post.submitter_email,
    source: post.source,
    previousStatus: post.status,
    nextStatus: nextStatus,
    note,
  });

  return NextResponse.json({ ok: true, status: nextStatus, slug: post.slug });
}
