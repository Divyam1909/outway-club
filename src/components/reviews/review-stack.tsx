"use client";

import { useState } from "react";
import Link from "next/link";
import { Quote } from "lucide-react";
import { clsx } from "clsx";
import { RatingStars } from "@/components/ui/rating-stars";
import type { ReviewWithTrip } from "@/lib/data";

/**
 * A deck of the best reviews, stacked like cards in a wallet. Tapping the
 * front card sends it to the back and brings the next one forward.
 *
 * Deliberately click-driven rather than hover-driven: a hover-only reveal
 * (the usual trick for this kind of stacked-card effect) simply never fires
 * on a touchscreen, so the same tap works identically on a phone and a
 * desktop instead of the desktop getting a richer interaction than mobile.
 */
export function ReviewStack({ reviews }: { reviews: ReviewWithTrip[] }) {
  const [order, setOrder] = useState(reviews.map((_, index) => index));
  const visible = Math.min(order.length, 4);
  const frontTripSlug = reviews[order[0]]?.trip?.slug ?? null;

  function bringToBack() {
    setOrder((current) => [...current.slice(1), current[0]]);
  }

  if (reviews.length === 0) return null;

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative w-full max-w-md"
        style={{ height: "20rem" }}
      >
        {order.map((reviewIndex, position) => {
          const review = reviews[reviewIndex];
          if (position >= visible) return null;
          const isFront = position === 0;
          const rotate = position === 0 ? 0 : position % 2 === 0 ? 2.5 * position : -2.5 * position;

          return (
            <button
              key={review.id}
              type="button"
              onClick={isFront ? bringToBack : undefined}
              tabIndex={isFront ? 0 : -1}
              aria-hidden={!isFront}
              className={clsx(
                "absolute inset-x-0 top-0 flex h-full flex-col rounded-3xl border border-border bg-white p-6 text-left shadow-card transition-all duration-500 ease-out sm:p-7",
                isFront ? "cursor-pointer hover:-translate-y-1 hover:shadow-lifted" : "pointer-events-none"
              )}
              style={{
                transform: `translateY(${position * 14}px) rotate(${rotate}deg) scale(${1 - position * 0.045})`,
                zIndex: visible - position,
                opacity: 1 - position * 0.16,
              }}
            >
              <Quote className="mb-3 text-clay" size={22} aria-hidden="true" />
              <RatingStars rating={review.rating} size={15} />
              {review.title && (
                <p className="mt-3 font-display text-lg font-semibold text-ink">{review.title}</p>
              )}
              <blockquote className="mt-2 line-clamp-4 flex-1 text-sm leading-relaxed text-ink-500">
                {review.body}
              </blockquote>
              <figcaption className="mt-5 border-t border-border pt-4">
                <span className="block text-sm font-semibold text-ink">{review.author_name}</span>
                <span className="block text-xs text-ink-400">
                  {review.trip?.destination?.name ?? review.trip?.title}
                  {review.trip_month ? ` · Travelled ${review.trip_month}` : ""}
                </span>
              </figcaption>
            </button>
          );
        })}
      </div>

      <p className="mt-6 text-sm text-ink-400">
        Tap the card to read the next one · {reviews.length} in total
      </p>
      {frontTripSlug && (
        <Link
          href={`/trips/${frontTripSlug}`}
          className="mt-2 text-sm font-medium text-pine underline underline-offset-2 hover:text-pine-600"
        >
          See this escape
        </Link>
      )}
    </div>
  );
}
