import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, MapPin, Mountain, ShieldCheck, Users } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/ui/rating-stars";
import { Reveal } from "@/components/ui/reveal";
import { TripGallery } from "@/components/trips/trip-gallery";
import { ItineraryTimeline } from "@/components/trips/itinerary-timeline";
import { InclusionsExclusions } from "@/components/trips/inclusions-exclusions";
import { ReviewsSection } from "@/components/trips/reviews-section";
import { BookingWidget } from "@/components/trips/booking-widget";
import { MobileBookingBar } from "@/components/trips/mobile-booking-bar";
import { BreadcrumbJsonLd, TripJsonLd } from "@/components/seo/json-ld";
import { getTripBySlug } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { CATEGORY_LABELS, DIFFICULTY_LABELS, formatDateRange } from "@/lib/utils";
import { site } from "@/config/site";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  if (!isSupabaseConfigured()) return {};
  const { slug } = await params;
  const trip = await getTripBySlug(slug);
  if (!trip) return { title: "Trip not found" };

  const image = trip.hero_image?.startsWith("http")
    ? trip.hero_image
    : `${site.url}${trip.hero_image || "/logo.png"}`;

  return {
    title: trip.title,
    description: trip.short_description,
    alternates: { canonical: `/trips/${trip.slug}` },
    openGraph: {
      type: "article",
      title: trip.title,
      description: trip.short_description,
      url: `${site.url}/trips/${trip.slug}`,
      images: [{ url: image, alt: trip.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: trip.title,
      description: trip.short_description,
      images: [image],
    },
  };
}

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const trip = await getTripBySlug(slug);
  if (!trip) notFound();

  const currentUser = await getCurrentUser();
  const departure = trip.departures[0] ?? null;
  const hasReviews = trip.review_count > 0;

  return (
    <div className="py-8 sm:py-10">
      <Container>
        <nav aria-label="Breadcrumb" className="mb-5 text-sm text-ink-400">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/trips" className="hover:text-pine">
                Escapes
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href={`/destinations/${trip.destination.slug}`} className="hover:text-pine">
                {trip.destination.name}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-ink-500">{trip.title}</li>
          </ol>
        </nav>

        <TripGallery heroImage={trip.hero_image} gallery={trip.gallery} title={trip.title} />

        <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-[2fr_1fr]">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="pine">{CATEGORY_LABELS[trip.category] ?? trip.category}</Badge>
              {trip.is_group_trip && <Badge tone="gold">Small group</Badge>}
              {departure && (
                <Badge tone="clay">
                  {formatDateRange(departure.start_date, departure.end_date)}
                </Badge>
              )}
            </div>

            <h1 className="mt-3 font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
              {trip.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-500">
              <span className="flex items-center gap-1.5">
                <MapPin size={15} /> {trip.destination.name}, {trip.destination.region}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={15} /> {trip.duration_days} days / {trip.duration_nights} nights
              </span>
              <span className="flex items-center gap-1.5">
                <Mountain size={15} /> {DIFFICULTY_LABELS[trip.difficulty]}
              </span>
              <span className="flex items-center gap-1.5">
                <Users size={15} /> {trip.group_size_min}–{trip.group_size_max} travellers
              </span>
              {hasReviews && (
                <span className="flex items-center gap-1.5">
                  <RatingStars rating={trip.rating} size={13} /> {trip.rating.toFixed(1)} (
                  {trip.review_count})
                </span>
              )}
            </div>

            <p className="mt-7 text-lg leading-relaxed text-ink-700">{trip.short_description}</p>
            <p className="mt-4 leading-relaxed text-ink-500">{trip.description}</p>

            {trip.starting_point && (
              <p className="mt-6 rounded-2xl bg-cream-300/70 px-5 py-4 text-sm leading-relaxed text-ink-700">
                <strong className="font-semibold text-ink">Starts and ends at:</strong>{" "}
                {trip.starting_point}. Book flights or trains that land before midday on the first
                day and leave after 8pm on the last.
              </p>
            )}

            {trip.highlights.length > 0 && (
              <Reveal>
                <section className="mt-10">
                  <h2 className="mb-4 font-display text-xl font-semibold text-ink">
                    Trip highlights
                  </h2>
                  <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {trip.highlights.map((highlight) => (
                      <li
                        key={highlight}
                        className="flex items-start gap-2.5 rounded-xl bg-cream-300/60 p-3.5 text-sm leading-relaxed text-ink-700"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-clay" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </section>
              </Reveal>
            )}

            <Reveal>
              <section className="mt-12">
                <h2 className="mb-6 font-display text-xl font-semibold text-ink">
                  Full itinerary — day by day
                </h2>
                <ItineraryTimeline days={trip.itinerary_days} />
              </section>
            </Reveal>

            <Reveal>
              <section className="mt-12">
                <h2 className="mb-6 font-display text-xl font-semibold text-ink">
                  Inclusions, exclusions &amp; packing list
                </h2>
                <InclusionsExclusions
                  inclusions={trip.inclusions}
                  exclusions={trip.exclusions}
                  thingsToCarry={trip.things_to_carry}
                />
              </section>
            </Reveal>

            <section className="mt-12">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-xl font-semibold text-ink">Traveller reviews</h2>
                {currentUser && (
                  <Link
                    href={`/trips/${trip.slug}/review`}
                    className="text-sm font-medium text-clay hover:underline"
                  >
                    Travelled with us? Write a review
                  </Link>
                )}
              </div>
              <ReviewsSection
                reviews={trip.reviews}
                rating={trip.rating}
                reviewCount={trip.review_count}
                tripSlug={trip.slug}
              />
            </section>

            <section className="mt-12 rounded-2xl border border-border bg-white p-6">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
                <ShieldCheck size={19} className="text-pine" /> Cancelling, if you need to
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed text-ink-500">
                Cancel 15 or more days before departure and you get 90% back. 7–14 days, 50%. Inside
                7 days, no refund — that&apos;s when our suppliers stop refunding us. If{" "}
                <em>we</em> cancel for any reason, you get 100% back, no exceptions.{" "}
                <Link href="/refund-policy" className="font-medium text-pine underline underline-offset-2">
                  Read the full policy
                </Link>
                .
              </p>
            </section>
          </div>

          {/* Ordered before the long-form content on mobile so price and
              availability are visible without scrolling. */}
          <div className="order-first lg:order-none">
            <BookingWidget
              trip={trip}
              departures={trip.departures}
              isSignedIn={Boolean(currentUser)}
            />
          </div>
        </div>
      </Container>

      <MobileBookingBar
        trip={trip}
        departure={departure}
        isSignedIn={Boolean(currentUser)}
      />

      {/* Clears the fixed mobile bar so the footer is never overlapped. */}
      <div aria-hidden="true" className="h-20 lg:hidden" />

      <TripJsonLd trip={trip} />
      <BreadcrumbJsonLd
        items={[
          { name: "Escapes", path: "/trips" },
          { name: trip.destination.name, path: `/destinations/${trip.destination.slug}` },
          { name: trip.title, path: `/trips/${trip.slug}` },
        ]}
      />
    </div>
  );
}
