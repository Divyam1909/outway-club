"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { DepartureBoard } from "@/components/trips/departure-board";
import { TrustBand } from "@/components/trips/trust-band";
import { Modal } from "@/components/ui/modal";
import { Stepper } from "@/components/ui/stepper";
import { formatDateRange, formatINR, seatsLeft } from "@/lib/utils";
import type { Departure, Trip } from "@/lib/types";

/**
 * The only way to book on a phone.
 *
 * The sidebar widget is desktop-only now. On mobile it used to be hoisted
 * above the H1 by `order-first`, so the page opened on a price and a traveller
 * stepper for something the reader hadn't been told about yet; dropping that
 * left the widget stranded at the foot of a very long page, competing with
 * this bar for the same click. So the date board and the stepper moved in
 * here instead, behind one button, as a sheet — one affordance, and mobile
 * still gets to choose which weekend it's going.
 */
export function MobileBookingBar({
  trip,
  departures,
  isSignedIn,
}: {
  trip: Pick<
    Trip,
    | "slug"
    | "price_per_person"
    | "discounted_price"
    | "trip_type"
    | "group_size_max"
    | "is_group_trip"
  >;
  departures: Departure[];
  isSignedIn: boolean;
}) {
  const router = useRouter();
  const [shown, setShown] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const firstBookable =
    departures.find(
      (d) => d.status !== "sold_out" && seatsLeft(d.total_seats, d.seats_booked) > 0
    ) ??
    departures[0] ??
    null;

  const [departureId, setDepartureId] = useState(firstBookable?.id ?? "");
  const [travelers, setTravelers] = useState(1);

  useEffect(() => {
    function onScroll() {
      setShown(window.scrollY > 520);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const selected = departures.find((d) => d.id === departureId) ?? firstBookable;
  const basePrice = trip.discounted_price ?? trip.price_per_person;
  const price = selected?.price_override ?? basePrice;
  const remaining = selected ? seatsLeft(selected.total_seats, selected.seats_booked) : null;
  const soldOut = selected?.status === "sold_out" || remaining === 0;
  const canBookDirectly = trip.trip_type === "group";

  const maxTravelers = useMemo(() => {
    if (!trip.is_group_trip || !selected) return trip.group_size_max;
    return Math.max(
      1,
      Math.min(trip.group_size_max, seatsLeft(selected.total_seats, selected.seats_booked))
    );
  }, [selected, trip.group_size_max, trip.is_group_trip]);

  function goToCheckout() {
    if (!canBookDirectly) {
      router.push(`/contact?trip=${trip.slug}`);
      return;
    }

    const params = new URLSearchParams({ travelers: String(travelers) });
    if (departureId) params.set("departureId", departureId);

    const target = `/booking/${trip.slug}?${params.toString()}`;
    router.push(isSignedIn ? target : `/login?redirect=${encodeURIComponent(target)}`);
  }

  // With no dates on sale there is nothing to pick, so the button skips the
  // sheet and goes straight where it would have sent them anyway.
  const hasChoices = canBookDirectly && departures.length > 0;

  return (
    <>
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
              <span className="font-display text-xl font-semibold text-ink">
                {formatINR(price)}
              </span>
              {trip.discounted_price && trip.discounted_price < trip.price_per_person && (
                <span className="text-xs text-ink-400 line-through">
                  {formatINR(trip.price_per_person)}
                </span>
              )}
            </div>
            <p className="truncate text-[11px] text-ink-500">
              {selected
                ? `${formatDateRange(selected.start_date, selected.end_date)}${
                    remaining !== null && remaining > 0 ? ` · ${remaining} seats left` : ""
                  }`
                : "per person"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => (hasChoices ? setSheetOpen(true) : goToCheckout())}
            disabled={soldOut}
            tabIndex={shown ? 0 : -1}
            className="btn-accent shrink-0"
          >
            {soldOut ? "Sold out" : canBookDirectly ? "Book now" : "Enquire"}
          </button>
        </div>
      </div>

      <Modal
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Pick your date"
        description={
          departures.length > 1
            ? `This escape runs ${departures.length} times. Choose the one that suits.`
            : undefined
        }
      >
        <DepartureBoard
          departures={departures}
          selectedId={departureId}
          onSelect={(id) => {
            setDepartureId(id);
            setTravelers(1);
          }}
          name="mobile-departure"
          fallbackPrice={basePrice}
        />

        <div className="mt-5">
          <Stepper
            label="Travellers"
            value={travelers}
            max={maxTravelers}
            onChange={setTravelers}
            decrementLabel="One traveller fewer"
            incrementLabel="One traveller more"
            hint={
              maxTravelers > 1 && travelers >= maxTravelers
                ? `${maxTravelers} is everything left on this date.`
                : undefined
            }
          />
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-sm">
          <span className="text-ink-500">
            {formatINR(price)} &times; {travelers}
          </span>
          <output aria-live="polite" className="font-display text-lg font-semibold text-ink">
            {formatINR(price * travelers)}
          </output>
        </div>

        <button type="button" onClick={goToCheckout} className="btn-accent btn-lg mt-5 w-full">
          Continue to checkout
        </button>

        <TrustBand variant="compact" className="mt-4" />
      </Modal>
    </>
  );
}
