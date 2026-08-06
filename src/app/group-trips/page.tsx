import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { GroupTripCard } from "@/components/trips/group-trip-card";
import { getGroupTrips } from "@/lib/data";

export const metadata: Metadata = {
  title: "Group trips",
  description: "Fixed-date group departures with live seat availability — travel with a small group of like-minded people.",
};

export default async function GroupTripsPage() {
  const trips = await getGroupTrips();

  return (
    <div className="py-14">
      <Container>
        <div className="mb-10 max-w-2xl">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-clay">
            Fixed departures
          </p>
          <h1 className="font-display text-4xl font-semibold text-ink">Group trips</h1>
          <p className="mt-3 text-ink-500">
            Real dates, real seat counts. Every departure below travels with a dedicated trip
            leader and a capped group size — pick a date and lock in your spot.
          </p>
        </div>

        <div className="flex flex-col gap-5">
          {trips.map((trip) => (
            <GroupTripCard key={trip.id} trip={trip} />
          ))}
        </div>
      </Container>
    </div>
  );
}
