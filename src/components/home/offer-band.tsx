import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { formatDateRange, formatINR } from "@/lib/utils";
import { publicDiscount, type PublicPromo } from "@/lib/promo-rules";
import type { Departure, Trip } from "@/lib/types";

/**
 * The offer band, directly under the hero.
 *
 * It exists only while a live auto-applying code covers the spotlight trip, and
 * every number on it is that code's own arithmetic — so it appears when ops
 * create the offer, quotes whatever they set, and takes itself down when the
 * window closes. Nothing about a particular festival is compiled in here; the
 * label, the amount and the end date all come from the row.
 *
 * The claim it makes is deliberately small and checkable: what comes off, that
 * it applies by itself, and when it stops. No countdown clock, no "only 3 left"
 * — the seat count on the hero is already true, and the thing that makes an
 * offer feel real is that the price on the next page matches this one.
 */
export function OfferBand({
  trip,
  departure,
  promo,
}: {
  trip: Pick<Trip, "slug" | "title" | "price_per_person" | "discounted_price">;
  departure: Departure | null;
  promo: PublicPromo;
}) {
  const base = Number(trip.discounted_price ?? trip.price_per_person);
  const discount = publicDiscount(promo, base, 1);
  if (discount <= 0) return null;

  return (
    <section className="border-b border-gold-100 bg-gold-50">
      <Container className="py-8 sm:py-10">
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <p className="mb-2.5 inline-flex items-center gap-2 rounded-full bg-gold-100 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-gold-600">
                <Sparkles size={13} aria-hidden="true" /> {promo.label}
              </p>

              <h2 className="font-display text-2xl font-semibold leading-snug text-ink sm:text-3xl">
                {formatINR(discount)} off every traveller on {trip.title}
              </h2>

              <p className="mt-2.5 leading-relaxed text-ink-500">
                {promo.description ??
                  "Applied automatically at checkout — there is no code to remember and nothing to enter."}{" "}
                {departure && (
                  <>
                    The escape runs{" "}
                    <strong className="font-medium text-ink-700">
                      {formatDateRange(departure.start_date, departure.end_date)}
                    </strong>
                    .
                  </>
                )}
              </p>

              <p className="mt-2 text-sm text-ink-500">
                {promo.ends_at ? (
                  <>
                    Offer closes{" "}
                    {new Date(promo.ends_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                    })}
                    . One code per booking, and this one is already on it.
                  </>
                ) : (
                  <>One code per booking, and this one is already on it.</>
                )}
              </p>
            </div>

            <div className="shrink-0">
              <div className="mb-4 flex items-baseline gap-3">
                <span className="font-display text-4xl font-semibold text-ink">
                  {formatINR(base - discount)}
                </span>
                <span className="text-lg text-ink-400 line-through">{formatINR(base)}</span>
              </div>
              <Link href={`/trips/${trip.slug}`} className="btn-accent btn-lg w-full sm:w-auto">
                See the escape <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
