import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, Play, Quote, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { RatingStars } from "@/components/ui/rating-stars";
import { Reveal } from "@/components/ui/reveal";
import { getApprovedReviews } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Traveller reviews",
  description:
    "Unedited reviews and video testimonials from people who actually travelled with Outway Club. No seeded content, no bought reviews.",
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

export default async function TestimonialsPage() {
  const reviews = await getApprovedReviews();

  const videoReviews = reviews.filter((review) => review.video_url);
  const textReviews = reviews.filter((review) => !review.video_url);

  const average =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  return (
    <div className="pb-20 sm:pb-24">
      <section className="border-b border-border bg-cream-300/40 py-16 sm:py-20">
        <Container className="max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-clay">
            Traveller reviews
          </p>
          <h1 className="font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
            {reviews.length > 0 ? "What people said afterwards" : "Nothing here yet — and that's the point"}
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
              Escape 001 runs 15–17 August. Until people come back from it, there is genuinely
              nothing to put on this page — so we&apos;ve left it empty rather than filling it with
              stock quotes and invented names.
            </p>
          )}
        </Container>
      </section>

      {/* --- Video testimonials --------------------------------------------- */}
      {videoReviews.length > 0 && (
        <section className="py-16">
          <Container>
            <h2 className="mb-8 font-display text-2xl font-semibold text-ink">On camera</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {videoReviews.map((review, index) => (
                <Reveal key={review.id} delay={index * 80}>
                  <figure className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-soft">
                    <a
                      href={review.video_url ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative flex aspect-video items-center justify-center bg-pine-700"
                    >
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-cream-100/90 text-pine transition-transform group-hover:scale-110 motion-reduce:group-hover:scale-100">
                        <Play size={22} className="ml-0.5 fill-pine" />
                      </span>
                      <span className="absolute bottom-3 left-3 rounded-full bg-ink/60 px-3 py-1 text-xs font-medium text-cream-100">
                        Watch {review.author_name}&apos;s video
                      </span>
                    </a>
                    <figcaption className="flex flex-1 flex-col p-5">
                      <RatingStars rating={review.rating} size={14} />
                      {review.title && (
                        <p className="mt-2 font-semibold text-ink">{review.title}</p>
                      )}
                      <blockquote className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-500">
                        {review.body}
                      </blockquote>
                      <p className="mt-4 text-xs font-medium text-ink-400">
                        {review.author_name}
                        {review.trip ? ` · ${review.trip.title}` : ""}
                      </p>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* --- Written reviews ------------------------------------------------- */}
      {textReviews.length > 0 && (
        <section className="py-16">
          <Container>
            {videoReviews.length > 0 && (
              <h2 className="mb-8 font-display text-2xl font-semibold text-ink">In writing</h2>
            )}
            <div className="columns-1 gap-6 md:columns-2 lg:columns-3">
              {textReviews.map((review) => (
                <figure
                  key={review.id}
                  className="mb-6 break-inside-avoid rounded-2xl border border-border bg-white p-6 shadow-soft"
                >
                  <Quote className="mb-3 text-clay" size={20} aria-hidden="true" />
                  <RatingStars rating={review.rating} size={14} />
                  {review.title && (
                    <p className="mt-3 font-display text-lg font-semibold text-ink">
                      {review.title}
                    </p>
                  )}
                  <blockquote className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-500">
                    {review.body}
                  </blockquote>
                  <figcaption className="mt-5 border-t border-border pt-4">
                    <span className="block text-sm font-semibold text-ink">{review.author_name}</span>
                    <span className="block text-xs text-ink-400">
                      {review.trip_month ? `Travelled ${review.trip_month}` : formatDate(review.created_at)}
                      {review.trip ? ` · ${review.trip.title}` : ""}
                    </span>
                  </figcaption>
                </figure>
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
                First reviews land 18 August
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-500">
                Everyone on Escape 001 gets a link to this form the morning after the trip ends.
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
