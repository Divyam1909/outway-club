import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CalendarClock, Lock } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ReviewForm } from "@/components/reviews/review-form";
import { getTripBySlug } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, relatedOne } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Write a review",
  robots: { index: false, follow: false },
};

export default async function WriteReviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect(`/login?redirect=${encodeURIComponent(`/trips/${slug}/review`)}`);
  }

  const trip = await getTripBySlug(slug);
  if (!trip) notFound();

  // Mirrors the server-side gate in /api/reviews so people are told why the
  // form is unavailable instead of having a submission rejected.
  const supabase = await createClient();
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, status, payment_status, departure:departures(end_date)")
    .eq("user_id", currentUser.user.id)
    .eq("trip_id", trip.id)
    .eq("payment_status", "paid")
    .in("status", ["confirmed", "completed"]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rows = (bookings ?? []).map((booking) => ({
    ...booking,
    departureRow: relatedOne<{ end_date: string }>(booking.departure),
  }));

  const travelled = rows.find(
    (booking) => !booking.departureRow || new Date(booking.departureRow.end_date) <= today
  );

  const upcoming = rows.find(
    (booking) => booking.departureRow && new Date(booking.departureRow.end_date) > today
  );

  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id, is_approved")
    .eq("trip_id", trip.id)
    .eq("user_id", currentUser.user.id)
    .maybeSingle();

  return (
    <div className="py-14 sm:py-20">
      <Container className="max-w-2xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-clay">
          Traveller review
        </p>
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">{trip.title}</h1>
        <p className="mt-3 leading-relaxed text-ink-500">
          Everything on our testimonials page came from someone who actually travelled with us.
          That only works if you tell us the truth, including the parts we got wrong.
        </p>

        <div className="mt-10 rounded-3xl border border-border bg-white p-6 shadow-card sm:p-8">
          {existingReview ? (
            <Notice
              icon={<Lock size={24} className="text-pine" />}
              title="You've already reviewed this trip"
              body={
                existingReview.is_approved
                  ? "It's live on the trip page and on our testimonials page. Thank you."
                  : "It's with us and will be published once we've read it, usually within a day."
              }
              action={{ href: "/testimonials", label: "See all testimonials" }}
            />
          ) : travelled ? (
            <ReviewForm
              tripId={trip.id}
              tripTitle={trip.title}
              defaultAuthorName={shortenName(currentUser.profile?.full_name ?? "")}
            />
          ) : upcoming ? (
            <Notice
              icon={<CalendarClock size={24} className="text-clay" />}
              title="Not quite yet"
              body={`Your trip hasn't run yet. This page unlocks the day after you get back. We'll email you a link on ${formatDate(
                upcoming.departureRow?.end_date ?? new Date().toISOString()
              )}.`}
              action={{ href: "/account", label: "View my booking" }}
            />
          ) : (
            <Notice
              icon={<Lock size={24} className="text-ink-400" />}
              title="Reviews are for travellers only"
              body="We couldn't find a completed booking for this trip on your account. That's deliberate, it's the only way we can promise every review here is real. If you did travel with us and this looks wrong, email us and we'll fix it."
              action={{ href: `/trips/${slug}`, label: "Back to the trip" }}
            />
          )}
        </div>
      </Container>
    </div>
  );
}

function Notice({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action: { href: string; label: string };
}) {
  return (
    <div className="py-4 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cream-300">
        {icon}
      </div>
      <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-500">{body}</p>
      <Link href={action.href} className="btn-outline mt-6">
        {action.label}
      </Link>
    </div>
  );
}

/** "Ananya Iyer" → "Ananya I." — the convention we ask reviewers to use. */
function shortenName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}
