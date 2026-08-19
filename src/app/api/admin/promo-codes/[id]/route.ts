import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildPromoPayload } from "@/lib/promo-payload";
import { revalidateContent } from "@/lib/revalidate";

/**
 * Purge every page a code's price shows on.
 *
 * A code pinned to two trips changes the number on those two trip pages, the
 * catalogue and the homepage. Passing no slugs still refreshes the listings.
 */
async function revalidatePromoPages(admin: SupabaseClient, tripIds: string[]): Promise<void> {
  if (tripIds.length === 0) {
    revalidateContent("promo");
    return;
  }

  const { data } = await admin.from("trips").select("slug").in("id", tripIds);
  const slugs = (data ?? []).map((row) => row.slug as string);

  if (slugs.length === 0) {
    revalidateContent("promo");
    return;
  }
  for (const slug of slugs) revalidateContent("promo", slug);
}

/**
 * Update a code, or flip it on and off.
 *
 * A body of `{ isActive: false }` alone is treated as the switch rather than a
 * full edit, because that is the one action ops take in a hurry — a code being
 * abused has to be stoppable in one click without re-entering its terms.
 */
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

  const admin = createAdminClient();

  if (Object.keys(body).length === 1 && typeof body.isActive === "boolean") {
    const { data: toggled, error } = await admin
      .from("promo_codes")
      .update({ is_active: body.isActive, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("trip_ids")
      .maybeSingle();

    if (error) {
      console.error("[admin/promo-codes] toggle failed:", error.message);
      return NextResponse.json({ error: "Couldn't change that code." }, { status: 500 });
    }

    await revalidatePromoPages(admin, (toggled?.trip_ids as string[]) ?? []);
    return NextResponse.json({ ok: true });
  }

  const result = buildPromoPayload(body);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const { data, error } = await admin
    .from("promo_codes")
    .update({ ...result.payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, code, trip_ids")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Another code already uses that name." },
        { status: 409 }
      );
    }
    console.error("[admin/promo-codes] update failed:", error.message);
    return NextResponse.json({ error: "Couldn't save your changes." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "That code no longer exists." }, { status: 404 });
  }

  // Both sets of trips: the ones it runs on now, and the ones it just stopped
  // running on — the second list's pages are still printing the old discount.
  const affected = [
    ...new Set([...(result.payload.trip_ids ?? []), ...((data.trip_ids as string[]) ?? [])]),
  ];
  await revalidatePromoPages(admin, affected);

  return NextResponse.json({ ok: true, id: data.id, code: data.code });
}

/**
 * Delete a code.
 *
 * Refused once anyone has used it: `promo_redemptions` is how a collaborator
 * gets paid, and the row cascades. Deactivating does everything deleting would,
 * without destroying the record of what was already given away.
 */
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminApi();
  if ("response" in guard) return guard.response;

  const { id } = await context.params;
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("promo_codes")
    .select("trip_ids")
    .eq("id", id)
    .maybeSingle();

  const { count } = await admin
    .from("promo_redemptions")
    .select("id", { count: "exact", head: true })
    .eq("promo_code_id", id);

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      {
        error:
          "That code has already been used, so deleting it would take the record of who used it with it. Switch it off instead.",
      },
      { status: 409 }
    );
  }

  const { error } = await admin.from("promo_codes").delete().eq("id", id);

  if (error) {
    console.error("[admin/promo-codes] delete failed:", error.message);
    return NextResponse.json({ error: "Couldn't delete that code." }, { status: 500 });
  }

  await revalidatePromoPages(admin, (existing?.trip_ids as string[]) ?? []);
  return NextResponse.json({ ok: true });
}
