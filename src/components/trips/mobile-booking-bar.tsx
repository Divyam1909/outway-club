"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { formatDateRange, formatINR, seatsLeft } from "@/lib/utils";
import type { Departure, Trip } from "@/lib/types";

/**
 * On mobile the booking widget sits at the very bottom of a long trip page,
 * so this pins price and a book button to the viewport once the reader is
 * past the gallery. Desktop keeps the sticky sidebar and never renders this.
 */
export function MobileBookingBar({
  trip,
  departure,
  isSignedIn,
}: {
  trip: Pick<Trip, "slug" | "price_per_person" | "discounted_price" | "trip_type">;
  departure: Departure | null;
  isSignedIn: boolean;
}) {
  const router = useRouter();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    function onScroll() {
      setShown(window.scrollY > 520);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const price = departure?.price_override ?? trip.discounted_price ?? trip.price_per_person;
  const remaining = departure ? seatsLeft(departure.total_seats, departure.seats_booked) : null;
  const soldOut = departure?.status === "sold_out" || remaining === 0;
  const canBookDirectly = trip.trip_type === "group";

  function handleBook() {
    if (!canBookDirectly) {
      router.push(`/contact?trip=${trip.slug}`);
      return;
    }

    const params = new URLSearchParams({ travelers: "1" });
    if (departure) params.set("departureId", departure.id);

    const target = `/booking/${trip.slug}?${params.toString()}`;
    router.push(isSignedIn ? target : `/login?redirect=${encodeURIComponent(target)}`);
  }

  return (
    <div
      className={clsx(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-cream-100/95 backdrop-blur-md transition-transform duration-300 lg:hidden",
        shown ? "translate-y-0" : "translate-y-full"
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-hidden={!shown}
    >
      <div className="container-outway flex items-center justify-between gap-4 py-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-xl font-semibold text-ink">{formatINR(price)}</span>
            {trip.discounted_price && trip.discounted_price < trip.price_per_person && (
              <span className="text-xs text-ink-300 line-through">
                {formatINR(trip.price_per_person)}
              </span>
            )}
          </div>
          <p className="truncate text-[11px] text-ink-400">
            {departure
              ? `${formatDateRange(departure.start_date, departure.end_date)}${
                  remaining !== null && remaining > 0 ? ` · ${remaining} seats left` : ""
                }`
              : "per person"}
          </p>
        </div>

        <button
          type="button"
          onClick={handleBook}
          disabled={soldOut}
          tabIndex={shown ? 0 : -1}
          className="btn-accent shrink-0 px-6 py-3"
        >
          {soldOut ? "Sold out" : canBookDirectly ? "Book now" : "Enquire"}
        </button>
      </div>
    </div>
  );
}
