import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { TripRequestForm } from "@/components/booking/trip-request-form";
import { PaymentDetails } from "@/components/trips/payment-details";
import { Eyebrow } from "@/components/ui/eyebrow";
import { SmartImage } from "@/components/ui/smart-image";
import { getTripBySlug } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { isValidAnswer } from "@/config/trip-request";
import { seatsLeft } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Request your seat",
  description:
    "Two minutes of questions, then a person gets back to you. Nothing is charged on this form.",
  robots: { index: false, follow: false },
};

/**
 * What "Book now" leads to.
 *
 * Payments are off, so this is not a checkout: it's the compulsory
 * pre-booking questionnaire, and what it sends is a request a human confirms.
 * It deliberately does not require an account — there is no money involved, and
 * a signup wall in front of an enquiry only loses the enquiry.
 */
export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const query = await searchParams;

  const trip = await getTripBySlug(slug);
  if (!trip) notFound();

  const currentUser = await getCurrentUser();

  const departureId = typeof query.departureId === "string" ? query.departureId : "";
  const selected = trip.departures.find((departure) => departure.id === departureId) ?? null;

  // Default to the first date that can still be taken rather than simply the
  // first row: opening on a sold-out departure makes the form look broken.
  const fallback =
    trip.departures.find(
      (departure) =>
        departure.status !== "sold_out" && seatsLeft(departure.total_seats, departure.seats_booked) > 0
    ) ??
    trip.departures[0] ??
    null;

  const departure = selected ?? fallback;
  const travelers = Math.max(1, Number(query.travelers) || 1);
  const pricePerPerson = trip.discounted_price ?? trip.price_per_person;

  const maxTravelers = departure
    ? Math.max(
        1,
        Math.min(trip.group_size_max, seatsLeft(departure.total_seats, departure.seats_booked))
      )
    : trip.group_size_max;

  // ?from=delhi, set by the "getting there" chips on the trip page.
  const from = typeof query.from === "string" ? query.from : "";
  const initialOrigin = isValidAnswer("origin_city", from) ? from : "";

  return (
    <div className="section-sm">
      <Container>
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-white p-4 shadow-card">
            <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl">
              <SmartImage
                src={trip.hero_image}
                alt={trip.title}
                fill
                sizes="80px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <Eyebrow className="mb-1">Booking request</Eyebrow>
              <p className="heading-sm text-lg leading-snug text-ink">{trip.title}</p>
              <p className="text-sm text-ink-500">
                {trip.duration_days} days / {trip.duration_nights} nights ·{" "}
                {trip.destination.name}, {trip.destination.region}
              </p>
            </div>
          </div>

          <h1 className="font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
            Before we hold anything, tell us how you travel
          </h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-ink-500">
            Two minutes. We cap these trips tight and put people who want the same weekend on the
            same weekend — these answers are how. Nothing is charged on this form; a person reads
            it and comes back to you.
          </p>

          <div className="mt-8">
            <TripRequestForm
              tripId={trip.id}
              tripSlug={trip.slug}
              tripTitle={trip.title}
              destinationName={trip.destination.name}
              departures={trip.departures}
              pricePerPerson={pricePerPerson}
              initialDepartureId={departure?.id ?? ""}
              initialTravelers={travelers}
              maxTravelers={maxTravelers}
              initialOrigin={initialOrigin}
              prefillName={currentUser?.profile?.full_name ?? ""}
              prefillEmail={currentUser?.user.email ?? ""}
              prefillPhone={currentUser?.profile?.phone ?? ""}
            />
          </div>

          {/* Stays on the page through the sent state, which is exactly when
              someone wants to know what paying will involve. */}
          <PaymentDetails tripTitle={trip.title} className="mt-8" />
        </div>
      </Container>
    </div>
  );
}
