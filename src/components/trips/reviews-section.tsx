import { RatingStars } from "@/components/ui/rating-stars";
import type { Review } from "@/lib/types";

export function ReviewsSection({
  reviews,
  rating,
  reviewCount,
}: {
  reviews: Review[];
  rating: number;
  reviewCount: number;
}) {
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <span className="font-display text-3xl font-semibold text-ink">{rating.toFixed(1)}</span>
        <div>
          <RatingStars rating={rating} size={16} />
          <p className="text-sm text-ink-500">{reviewCount} reviews</p>
        </div>
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-ink-500">No reviews yet — be the first to travel and tell us about it.</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-2xl border border-border bg-white p-5">
              <RatingStars rating={review.rating} size={13} />
              {review.title && (
                <p className="mt-2 font-semibold text-ink">{review.title}</p>
              )}
              <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{review.body}</p>
              <p className="mt-3 text-xs font-medium text-ink-400">
                {review.author_name}
                {review.trip_month ? ` · Travelled ${review.trip_month}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
