import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Mountain, MapPin, Users } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/ui/rating-stars";
import { TripGallery } from "@/components/trips/trip-gallery";
import { ItineraryTimeline } from "@/components/trips/itinerary-timeline";
import { InclusionsExclusions } from "@/components/trips/inclusions-exclusions";
import { ReviewsSection } from "@/components/trips/reviews-section";
import { BookingWidget } from "@/components/trips/booking-widget";
import { TripCard } from "@/components/trips/trip-card";
import { getTripBySlug, getTripsByDestination } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { CATEGORY_LABELS, DIFFICULTY_LABELS } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  if (!isSupabaseConfigured()) return {};
  const { slug } = await params;
  const trip = await getTripBySlug(slug);
  if (!trip) return {};
  return { title: trip.title, description: trip.short_description };
}

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const trip = await getTripBySlug(slug);
  if (!trip) notFound();

  const [currentUser, relatedTrips] = await Promise.all([
    getCurrentUser(),
    getTripsByDestination(trip.destination_id),
  ]);

  const otherTrips = relatedTrips.filter((t) => t.id !== trip.id).slice(0, 3);

  return (
    <div className="py-10">
      <Container>
        <nav className="mb-5 text-sm text-ink-400">
          <Link href="/trips" className="hover:text-pine">
            Trips
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/destinations/${trip.destination.slug}`} className="hover:text-pine">
            {trip.destination.name}
          </Link>
        </nav>

        <TripGallery heroImage={trip.hero_image} gallery={trip.gallery} title={trip.title} />

        <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-[2fr_1fr]">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="pine">{CATEGORY_LABELS[trip.category] ?? trip.category}</Badge>
              {trip.is_group_trip && <Badge tone="gold">Group trip</Badge>}
            </div>

            <h1 className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl">
              {trip.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-500">
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
                <Users size={15} /> {trip.group_size_min}-{trip.group_size_max} travelers
              </span>
              <span className="flex items-center gap-1.5">
                <RatingStars rating={trip.rating} size={13} /> {trip.rating.toFixed(1)} ({trip.review_count})
              </span>
            </div>

            <p className="mt-6 text-lg leading-relaxed text-ink-700">{trip.short_description}</p>
            <p className="mt-4 leading-relaxed text-ink-500">{trip.description}</p>

            {trip.highlights.length > 0 && (
              <div className="mt-8">
                <h2 className="mb-4 font-display text-xl font-semibold text-ink">Trip highlights</h2>
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {trip.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-start gap-2.5 rounded-xl bg-cream-300/60 p-3 text-sm text-ink-700">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-clay" />
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-12">
              <h2 className="mb-6 font-display text-xl font-semibold text-ink">
                Full itinerary — day by day
              </h2>
              <ItineraryTimeline days={trip.itinerary_days} />
            </div>

            <div className="mt-12">
              <h2 className="mb-6 font-display text-xl font-semibold text-ink">
                Inclusions, exclusions &amp; packing list
              </h2>
              <InclusionsExclusions
                inclusions={trip.inclusions}
                exclusions={trip.exclusions}
                thingsToCarry={trip.things_to_carry}
              />
            </div>

            <div className="mt-12">
              <h2 className="mb-6 font-display text-xl font-semibold text-ink">Traveler reviews</h2>
              <ReviewsSection reviews={trip.reviews} rating={trip.rating} reviewCount={trip.review_count} />
            </div>
          </div>

          <div>
            <BookingWidget
              trip={trip}
              departures={trip.departures}
              isSignedIn={Boolean(currentUser)}
            />
          </div>
        </div>

        {otherTrips.length > 0 && (
          <div className="mt-20">
            <h2 className="mb-6 font-display text-2xl font-semibold text-ink">
              More trips in {trip.destination.name}
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {otherTrips.map((t) => (
                <TripCard key={t.id} trip={t} />
              ))}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
