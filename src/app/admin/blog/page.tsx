import type { Metadata } from "next";
import Link from "next/link";
import { Eye, Inbox, MessageSquare, PenLine, Plus, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DeletePostButton } from "@/components/admin/delete-post-button";
import { SubmissionReview } from "@/components/admin/submission-review";
import { requireBlogEditorPage } from "@/lib/auth";
import { getAllPostsForAdmin, getPendingCommentCount } from "@/lib/blog";
import { formatDate } from "@/lib/utils";
import type { BlogPost, PostStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Journal" };

const STATUS_BADGE: Record<PostStatus, { tone: "pine" | "gold" | "ink" | "clay"; label: string }> = {
  published: { tone: "pine", label: "Live" },
  submitted: { tone: "gold", label: "Waiting on you" },
  draft: { tone: "ink", label: "Draft" },
  rejected: { tone: "clay", label: "Declined" },
};

export default async function AdminBlogPage() {
  // Admins and bloggers. This is the one admin section the blogger role opens.
  await requireBlogEditorPage();

  const [posts, pendingComments] = await Promise.all([
    getAllPostsForAdmin(),
    getPendingCommentCount(),
  ]);

  const submissions = posts.filter((post) => post.status === "submitted");
  const published = posts.filter((post) => post.status === "published");
  const drafts = posts.filter((post) => post.status === "draft");
  const rest = posts.filter((post) => post.status !== "submitted");

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Journal</h1>
          <p className="mt-1 text-sm text-ink-500">
            {published.length} published · {drafts.length} draft{drafts.length === 1 ? "" : "s"}
            {submissions.length > 0 ? ` · ${submissions.length} waiting on you` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/blog/comments" className="btn-outline">
            <MessageSquare size={16} /> Comments
            {pendingComments > 0 && (
              <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-clay px-1.5 text-[11px] font-bold text-cream-100">
                {pendingComments}
              </span>
            )}
          </Link>
          <Link href="/admin/blog/new" className="btn-primary">
            <Plus size={16} /> Write a post
          </Link>
        </div>
      </div>

      {/* --- The queue -------------------------------------------------------
          Above the archive, because it is the only part of this screen with
          somebody waiting at the other end of it. */}
      {submissions.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 heading-sm text-lg text-ink">
            <Inbox size={17} className="text-clay" aria-hidden="true" />
            Sent in by readers
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-clay px-1.5 text-[11px] font-bold text-cream-100">
              {submissions.length}
            </span>
          </h2>

          <ul className="space-y-4">
            {submissions.map((post) => (
              <li key={post.id} className="rounded-2xl border border-gold-100 bg-gold-50/40 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-lg font-semibold leading-snug text-ink">
                      {post.title}
                    </p>
                    {post.subtitle && (
                      <p className="mt-0.5 text-sm text-ink-500">{post.subtitle}</p>
                    )}
                    <p className="mt-1.5 text-xs text-ink-500">
                      {post.author_name}
                      {post.submitter_email ? ` · ${post.submitter_email}` : ""} ·{" "}
                      {post.reading_minutes} min read
                      {post.submitted_at ? ` · sent ${formatDate(post.submitted_at)}` : ""}
                    </p>
                  </div>
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {post.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium capitalize text-ink-500"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink-700">
                  {post.excerpt}
                </p>

                <SubmissionReview
                  postId={post.id}
                  title={post.title}
                  editHref={`/admin/blog/${post.id}/edit`}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {rest.length === 0 && submissions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-clay-50 text-clay">
            <PenLine size={22} />
          </span>
          <h2 className="heading-sm text-xl text-ink">Nothing written yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
            A destination guide or an honest write-up of an escape does more for search than any
            amount of keyword stuffing, and it&apos;s the only thing on this site people forward
            to a friend.
          </p>
          <Link href="/admin/blog/new" className="btn-accent mt-6">
            <Plus size={16} /> Write the first one
          </Link>
        </div>
      ) : (
        rest.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-border bg-white">
            {/* Table on desktop; stacked cards on phones, where a five-column
                table would either overflow or shrink to nothing. */}
            <table className="hidden w-full text-sm sm:table">
              <thead className="border-b border-border bg-cream-300 text-left text-xs uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="px-5 py-3">Post</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Published</th>
                  <th className="px-5 py-3">Engagement</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {rest.map((post) => (
                  <tr key={post.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-4">
                      <span className="block font-medium text-ink">{post.title}</span>
                      <span className="mt-0.5 block text-xs text-ink-500">
                        /blog/{post.slug}
                        {post.destination?.name ? ` · ${post.destination.name}` : ""}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Badge tone={STATUS_BADGE[post.status].tone}>
                          {STATUS_BADGE[post.status].label}
                        </Badge>
                        {post.is_featured && <Badge tone="gold">Pinned</Badge>}
                        {post.source === "community" && <Badge tone="ink">Reader</Badge>}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-ink-500">
                      {post.published_at ? formatDate(post.published_at) : "N/A"}
                    </td>
                    <td className="px-5 py-4 text-ink-500">
                      <Engagement post={post} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-4">
                        {post.status === "published" && (
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            className="text-sm font-medium text-ink-500 hover:text-pine"
                          >
                            View
                          </Link>
                        )}
                        <Link
                          href={`/admin/blog/${post.id}/edit`}
                          className="text-sm font-medium text-pine hover:underline"
                        >
                          Edit
                        </Link>
                        <DeletePostButton postId={post.id} title={post.title} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="divide-y divide-border sm:hidden">
              {rest.map((post) => (
                <li key={post.id} className="p-5">
                  <div className="mb-2 flex flex-wrap gap-2">
                    <Badge tone={STATUS_BADGE[post.status].tone}>
                      {STATUS_BADGE[post.status].label}
                    </Badge>
                    {post.is_featured && <Badge tone="gold">Pinned</Badge>}
                    {post.source === "community" && <Badge tone="ink">Reader</Badge>}
                  </div>
                  <p className="font-medium text-ink">{post.title}</p>
                  <p className="mt-0.5 text-xs text-ink-500">
                    {post.published_at ? formatDate(post.published_at) : "Not published"} ·{" "}
                    {post.view_count} view{post.view_count === 1 ? "" : "s"} · {post.comment_count}{" "}
                    comment{post.comment_count === 1 ? "" : "s"}
                  </p>
                  <div className="mt-3 flex items-center gap-4">
                    <Link
                      href={`/admin/blog/${post.id}/edit`}
                      className="text-sm font-medium text-pine hover:underline"
                    >
                      Edit
                    </Link>
                    {post.status === "published" && (
                      <Link
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        className="text-sm font-medium text-ink-500"
                      >
                        View
                      </Link>
                    )}
                    <span className="ml-auto">
                      <DeletePostButton postId={post.id} title={post.title} />
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )
      )}
    </div>
  );
}

function Engagement({ post }: { post: BlogPost }) {
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      <span className="flex items-center gap-1">
        <Eye size={13} /> {post.view_count}
      </span>
      <span className="flex items-center gap-1">
        <MessageSquare size={13} /> {post.comment_count}
      </span>
      {post.rating > 0 && (
        <span className="flex items-center gap-1">
          <Star size={13} className="fill-gold text-gold" /> {post.rating}
        </span>
      )}
    </span>
  );
}
