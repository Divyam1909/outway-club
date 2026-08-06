import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { BookingForm } from "@/components/booking/booking-form";
import { OrderSummary } from "@/components/booking/order-summary";
import { getTripBySlug } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";

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

  return (
    <div className="py-14">
      <Container>
        <div className="mb-10 max-w-2xl">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-clay">
            Almost there
          </p>
          <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
            Complete your booking
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[2fr_1fr]">
          <BookingForm
            tripId={trip.id}
            tripTitle={trip.title}
            departureId={departure?.id ?? null}
            pricePerPerson={pricePerPerson}
            travelersCount={travelersCount}
            prefillName={currentUser.profile?.full_name ?? ""}
            prefillEmail={currentUser.user.email ?? ""}
          />
          <OrderSummary
            trip={trip}
            departure={departure}
            pricePerPerson={pricePerPerson}
            travelersCount={travelersCount}
          />
        </div>
      </Container>
    </div>
  );
}
