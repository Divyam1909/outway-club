import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { BookingListItem } from "@/components/account/booking-list-item";
import { getCurrentUser } from "@/lib/auth";
import { getMyBookings } from "@/lib/data";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login?redirect=/account");

  const bookings = await getMyBookings(currentUser.user.id);

  return (
    <div className="py-14">
      <Container>
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-clay">
              Welcome back{currentUser.profile?.full_name ? `, ${currentUser.profile.full_name.split(" ")[0]}` : ""}
            </p>
            <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">My bookings</h1>
            <p className="mt-1 text-sm text-ink-500">{currentUser.user.email}</p>
          </div>
          <Link href="/trips" className="btn-accent">
            Book another trip
          </Link>
        </div>

        {bookings.length > 0 ? (
          <div className="flex flex-col gap-4">
            {bookings.map((booking) => (
              <BookingListItem key={booking.id} booking={booking} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
            <p className="font-display text-xl font-semibold text-ink">No bookings yet</p>
            <p className="mt-2 max-w-sm text-sm text-ink-500">
              Once you book a trip, it&apos;ll show up here with your itinerary and payment
              details.
            </p>
            <Link href="/trips" className="btn-primary mt-6">
              Explore trips
            </Link>
          </div>
        )}
      </Container>
    </div>
  );
}
