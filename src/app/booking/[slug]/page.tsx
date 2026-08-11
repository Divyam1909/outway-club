import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { BookingPanel } from "@/components/booking/booking-panel";
import { Eyebrow } from "@/components/ui/eyebrow";
import { getTripBySlug } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { seatsLeft } from "@/lib/utils";

export const metadata: Metadata = { title: "Complete your booking" };

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const query = await searchParams;

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    const target = `/booking/${slug}?${new URLSearchParams(query as Record<string, string>).toString()}`;
    redirect(`/login?redirect=${encodeURIComponent(target)}`);
  }

  const trip = await getTripBySlug(slug);
  if (!trip) notFound();

  if (trip.trip_type !== "group") {
    redirect(`/contact?trip=${slug}`);
  }

  const travelersCount = Math.max(1, Number(query.travelers) || 1);
  const departureId = typeof query.departureId === "string" ? query.departureId : null;
  const departure = departureId ? trip.departures.find((d) => d.id === departureId) ?? null : null;
  const pricePerPerson = departure?.price_override ?? trip.discounted_price ?? trip.price_per_person;

  // The ceiling on the summary's traveller stepper. Never more than the group
  // cap, and never more than the seats this departure actually has left.
  const maxTravelers = departure
    ? Math.max(1, Math.min(trip.group_size_max, seatsLeft(departure.total_seats, departure.seats_booked)))
    : trip.group_size_max;

  return (
    <div className="section-sm">
      <Container>
        <div className="mb-10 max-w-2xl">
          <Eyebrow className="mb-2">Almost there</Eyebrow>
          <h1 className="font-display text-4xl font-semibold text-ink sm:text-5xl">
            Complete your booking
          </h1>
        </div>

        <BookingPanel
          trip={trip}
          departure={departure}
          pricePerPerson={pricePerPerson}
          initialTravelers={travelersCount}
          maxTravelers={maxTravelers}
          prefillName={currentUser.profile?.full_name ?? ""}
          prefillEmail={currentUser.user.email ?? ""}
        />
      </Container>
    </div>
  );
}
