import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { relatedOne } from "@/lib/utils";

/**
 * What the signed-in person is allowed to review, for the "Write a review"
 * dialog on /testimonials.
 *
 * This is a *convenience* endpoint, not a gate: POST /api/reviews re-checks
 * eligibility from scratch on the server, so nothing here can be abused by
 * calling it with a trip id that isn't yours. It exists so the dialog can say
 * "here are your two trips" instead of asking someone to remember which slug
 * they booked.
 *
 * Reads go through the user's own session, so RLS restricts bookings to their
 * own rows without this route needing the service key.
 */

export const dynamic = "force-dynamic";

type EligibleTrip = {
  id: string;
  title: string;
  slug: string;
  /** open = write it now · upcoming = trip hasn't ended · reviewed = done. */
  state: "open" | "upcoming" | "reviewed";
  endDate: string | null;
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ signedIn: false, defaultAuthorName: "", trips: [] });
  }

  const [{ data: bookings }, { data: reviews }, { data: profile }] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, trip:trips(id, title, slug), departure:departures(end_date)")
      .eq("user_id", user.id)
      .eq("payment_status", "paid")
      .in("status", ["confirmed", "completed"]),
    supabase.from("reviews").select("trip_id").eq("user_id", user.id),
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
  ]);

  const reviewed = new Set((reviews ?? []).map((review) => review.trip_id as string));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // One traveller can hold several bookings on the same trip. Keep the most
  // permissive state per trip, so a past departure unlocks the form even if
  // they've also booked the same route again for later.
  const byTrip = new Map<string, EligibleTrip>();

  for (const booking of bookings ?? []) {
    const trip = relatedOne<{ id: string; title: string; slug: string }>(booking.trip);
    if (!trip) continue;

    const departure = relatedOne<{ end_date: string }>(booking.departure);
    const ended = !departure || new Date(departure.end_date) <= today;

    const state: EligibleTrip["state"] = reviewed.has(trip.id)
      ? "reviewed"
      : ended
        ? "open"
        : "upcoming";

    const existing = byTrip.get(trip.id);
    const rank = { open: 0, upcoming: 1, reviewed: 2 } as const;
    if (existing && rank[existing.state] <= rank[state]) continue;

    byTrip.set(trip.id, {
      id: trip.id,
      title: trip.title,
      slug: trip.slug,
      state,
      endDate: departure?.end_date ?? null,
    });
  }

  const trips = [...byTrip.values()].sort(
    (a, b) => ({ open: 0, upcoming: 1, reviewed: 2 })[a.state] - ({ open: 0, upcoming: 1, reviewed: 2 })[b.state]
  );

  return NextResponse.json({
    signedIn: true,
    defaultAuthorName: shortenName((profile?.full_name as string | null) ?? ""),
    trips,
  });
}

/** "Ananya Iyer" → "Ananya I." — the convention we ask reviewers to use. */
function shortenName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}
