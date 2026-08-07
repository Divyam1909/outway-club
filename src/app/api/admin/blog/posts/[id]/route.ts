import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildBlogPostPayload } from "@/lib/blog-payload";

/** Update a journal post. Body is re-sanitised on every save. */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminApi();
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
  const { data, error } = await admin
    .from("blog_posts")
    .update(result.payload)
    .eq("id", id)
    .select("id, slug")
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

  return NextResponse.json({ ok: true, id: data.id, slug: data.slug });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminApi();
  if ("response" in guard) return guard.response;

  const { id } = await context.params;
  const admin = createAdminClient();
  const { error } = await admin.from("blog_posts").delete().eq("id", id);

  if (error) {
    console.error("[admin/blog] delete failed:", error.message);
    return NextResponse.json({ error: "Couldn't delete that post." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
