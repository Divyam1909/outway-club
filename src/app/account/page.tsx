import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Mail } from "lucide-react";
import { Container } from "@/components/ui/container";
import { BookingListItem } from "@/components/account/booking-list-item";
import { getCurrentUser } from "@/lib/auth";
import { getMyBookings } from "@/lib/data";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "My bookings",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login?redirect=/account");

  const bookings = await getMyBookings(currentUser.user.id);
  const upcoming = bookings.filter((booking) => booking.status !== "cancelled");
  const past = bookings.filter((booking) => booking.status === "cancelled");

  const firstName = currentUser.profile?.full_name?.split(" ")[0];

  return (
    <div className="py-14 sm:py-16">
      <Container>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-clay">
              Welcome back{firstName ? `, ${firstName}` : ""}
            </p>
            <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
              My bookings
            </h1>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-500">
              <Mail size={14} /> {currentUser.user.email}
            </p>
          </div>
          <Link href="/trips" className="btn-accent">
            Book an escape <ArrowRight size={16} />
          </Link>
        </div>

        {bookings.length > 0 ? (
          <div className="space-y-10">
            {upcoming.length > 0 && (
              <section>
                <div className="flex flex-col gap-4">
                  {upcoming.map((booking) => (
                    <BookingListItem key={booking.id} booking={booking} />
                  ))}
                </div>
              </section>
            )}

            {past.length > 0 && (
              <section>
                <h2 className="mb-4 font-display text-lg font-semibold text-ink-500">
                  Cancelled
                </h2>
                <div className="flex flex-col gap-4 opacity-75">
                  {past.map((booking) => (
                    <BookingListItem key={booking.id} booking={booking} />
                  ))}
                </div>
              </section>
            )}

            <p className="text-sm text-ink-400">
              Something not right?{" "}
              <a
                href={`mailto:${site.email}`}
                className="font-medium text-pine underline underline-offset-2"
              >
                Email us
              </a>{" "}
              with your booking reference and we&apos;ll sort it out.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-border bg-white/50 py-16 text-center">
            <p className="font-display text-xl font-semibold text-ink">No bookings yet</p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
              Once you book, your itinerary, traveller list and payment details live here, along
              with a one-click cancel that shows the exact refund before you confirm.
            </p>
            <Link href="/trips" className="btn-primary mt-6">
              Browse escapes
            </Link>
          </div>
        )}
      </Container>
    </div>
  );
}
