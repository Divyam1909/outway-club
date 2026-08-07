import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, Play, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { RatingStars } from "@/components/ui/rating-stars";
import { Reveal } from "@/components/ui/reveal";
import { ReviewStack } from "@/components/reviews/review-stack";
import { getApprovedReviews, type ReviewWithTrip } from "@/lib/data";
import { formatMonth } from "@/lib/utils";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Traveller reviews",
  description:
    "Unedited reviews and video testimonials from people who actually travelled with Outway Club, grouped by destination. No seeded content, no bought reviews.",
  alternates: { canonical: "/testimonials" },
};

export const revalidate = 120;

const PROMISES = [
  {
    title: "Only real travellers can post",
    body: "The review form is locked to accounts with a paid booking on a departure that has already run. It's enforced in the API, not in a policy document.",
  },
  {
    title: "We publish the critical ones",
    body: "We moderate for spam and abuse. We have never removed a review for being unkind about us, and we never will.",
  },
  {
    title: "Ratings are computed, not typed",
    body: "The star rating on a trip page is calculated by the database from approved reviews. Nobody at Outway can type a number into it.",
  },
];

type DestinationGroup = {
  name: string;
  slug: string | null;
  reviews: ReviewWithTrip[];
};

function groupByDestination(reviews: ReviewWithTrip[]): DestinationGroup[] {
  const map = new Map<string, DestinationGroup>();
  for (const review of reviews) {
    const name = review.trip?.destination?.name ?? "Other trips";
    if (!map.has(name)) {
      map.set(name, { name, slug: review.trip?.destination?.slug ?? null, reviews: [] });
    }
    map.get(name)!.reviews.push(review);
  }
  return [...map.values()].sort((a, b) => b.reviews.length - a.reviews.length);
}

/** Reviews arrive newest first, so grouping by month preserves that order. */
function groupByMonth(reviews: ReviewWithTrip[]): [string, ReviewWithTrip[]][] {
  const map = new Map<string, ReviewWithTrip[]>();
  for (const review of reviews) {
    const key = review.created_at.slice(0, 7);
    map.set(key, [...(map.get(key) ?? []), review]);
  }
  return [...map.entries()];
}

export default async function TestimonialsPage() {
  const reviews = await getApprovedReviews();

  const average =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  const featured = [...reviews]
    .sort((a, b) => b.rating - a.rating || +new Date(b.created_at) - +new Date(a.created_at))
    .slice(0, 5);

  const destinationGroups = groupByDestination(reviews);

  return (
    <div className="pb-20 sm:pb-24">
      <section className="border-b border-border bg-cream-300/40 py-16 sm:py-20">
        <Container className="max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-clay">
            Traveller reviews
          </p>
          <h1 className="font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
            {reviews.length > 0 ? "What people said afterwards" : "Nothing here yet, and that's the point"}
          </h1>

          {reviews.length > 0 ? (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <span className="font-display text-4xl font-semibold text-ink">
                {average.toFixed(1)}
              </span>
              <span className="text-left">
                <RatingStars rating={average} size={17} />
                <span className="mt-0.5 block text-sm text-ink-500">
                  from {reviews.length} verified review{reviews.length === 1 ? "" : "s"}
                </span>
              </span>
            </div>
          ) : (
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-500">
              Until people come back from a trip with us, there is genuinely nothing to put on this
              page, so we&apos;ve left it empty rather than filling it with stock quotes and
              invented names.
            </p>
          )}
        </Container>
      </section>

      {/* --- Best of, stacked -------------------------------------------------- */}
      {featured.length > 0 && (
        <section className="py-16">
          <Container>
            <p className="mb-1 text-center text-sm font-semibold uppercase tracking-[0.2em] text-clay">
              Start here
            </p>
            <h2 className="mb-10 text-center font-display text-2xl font-semibold text-ink sm:text-3xl">
              The highest-rated, in the travellers&apos; own words
            </h2>
            <Reveal>
              <ReviewStack reviews={featured} />
            </Reveal>
          </Container>
        </section>
      )}

      {/* --- Grouped by destination, then by month ----------------------------- */}
      {destinationGroups.length > 0 && (
        <section className="py-6">
          <Container>
            <div className="space-y-16">
              {destinationGroups.map((group) => (
                <div key={group.name}>
                  <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-4">
                    <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
                      {group.name}
                    </h2>
                    <span className="text-sm text-ink-400">
                      {group.reviews.length} review{group.reviews.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="space-y-10">
                    {groupByMonth(group.reviews).map(([monthKey, monthReviews]) => (
                      <div key={monthKey}>
                        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-clay">
                          {formatMonth(monthKey)}
                        </p>
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                          {monthReviews.map((review) => (
                            <ReviewTile key={review.id} review={review} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* --- Empty state ----------------------------------------------------- */}
      {reviews.length === 0 && (
        <section className="py-16">
          <Container className="max-w-2xl">
            <div className="rounded-3xl border border-border bg-white p-8 text-center shadow-card sm:p-10">
              <span className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-clay-50 text-clay">
                <CalendarClock size={22} />
              </span>
              <h2 className="font-display text-2xl font-semibold text-ink">
                Reviews land the week after each trip
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-500">
                Everyone on a departure gets a link to this form the morning after it ends.
                Whatever they write goes up as they wrote it.
              </p>
              <Link href="/trips" className="btn-accent mt-7">
                Book the escape they&apos;ll be reviewing
              </Link>
            </div>
          </Container>
        </section>
      )}

      {/* --- Our promises ---------------------------------------------------- */}
      <section className="pt-6">
        <Container>
          <div className="rounded-3xl bg-pine-700 px-8 py-12 text-cream-100 sm:px-12">
            <div className="mb-9 flex items-center gap-3">
              <ShieldCheck size={24} className="text-gold" />
              <h2 className="font-display text-2xl font-semibold">
                How reviews work on this site
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {PROMISES.map((promise) => (
                <div key={promise.title}>
                  <h3 className="font-display text-lg font-semibold text-cream-100">
                    {promise.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-cream-100/70">{promise.body}</p>
                </div>
              ))}
            </div>

            <p className="mt-9 border-t border-cream-100/10 pt-6 text-sm text-cream-100/60">
              Travelled with us and want your review taken down? Email{" "}
              <a href={`mailto:${site.email}`} className="text-gold hover:underline">
                {site.email}
              </a>{" "}
              and it&apos;s gone the same day, no questions asked.
            </p>
          </div>
        </Container>
      </section>
    </div>
  );
}

function ReviewTile({ review }: { review: ReviewWithTrip }) {
  return (
    <figure className="flex h-full flex-col rounded-2xl border border-border bg-white p-5 shadow-soft">
      <RatingStars rating={review.rating} size={13} />
      {review.title && <p className="mt-2 font-semibold text-ink">{review.title}</p>}
      <blockquote className="mt-1.5 flex-1 whitespace-pre-line text-sm leading-relaxed text-ink-500">
        {review.body}
      </blockquote>

      {review.video_url && (
        <a
          href={review.video_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-clay hover:underline"
        >
          <Play size={12} className="fill-clay" /> Watch their video
        </a>
      )}

      <figcaption className="mt-4 border-t border-border pt-3">
        <span className="block text-sm font-semibold text-ink">{review.author_name}</span>
        <span className="block text-xs text-ink-400">
          {review.trip_month ? `Travelled ${review.trip_month}` : ""}
          {review.trip ? `${review.trip_month ? " · " : ""}${review.trip.title}` : ""}
        </span>
      </figcaption>
    </figure>
  );
}
