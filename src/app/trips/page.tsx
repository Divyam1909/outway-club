import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { TripCard } from "@/components/trips/trip-card";
import { TripFiltersBar } from "@/components/trips/trip-filters-bar";
import { getAllTrips, getAllDestinations } from "@/lib/data";
import type { Category, Difficulty, TripType } from "@/lib/types";

export const metadata: Metadata = {
  title: "All trips",
  description: "Browse every group and private trip run by Outway Club, filterable by destination, category and difficulty.",
};

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  const filters = {
    category: (params.category as Category) || undefined,
    destinationSlug: (params.destination as string) || undefined,
    difficulty: (params.difficulty as Difficulty) || undefined,
    tripType: (params.tripType as TripType) || undefined,
    sort: (params.sort as "popular" | "price_low" | "price_high" | "duration") || undefined,
  };

  const [trips, destinations] = await Promise.all([getAllTrips(filters), getAllDestinations()]);

  return (
    <div className="py-14">
      <Container>
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-clay">
            {trips.length} trip{trips.length !== 1 ? "s" : ""}
          </p>
          <h1 className="font-display text-4xl font-semibold text-ink">All trips</h1>
          <p className="mt-2 max-w-xl text-ink-500">
            Every departure we run, in one place. Filter by destination, category or difficulty
            to find your next trip.
          </p>
        </div>

        <TripFiltersBar destinations={destinations} />

        {trips.length > 0 ? (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        ) : (
          <div className="mt-16 flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
            <p className="font-display text-xl font-semibold text-ink">No trips match those filters</p>
            <p className="mt-2 max-w-sm text-sm text-ink-500">
              Try widening your search, or get in touch and we&apos;ll help you find (or build)
              the right trip.
            </p>
          </div>
        )}
      </Container>
    </div>
  );
}
