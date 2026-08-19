import { NextResponse } from "next/server";
import { requireBlogEditorApi } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildBlogPostPayload } from "@/lib/blog-payload";
import { notifyWriter } from "@/lib/blog-review";
import { revalidateContent } from "@/lib/revalidate";

/** Update a journal post. Body is re-sanitised on every save. */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requireBlogEditorApi();
  if ("response" in guard) return guard.response;

  const { id } = await context.params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const result = buildBlogPostPayload(body);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const admin = createAdminClient();

  // Read the status before the write. An editor can decide a submission simply
  // by opening it and pressing Publish, and the contributor deserves the same
  // email they would have got from the approve button.
  const { data: before } = await admin
    .from("blog_posts")
    .select("status, source, submitter_email")
    .eq("id", id)
    .maybeSingle();

  const { data, error } = await admin
    .from("blog_posts")
    .update(result.payload)
    .eq("id", id)
    .select("id, slug, title, status, author_name")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Another post already uses that web address." },
        { status: 409 }
      );
    }
    console.error("[admin/blog] update failed:", error.message);
    return NextResponse.json({ error: "Couldn't save your changes." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "That post no longer exists." }, { status: 404 });
  }

  revalidateContent("post", data.slug);

  if (before) {
    await notifyWriter({
      slug: data.slug,
      title: data.title,
      authorName: data.author_name,
      submitterEmail: before.submitter_email,
      source: before.source,
      previousStatus: before.status,
      nextStatus: data.status,
      note: null,
    });
  }

  return NextResponse.json({ ok: true, id: data.id, slug: data.slug });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requireBlogEditorApi();
  if ("response" in guard) return guard.response;

  const { id } = await context.params;
  const admin = createAdminClient();

  // Read the slug before the row goes, or there is nothing left to purge with
  // and the deleted post keeps serving from cache until its timer expires.
  const { data: existing } = await admin
    .from("blog_posts")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  const { error } = await admin.from("blog_posts").delete().eq("id", id);

  if (error) {
    console.error("[admin/blog] delete failed:", error.message);
    return NextResponse.json({ error: "Couldn't delete that post." }, { status: 500 });
  }

  revalidateContent("post", existing?.slug ?? null);

  return NextResponse.json({ ok: true });
}
