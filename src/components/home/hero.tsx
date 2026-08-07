import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Users } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SmartImage } from "@/components/ui/smart-image";
import { formatINR, seatsLeft } from "@/lib/utils";
import type { Departure, Trip } from "@/lib/types";

/**
 * Launch hero. Everything on it — price, seats left, dates — is read from the
 * live trip record, so the homepage can never advertise a number that the
 * booking widget disagrees with.
 */
export function Hero({
  trip,
  departure,
}: {
  trip: Pick<Trip, "slug" | "title" | "hero_image" | "price_per_person" | "discounted_price" | "duration_days" | "duration_nights"> | null;
  departure: Departure | null;
}) {
  const price = trip ? (trip.discounted_price ?? trip.price_per_person) : null;
  const hasDiscount = Boolean(trip?.discounted_price && trip.discounted_price < trip.price_per_person);
  const remaining = departure ? seatsLeft(departure.total_seats, departure.seats_booked) : null;

  return (
    <section className="relative overflow-hidden bg-pine-700">
      <div className="absolute inset-0 animate-slow-zoom">
        <SmartImage
          src={trip?.hero_image}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-70"
          fallbackLabel="Escape 001 · Udaipur"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-pine-700 via-pine-700/65 to-pine-700/25" />
      <div className="absolute inset-0 bg-gradient-to-r from-pine-700/80 via-pine-700/20 to-transparent" />

      <Container className="relative flex min-h-[38rem] flex-col justify-center py-20 sm:min-h-[44rem]">
        <div className="animate-fade-up">
          <p className="mb-5 inline-flex w-fit items-center gap-2.5 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-gold backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
            </span>
            Escape 001 · Now boarding
          </p>

          <h1 className="max-w-3xl font-display text-[2.6rem] font-semibold leading-[1.05] text-cream-100 text-shadow-hero sm:text-6xl lg:text-7xl">
            Udaipur <span className="italic text-gold">×</span> Mount Abu
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-cream-100/85 sm:text-lg">
            Three days across the greenest month in Rajasthan. A sunset boat on Lake Pichola,
            900-year-old marble at Dilwara, and sunrise from the highest point in the Aravallis —
            with eighteen people who signed up for the same weekend.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium text-cream-100/90 sm:mt-9">
          <span className="flex items-center gap-2">
            <CalendarDays size={16} className="text-gold" /> 15 – 17 August
          </span>
          <span className="flex items-center gap-2">
            <MapPin size={16} className="text-gold" /> Starts &amp; ends in Udaipur
          </span>
          <span className="flex items-center gap-2">
            <Users size={16} className="text-gold" />
            {remaining !== null && remaining > 0
              ? `${remaining} of ${departure!.total_seats} seats left`
              : "Capped at 18 travellers"}
          </span>
        </div>

        <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
          {trip && (
            <Link href={`/trips/${trip.slug}`} className="btn-accent px-7 py-4 text-base">
              See the full itinerary <ArrowRight size={18} />
            </Link>
          )}
          <Link
            href="/upcoming"
            className="btn border border-cream-100/25 px-7 py-4 text-base text-cream-100 hover:bg-cream-100/10"
          >
            What&apos;s coming next
          </Link>

          {price !== null && (
            <div className="mt-2 flex items-baseline gap-3 sm:ml-4 sm:mt-0">
              <span className="font-display text-3xl font-semibold text-cream-100">
                {formatINR(price)}
              </span>
              {hasDiscount && (
                <span className="text-base text-cream-100/50 line-through">
                  {formatINR(trip!.price_per_person)}
                </span>
              )}
              <span className="text-xs text-cream-100/60">per person</span>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
