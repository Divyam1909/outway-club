import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  RATE_LIMITS,
  TOO_MANY_REQUESTS,
  rateLimitRequest,
  sanitizeMultiline,
  sanitizeText,
} from "@/lib/rate-limit";
import { newReviewAlertEmail, sendEmail } from "@/lib/email";
import { relatedOne } from "@/lib/utils";
import { site } from "@/config/site";

/**
 * Traveller review submission.
 *
 * Every review on this site comes from a real, paid booking on a departure
 * that has already run — that rule is enforced here rather than in RLS,
 * because it needs to join across bookings and departures. The direct-insert
 * policy on `reviews` was removed in 0002 so this is the only way in.
 *
 * Reviews land unapproved and appear publicly only after moderation.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Please sign in with the account you booked on to leave a review." },
      { status: 401 }
    );
  }

  if (!(await rateLimitRequest(RATE_LIMITS.review, request, user.id))) {
    return NextResponse.json(TOO_MANY_REQUESTS, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const tripId = sanitizeText(body.tripId, 64);
  const rating = Number(body.rating);
  const authorName = sanitizeText(body.authorName, 80);
  const title = sanitizeText(body.title, 120) || null;
  const reviewBody = sanitizeMultiline(body.body, 4000);
  const videoUrl = normalizeVideoUrl(body.videoUrl);

  if (!tripId) {
    return NextResponse.json({ error: "Missing trip." }, { status: 400 });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Please pick a rating from 1 to 5." }, { status: 400 });
  }
  if (authorName.length < 2) {
    return NextResponse.json({ error: "Please add the name to show on your review." }, { status: 400 });
  }
  if (reviewBody.length < 20) {
    return NextResponse.json(
      { error: "Please write at least a couple of sentences — it's more useful to the next traveller." },
      { status: 400 }
    );
  }
  if (videoUrl === false) {
    return NextResponse.json(
      { error: "That video link isn't valid. Paste a YouTube, Vimeo or direct https:// link." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Eligibility: a paid, non-cancelled booking on a departure that has ended.
  const { data: bookings, error: bookingError } = await admin
    .from("bookings")
    .select("id, status, payment_status, created_at, departure:departures(end_date)")
    .eq("user_id", user.id)
    .eq("trip_id", tripId)
    .eq("payment_status", "paid")
    .in("status", ["confirmed", "completed"]);

  if (bookingError) {
    console.error("[reviews] booking lookup failed:", bookingError.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const eligible = (bookings ?? []).find((booking) => {
    const departure = relatedOne<{ end_date: string }>(booking.departure);
    if (!departure) return true; // no fixed dates attached — allow
    return new Date(departure.end_date) <= today;
  });

  if (!eligible) {
    const hasFutureBooking = (bookings ?? []).length > 0;
    return NextResponse.json(
      {
        error: hasFutureBooking
          ? "You can leave a review once you're back — this page unlocks the day after your trip ends."
          : "Reviews are open to travellers who've been on this trip. We couldn't find a completed booking on your account.",
      },
      { status: 403 }
    );
  }

  const { error: insertError } = await admin.from("reviews").insert({
    trip_id: tripId,
    user_id: user.id,
    booking_id: eligible.id,
    author_name: authorName,
    rating,
    title,
    body: reviewBody,
    video_url: videoUrl || null,
    trip_month: new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(
      new Date()
    ),
    is_approved: false,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "You've already reviewed this trip. Email us if you'd like to change it." },
        { status: 409 }
      );
    }
    console.error("[reviews] insert failed:", insertError.message);
    return NextResponse.json({ error: "Couldn't save your review. Please try again." }, { status: 500 });
  }

  const { data: trip } = await admin.from("trips").select("title").eq("id", tripId).maybeSingle();
  const alert = newReviewAlertEmail({
    authorName,
    tripTitle: trip?.title ?? "Unknown trip",
    rating,
    body: reviewBody,
    hasVideo: Boolean(videoUrl),
  });
  await sendEmail({ to: site.opsEmail, subject: alert.subject, html: alert.html }).catch(() => false);

  return NextResponse.json({ ok: true });
}

/**
 * Returns the cleaned URL, an empty string when nothing was supplied, or
 * `false` when the input was present but unusable.
 */
function normalizeVideoUrl(input: unknown): string | false {
  const raw = sanitizeText(input, 500);
  if (!raw) return "";

  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return false;
    return url.toString();
  } catch {
    return false;
  }
}
