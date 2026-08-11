import type { Metadata } from "next";
import Link from "next/link";
import { Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/ui/rating-stars";
import { ReviewModeration } from "@/components/admin/review-moderation";
import { getPendingReviewsForAdmin } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Reviews" };
export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const reviews = await getPendingReviewsForAdmin();
  const pending = reviews.filter((review) => !review.is_approved);
  const published = reviews.filter((review) => review.is_approved);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Reviews</h1>
      <p className="mb-7 mt-1 max-w-2xl text-sm leading-relaxed text-ink-500">
        Every review here came from a verified booking on a departure that has already run. The
        API enforces that, so nothing else can get in. Moderate for authenticity and abuse only:
        publishing a filtered set of only-positive reviews is both dishonest and against consumer
        law.
      </p>

      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white/50 p-12 text-center">
          <p className="heading-sm text-lg text-ink">No reviews yet</p>
          <p className="mt-1 text-sm text-ink-500">
            Travellers can review from the day after their trip ends.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          <ReviewGroup
            title={`Awaiting moderation (${pending.length})`}
            reviews={pending}
            emptyLabel="Nothing waiting, you're all caught up."
          />
          <ReviewGroup
            title={`Published (${published.length})`}
            reviews={published}
            emptyLabel="Nothing published yet."
          />
        </div>
      )}
    </div>
  );
}

function ReviewGroup({
  title,
  reviews,
  emptyLabel,
}: {
  title: string;
  reviews: Awaited<ReturnType<typeof getPendingReviewsForAdmin>>;
  emptyLabel: string;
}) {
  return (
    <section>
      <h2 className="mb-4 heading-sm text-lg text-ink">{title}</h2>
      {reviews.length === 0 ? (
        <p className="text-sm text-ink-500">{emptyLabel}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 sm:flex-row"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <RatingStars rating={review.rating} size={14} />
                  <span className="font-medium text-ink">{review.author_name}</span>
                  {review.trip && (
                    <Link
                      href={`/trips/${review.trip.slug}`}
                      className="text-xs text-ink-500 hover:text-pine"
                    >
                      {review.trip.title}
                    </Link>
                  )}
                  {review.video_url && (
                    <Badge tone="clay">
                      <Video size={11} /> Video
                    </Badge>
                  )}
                </div>

                {review.title && <p className="mt-2 font-semibold text-ink">{review.title}</p>}
                <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-500">
                  {review.body}
                </p>

                {review.video_url && (
                  <a
                    href={review.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block break-all text-xs text-pine underline underline-offset-2"
                  >
                    {review.video_url}
                  </a>
                )}

                <p className="mt-3 text-xs text-ink-500">
                  Submitted {formatDate(review.created_at)}
                  {review.trip_month ? ` · Travelled ${review.trip_month}` : ""}
                </p>
              </div>

              <ReviewModeration reviewId={review.id} isApproved={review.is_approved} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
