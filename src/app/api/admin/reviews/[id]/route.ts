import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidateContent } from "@/lib/revalidate";
import type { SupabaseClient } from "@supabase/supabase-js";

/** The trip a review belongs to, so only that trip page is purged. */
async function tripSlugForReview(
  admin: SupabaseClient,
  reviewId: string
): Promise<string | null> {
  const { data } = await admin
    .from("reviews")
    .select("trip:trips(slug)")
    .eq("id", reviewId)
    .maybeSingle();

  const trip = data?.trip as { slug?: string } | { slug?: string }[] | null | undefined;
  const row = Array.isArray(trip) ? trip[0] : trip;
  return row?.slug ?? null;
}

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

  // Also moves the trip's rating and review count, which the JSON-LD reads.
  revalidateContent("review", await tripSlugForReview(admin, id));

  return NextResponse.json({ ok: true });
}

/** Permanently delete a review — used for spam and abuse, not criticism. */
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminApi();
  if ("response" in guard) return guard.response;

  const { id } = await context.params;
  const admin = createAdminClient();

  // Resolved before the delete, while the row still points at its trip.
  const slug = await tripSlugForReview(admin, id);

  const { error } = await admin.from("reviews").delete().eq("id", id);

  if (error) {
    console.error("[admin/reviews] delete failed:", error.message);
    return NextResponse.json({ error: "Couldn't delete that review." }, { status: 500 });
  }

  revalidateContent("review", slug);

  return NextResponse.json({ ok: true });
}
