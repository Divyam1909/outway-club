import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Download, MapPin, Mountain, ShieldCheck, Users } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/ui/rating-stars";
import { Reveal } from "@/components/ui/reveal";
import { TripGallery } from "@/components/trips/trip-gallery";
import { GettingThere } from "@/components/trips/getting-there";
import { ItineraryTimeline } from "@/components/trips/itinerary-timeline";
import { InclusionsExclusions } from "@/components/trips/inclusions-exclusions";
import { PaymentDetails } from "@/components/trips/payment-details";
import { ReviewsSection } from "@/components/trips/reviews-section";
import { StayCards } from "@/components/trips/stay-cards";
import { TripCaptain } from "@/components/trips/trip-captain";
import { TrustBand } from "@/components/trips/trust-band";
import { BookingWidget } from "@/components/trips/booking-widget";
import { MobileBookingBar } from "@/components/trips/mobile-booking-bar";
import { BreadcrumbJsonLd, TripJsonLd } from "@/components/seo/json-ld";
import { getPublishedTripSlugs, getTripBySlug } from "@/lib/data";
import { getAutoPromoForTrips } from "@/lib/promo";
import { PromoBanner } from "@/components/trips/promo-banner";
import { tripPricing } from "@/lib/promo-rules";
import { SignedInOnly } from "@/components/auth/signed-in-only";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { CATEGORY_LABELS, DIFFICULTY_LABELS, formatDateRange } from "@/lib/utils";
import { site } from "@/config/site";
import { itineraryPdfFor } from "@/config/itineraries";

export const revalidate = 300;

/**
 * Prerender every published escape at build time. These are the pages search
 * traffic lands on, and the difference between a prerendered hit and an
 * on-demand render is the difference between a page that is already there and
 * one that has to talk to Postgres first.
 *
 * A trip published after this build still works: `dynamicParams` defaults to
 * true, so an unlisted slug renders on demand and is cached from then on.
 */
export async function generateStaticParams() {
  const slugs = await getPublishedTripSlugs();
  return slugs.map((slug) => ({ slug }));
}

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
    : `${site.url}${trip.hero_image || "/brand/og-default.png"}`;

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

  const departure = trip.departures[0] ?? null;
  const hasReviews = trip.review_count > 0;

  // A live event code, if one covers this escape. Read on the server so the
  // prerendered page already carries the offer price rather than flashing the
  // full one and correcting itself.
  const promo = (await getAutoPromoForTrips([trip])).get(trip.id) ?? null;
  const price = tripPricing(trip, promo);
  const brochure = itineraryPdfFor(trip.slug);

  return (
    <div className="py-8 sm:py-10">
      <Container>
        <nav aria-label="Breadcrumb" className="mb-5 text-sm text-ink-500">
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

            {/* The product outranks the catalogue index it came from — /trips
                was set at 4xl/5xl while this, the page that sells, was a size
                smaller. */}
            <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
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
                <Users size={15} /> {trip.group_size_min} to {trip.group_size_max} travellers
              </span>
              {hasReviews && (
                <span className="flex items-center gap-1.5">
                  <RatingStars rating={trip.rating} size={13} /> {trip.rating.toFixed(1)} (
                  {trip.review_count})
                </span>
              )}
            </div>

            {promo && (
              <PromoBanner
                promo={promo}
                pricePerPerson={price.effective + price.promoDiscount}
                className="mt-6 w-fit"
              />
            )}

            <p className="mt-7 text-lg leading-relaxed text-ink-700">{trip.short_description}</p>
            <p className="mt-4 leading-relaxed text-ink-500">{trip.description}</p>

            <div className="mt-7">
              <GettingThere
                tripSlug={trip.slug}
                destinationName={trip.destination.name}
                startingPoint={trip.starting_point}
              />
            </div>

            {trip.highlights.length > 0 && (
              <Reveal>
                <section className="mt-10">
                  <h2 className="mb-4 heading-sm text-xl text-ink">
                    Trip highlights
                  </h2>
                  <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {trip.highlights.map((highlight) => (
                      <li
                        key={highlight}
                        className="flex items-start gap-2.5 rounded-xl bg-cream-300 p-3.5 text-sm leading-relaxed text-ink-700"
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
                <h2 className="heading-sm mb-2 text-xl text-ink">Where you sleep</h2>
                <p className="mb-5 text-ink-500">
                  Named, not &ldquo;3-star or similar&rdquo;.
                </p>
                <StayCards days={trip.itinerary_days} />
              </section>
            </Reveal>

            <Reveal>
              <section className="mt-12">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="heading-sm text-xl text-ink">Full itinerary, day by day</h2>
                  {/* Generated from these same rows, so the brochure and the
                      page can never quote different dates or a different
                      price. See scripts/build-itinerary-pdf.mjs. */}
                  {brochure && (
                    <a href={brochure} download className="btn-outline btn-sm shrink-0">
                      <Download size={14} aria-hidden="true" /> Download as PDF
                    </a>
                  )}
                </div>
                <ItineraryTimeline days={trip.itinerary_days} />
              </section>
            </Reveal>

            <Reveal>
              <section className="mt-12">
                <h2 className="heading-sm mb-2 text-xl text-ink">Who runs this trip</h2>
                <p className="mb-5 text-ink-500">
                  One person is with the group the whole way. This is them.
                </p>
                <TripCaptain tripSlug={trip.slug} />
              </section>
            </Reveal>

            <Reveal>
              <section className="mt-12">
                <h2 className="heading-sm mb-6 text-xl text-ink">
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
                <h2 className="heading-sm text-xl text-ink">Traveller reviews</h2>
                <SignedInOnly>
                  <Link
                    href={`/trips/${trip.slug}/review`}
                    className="text-sm font-medium text-clay hover:underline"
                  >
                    Travelled with us? Write a review
                  </Link>
                </SignedInOnly>
              </div>
              <ReviewsSection
                reviews={trip.reviews}
                rating={trip.rating}
                reviewCount={trip.review_count}
                tripSlug={trip.slug}
              />
            </section>

            <PaymentDetails tripTitle={trip.title} className="mt-12" />

            <section className="mt-12 rounded-2xl border border-border bg-white p-6">
              <h2 className="heading-sm flex items-center gap-2 text-lg text-ink">
                <ShieldCheck size={19} className="text-pine" aria-hidden="true" /> Cancelling, if
                you need to
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed text-ink-500">
                That&apos;s when our suppliers stop refunding us. If <em>we</em> cancel for any
                reason, you get 100% back, no exceptions.
              </p>
              {/* The payment mechanism is spelled out in full directly above,
                  so this carries only the refund ladder. */}
              <TrustBand showPayment={false} className="mt-5" />
            </section>
          </div>

          {/* Desktop only, and no `order-first` any more. On mobile that put
              the price and a traveller stepper above the H1, so the page
              opened on a form for something the reader hadn't been told about
              yet — and once it moved down it just competed with the fixed bar
              for the same click. MobileBookingBar owns booking below lg. */}
          <div className="hidden lg:block">
            <BookingWidget trip={trip} departures={trip.departures} promo={promo} />
          </div>
        </div>
      </Container>

      <MobileBookingBar trip={trip} departures={trip.departures} promo={promo} />

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
