import Link from "next/link";
import { ArrowDown, ArrowRight, CalendarDays, MapPin, Users } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SmartImage } from "@/components/ui/smart-image";
import { PromoBanner } from "@/components/trips/promo-banner";
import { editionLabel, formatDateRange, formatINR, seatsLeft } from "@/lib/utils";
import { tripPricing, type PublicPromo } from "@/lib/promo-rules";
import type { Departure, Trip } from "@/lib/types";

/**
 * The spotlight hero. Every word on it (the edition badge, the title, the
 * dates, the starting point, seats and price) is read from the trip record,
 * so putting a different escape in the spotlight is a database change and
 * never a deploy. When nothing is on sale it falls back to brand copy rather
 * than an empty frame.
 */

/**
 * Shown when no escape is on sale. `SmartImage`'s placeholder panel is right
 * for a half-populated gallery, but at full-bleed on the homepage it reads as a
 * broken page rather than a designed empty state — which is exactly how the
 * hero looked on 16 Aug 2026, with the only published trip between departures.
 * A real photograph of somewhere we run keeps that state deliberate.
 */
const FALLBACK_HERO = "/images/udaipur/hero.jpg";

type HeroTrip = Pick<
  Trip,
  | "slug"
  | "title"
  | "short_description"
  | "hero_image"
  | "price_per_person"
  | "discounted_price"
  | "starting_point"
  | "group_size_max"
  | "edition_number"
>;

/** Renders the "×" in a paired title like "Udaipur × Mount Abu" in gold. */
function TripTitle({ title }: { title: string }) {
  const parts = title.split(/\s*×\s*/);
  if (parts.length !== 2) return <>{title}</>;

  return (
    <>
      {parts[0]} <span className="italic text-gold">×</span> {parts[1]}
    </>
  );
}

export function Hero({
  trip,
  departure,
  promo,
}: {
  trip: HeroTrip | null;
  departure: Departure | null;
  /**
   * A live auto-applying code on the spotlight trip. The offer is announced
   * here because this is where someone forms their idea of what the trip costs
   * — quoting the full price and revealing the discount two clicks later is the
   * thing that makes a promo feel like a trick.
   */
  promo?: PublicPromo | null;
}) {
  const price = trip ? tripPricing(trip, promo) : null;
  const remaining = departure ? seatsLeft(departure.total_seats, departure.seats_booked) : null;
  const edition = trip ? editionLabel(trip) : null;

  return (
    <section className="relative overflow-hidden bg-pine-700">
      <div className="absolute inset-0 animate-slow-zoom">
        <SmartImage
          src={trip?.hero_image ?? FALLBACK_HERO}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-70"
          fallbackLabel={trip?.title ?? "Outway Club"}
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-pine-700 via-pine-700/65 to-pine-700/25" />
      <div className="absolute inset-0 bg-gradient-to-r from-pine-700/80 via-pine-700/20 to-transparent" />

      {/* 32rem, not 38: with a 64px navbar above it, 38rem plus py-20 pushed
          the CTA row past the fold on a 640px-tall phone — the one row on the
          page whose whole job is to be seen without scrolling. */}
      <Container className="relative flex min-h-[32rem] flex-col justify-center py-14 sm:min-h-[40rem] sm:py-20">
        <div className="animate-fade-up">
          <p className="mb-5 inline-flex w-fit items-center gap-2.5 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-gold backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
            </span>
            {trip ? [edition, "Now boarding"].filter(Boolean).join(" · ") : "Escape Ordinary. Meet The World"}
          </p>

          <h1 className="max-w-3xl font-display text-[2.6rem] font-semibold leading-[1.05] text-cream-100 text-shadow-hero sm:text-6xl lg:text-7xl">
            {trip ? <TripTitle title={trip.title} /> : "Small groups. Real places."}
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-cream-100/85 sm:text-lg">
            {trip?.short_description ??
              "We plan a handful of escapes a year, end to end, and cap every one of them small enough that you'll know everyone's name by the second evening."}
          </p>

          {trip && promo && price && (
            <PromoBanner
              promo={promo}
              pricePerPerson={price.effective + price.promoDiscount}
              tone="dark"
              className="mt-6 w-fit backdrop-blur"
            />
          )}
        </div>

        {trip && (
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium text-cream-100/90 sm:mt-9">
            {departure && (
              <span className="flex items-center gap-2">
                <CalendarDays size={16} className="text-gold" />
                {formatDateRange(departure.start_date, departure.end_date)}
              </span>
            )}
            {trip.starting_point && (
              <span className="flex items-center gap-2">
                <MapPin size={16} className="text-gold" />
                {/* The record holds the full "Udaipur, airport or railway station"
                    string; the hero only has room for the city. */}
                {trip.starting_point.split(/[—,(]/)[0].trim()}
              </span>
            )}
            <span className="flex items-center gap-2">
              <Users size={16} className="text-gold" />
              {remaining !== null && remaining > 0
                ? `${remaining} of ${departure!.total_seats} seats left`
                : `Capped at ${trip.group_size_max} travellers`}
            </span>
          </div>
        )}

        <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
          {trip ? (
            <Link href={`/trips/${trip.slug}`} className="btn-accent btn-lg">
              See the full itinerary <ArrowRight size={18} />
            </Link>
          ) : (
            <Link href="/trips#notify" className="btn-primary btn-lg">
              Get notified <ArrowRight size={18} />
            </Link>
          )}
          <Link
            href="/trips"
            className="btn border border-cream-100/25 btn-lg text-cream-100 hover:bg-cream-100/10"
          >
            Browse every escape
          </Link>

          {price !== null && (
            <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 sm:ml-4 sm:mt-0">
              <span className="font-display text-3xl font-semibold text-cream-100">
                {formatINR(price.effective)}
              </span>
              {price.struck !== null && (
                <span className="text-base text-cream-100/50 line-through">
                  {formatINR(price.struck)}
                </span>
              )}
              <span className="text-xs text-cream-100/60">per person</span>
            </div>
          )}
        </div>
      </Container>

      <a
        href="#explore"
        aria-label="Scroll to see more"
        className="group absolute inset-x-0 bottom-6 z-10 mx-auto hidden w-fit flex-col items-center gap-1.5 sm:flex text-cream-100/80 transition-colors hover:text-gold sm:bottom-8"
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">See more</span>
        <span className="flex h-9 w-9 animate-bounce items-center justify-center rounded-full border border-cream-100/30 transition-colors group-hover:border-gold motion-reduce:animate-none">
          <ArrowDown size={16} />
        </span>
      </a>
    </section>
  );
}
