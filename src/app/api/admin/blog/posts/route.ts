import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildBlogPostPayload } from "@/lib/blog-payload";
import { revalidateContent } from "@/lib/revalidate";

/**
 * Create a journal post.
 *
 * The editor is a contentEditable surface, so the body arrives as browser HTML
 * and is rebuilt from an allowlist inside buildBlogPostPayload before it is
 * stored. That's why posts are written through this route rather than straight
 * from the browser with the anon key like trips are — the sanitiser has to run
 * somewhere the author can't skip.
 */
export async function POST(request: Request) {
  const guard = await requireAdminApi();
  if ("response" in guard) return guard.response;

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
    .insert({ ...result.payload, author_id: guard.current.user.id })
    .select("id, slug")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A post already uses that web address. Change the slug and try again." },
        { status: 409 }
      );
    }
    console.error("[admin/blog] insert failed:", error.message);
    return NextResponse.json({ error: "Couldn't save the post." }, { status: 500 });
  }

  revalidateContent("post", data.slug);

  return NextResponse.json({ ok: true, id: data.id, slug: data.slug });
}
