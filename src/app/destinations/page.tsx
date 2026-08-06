import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { DestinationCard } from "@/components/destination-card";
import { getAllDestinations } from "@/lib/data";

export const metadata: Metadata = {
  title: "Destinations",
  description: "Every destination Outway Club runs trips to, from the high Himalayas to island coastlines.",
};

export default async function DestinationsPage() {
  const destinations = await getAllDestinations();

  return (
    <div className="py-14">
      <Container>
        <div className="mb-10 max-w-2xl">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-clay">
            {destinations.length} destinations
          </p>
          <h1 className="font-display text-4xl font-semibold text-ink">Where we go</h1>
          <p className="mt-3 text-ink-500">
            Every region we run trips in. Pick a destination to see every trip we offer there.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {destinations.map((destination) => (
            <DestinationCard key={destination.id} destination={destination} />
          ))}
        </div>
      </Container>
    </div>
  );
}
