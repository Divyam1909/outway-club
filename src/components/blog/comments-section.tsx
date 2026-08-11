import { MessageSquare } from "lucide-react";
import { RatingStars } from "@/components/ui/rating-stars";
import { CommentForm } from "@/components/blog/comment-form";
import { formatDate } from "@/lib/utils";
import type { BlogComment } from "@/lib/types";

export function CommentsSection({
  postId,
  comments,
  averageRating,
  defaultAuthorName,
  defaultAuthorEmail,
}: {
  postId: string;
  comments: BlogComment[];
  averageRating: number;
  defaultAuthorName: string;
  defaultAuthorEmail: string;
}) {
  const rated = comments.filter((comment) => comment.rating !== null);

  return (
    <section id="comments" className="scroll-mt-24">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
          {comments.length > 0
            ? `${comments.length} comment${comments.length === 1 ? "" : "s"}`
            : "Comments"}
        </h2>

        {rated.length > 0 && (
          <div className="flex items-center gap-2.5">
            <span className="font-display text-2xl font-semibold text-ink">
              {averageRating.toFixed(1)}
            </span>
            <span>
              <RatingStars rating={averageRating} size={15} />
              <span className="mt-0.5 block text-xs text-ink-500">
                from {rated.length} reader{rated.length === 1 ? "" : "s"}
              </span>
            </span>
          </div>
        )}
      </div>

      {comments.length > 0 ? (
        <ul className="mb-10 space-y-4">
          {comments.map((comment) => (
            <li key={comment.id} className="rounded-2xl border border-border bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pine-50 heading-sm text-sm text-pine">
                  {comment.author_name.trim().charAt(0).toUpperCase()}
                </span>
                <span className="font-semibold text-ink">{comment.author_name}</span>
                {comment.rating !== null && <RatingStars rating={comment.rating} size={13} />}
                <time dateTime={comment.created_at} className="text-xs text-ink-500">
                  {formatDate(comment.created_at)}
                </time>
              </div>
              <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-ink-500">
                {comment.body}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mb-10 flex items-start gap-3 rounded-2xl border border-dashed border-border bg-cream-300 p-6">
          <MessageSquare size={20} className="mt-0.5 shrink-0 text-ink-500" />
          <p className="text-sm leading-relaxed text-ink-500">
            No comments on this one yet. If you&apos;ve been to this place, or you think we&apos;ve
            got something wrong, you&apos;d be the first to say so.
          </p>
        </div>
      )}

      <CommentForm
        postId={postId}
        defaultAuthorName={defaultAuthorName}
        defaultAuthorEmail={defaultAuthorEmail}
      />
    </section>
  );
}
