import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/ui/rating-stars";
import { CommentModeration } from "@/components/admin/comment-moderation";
import { getCommentsForAdmin } from "@/lib/blog";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Journal comments" };

export default async function AdminBlogCommentsPage() {
  const comments = await getCommentsForAdmin();

  // Anything waiting on a decision goes to the top — that's the whole job.
  const pending = comments.filter((comment) => !comment.is_approved);
  const live = comments.filter((comment) => comment.is_approved);
  const ordered = [...pending, ...live];

  return (
    <div>
      <Link
        href="/admin/blog"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-pine"
      >
        <ArrowLeft size={15} /> Journal
      </Link>

      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-ink">Comments</h1>
        <p className="mt-1 text-sm text-ink-500">
          {pending.length} waiting · {live.length} live. Comments stay hidden until you publish
          them.
        </p>
      </div>

      {ordered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cream-300 text-ink-400">
            <MessageSquare size={22} />
          </span>
          <h2 className="font-display text-xl font-semibold text-ink">No comments yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
            Readers can comment on any published post without an account. They&apos;ll appear here
            first.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {ordered.map((comment) => (
            <li
              key={comment.id}
              className="rounded-2xl border border-border bg-white p-5 sm:p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <Badge tone={comment.is_approved ? "pine" : "clay"}>
                      {comment.is_approved ? "Live" : "Pending"}
                    </Badge>
                    <span className="font-semibold text-ink">{comment.author_name}</span>
                    {comment.rating !== null && <RatingStars rating={comment.rating} size={13} />}
                    {comment.user_id && (
                      <span className="text-xs font-medium text-pine">Signed-in account</span>
                    )}
                  </div>

                  <p className="mt-1.5 text-xs text-ink-400">
                    {formatDate(comment.created_at)}
                    {comment.author_email && (
                      <>
                        {" · "}
                        <a href={`mailto:${comment.author_email}`} className="hover:text-pine">
                          {comment.author_email}
                        </a>
                      </>
                    )}
                    {comment.post && (
                      <>
                        {" · on "}
                        <Link
                          href={`/blog/${comment.post.slug}`}
                          target="_blank"
                          className="font-medium text-ink-500 hover:text-pine"
                        >
                          {comment.post.title}
                        </Link>
                      </>
                    )}
                  </p>

                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-500">
                    {comment.body}
                  </p>
                </div>

                <CommentModeration commentId={comment.id} isApproved={comment.is_approved} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
