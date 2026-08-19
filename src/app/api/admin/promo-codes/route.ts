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
 * Create a promo code.
 *
 * Admins only, never bloggers: a code is money, and the Journal role is
 * deliberately confined to the Journal.
 *
 * The revalidate is not incidental. An auto-applying code changes the price
 * printed on the homepage and the trip page, and those are prerendered — without
 * the purge, ops create a Janmashtami offer and the site keeps quoting
 * yesterday's number for up to five minutes while everyone assumes it's broken.
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

  const result = buildPromoPayload(body);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("promo_codes")
    .insert({ ...result.payload, created_by: guard.current.user.id })
    .select("id, code")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "That code already exists. Pick a different one." },
        { status: 409 }
      );
    }
    console.error("[admin/promo-codes] insert failed:", error.message);
    return NextResponse.json({ error: "Couldn't save that code." }, { status: 500 });
  }

  await revalidatePromoPages(admin, result.payload.trip_ids);

  return NextResponse.json({ ok: true, id: data.id, code: data.code });
}
