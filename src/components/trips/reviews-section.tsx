import Link from "next/link";
import { Play, ShieldCheck } from "lucide-react";
import { RatingStars } from "@/components/ui/rating-stars";
import type { Review } from "@/lib/types";

export function ReviewsSection({
  reviews,
  rating,
  reviewCount,
  tripSlug,
}: {
  reviews: Review[];
  rating: number;
  reviewCount: number;
  tripSlug: string;
}) {
  if (reviewCount === 0 || reviews.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-white/60 p-7">
        <ShieldCheck size={22} className="mb-3 text-pine" />
        <p className="font-display text-lg font-semibold text-ink">No reviews yet</p>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-500">
          Nobody has been on this departure yet, so there is nothing honest to put here. We
          don&apos;t seed reviews, buy them, or carry them over from other trips — only travellers
          with a paid booking on a departure that has already run can post one.
        </p>
        <Link
          href="/testimonials"
          className="mt-4 inline-block text-sm font-medium text-pine underline underline-offset-2"
        >
          How reviews work here
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <span className="font-display text-3xl font-semibold text-ink">{rating.toFixed(1)}</span>
        <div>
          <RatingStars rating={rating} size={16} />
          <p className="text-sm text-ink-500">
            {reviewCount} verified review{reviewCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {reviews.map((review) => (
          <figure key={review.id} className="rounded-2xl border border-border bg-white p-5">
            <RatingStars rating={review.rating} size={13} />
            {review.title && <p className="mt-2 font-semibold text-ink">{review.title}</p>}
            <blockquote className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-500">
              {review.body}
            </blockquote>

            {review.video_url && (
              <a
                href={review.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-clay hover:underline"
              >
                <Play size={12} className="fill-clay" /> Watch their video
              </a>
            )}

            <figcaption className="mt-3 text-xs font-medium text-ink-400">
              {review.author_name}
              {review.trip_month ? ` · Travelled ${review.trip_month}` : ""}
            </figcaption>
          </figure>
        ))}
      </div>

      <p className="mt-6 text-xs text-ink-400">
        Every review above is tied to a paid booking on this trip.{" "}
        <Link href={`/trips/${tripSlug}/review`} className="underline underline-offset-2 hover:text-pine">
          Travelled with us? Add yours.
        </Link>
      </p>
    </div>
  );
}
