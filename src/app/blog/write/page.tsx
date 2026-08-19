import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, LogIn, PenLine } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Badge } from "@/components/ui/badge";
import { SubmissionForm } from "@/components/blog/submission-form";
import { getCurrentUser } from "@/lib/auth";
import { getMySubmissions } from "@/lib/blog";
import { getAllDestinations } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import type { PostStatus } from "@/lib/types";

export const metadata: Metadata = {
  title: "Write for the Journal",
  description:
    "Send us a piece about a place you've travelled. A person reads every submission, and we reply either way.",
  alternates: { canonical: "/blog/write" },
  // The form itself is behind a sign-in and personal to whoever opens it —
  // there is nothing here worth indexing, and the "your submissions" list below
  // is somebody's unpublished writing.
  robots: { index: false, follow: true },
};

/**
 * The contributor's page: write, send, and see where your pieces stand.
 *
 * Signed-in only, and checked on the server rather than hidden in the browser —
 * the byline on a published piece has to belong to an actual account, and a
 * decline has to have somewhere to be explained.
 */
export default async function WriteForUsPage() {
  const current = await getCurrentUser();

  if (!current) {
    return (
      <div className="section-sm">
        <Container className="max-w-xl text-center">
          <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-clay-50 text-clay">
            <PenLine size={26} />
          </span>
          <h1 className="font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
            Write for the Journal
          </h1>
          <p className="mt-4 leading-relaxed text-ink-500">
            We publish pieces by people who have actually been somewhere. Sign in first — not to
            gate the writing, but so a published piece carries a real name, and so we have somewhere
            to write back to.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/login?redirect=/blog/write" className="btn-primary btn-lg">
              <LogIn size={16} /> Sign in
            </Link>
            <Link href="/signup?redirect=/blog/write" className="btn-outline btn-lg">
              Create an account
            </Link>
          </div>
          <p className="mt-6 text-sm text-ink-500">
            <Link href="/blog" className="font-medium text-pine underline underline-offset-2">
              Read the Journal first
            </Link>{" "}
            to see the sort of thing we run.
          </p>
        </Container>
      </div>
    );
  }

  const [destinations, mine] = await Promise.all([
    getAllDestinations(),
    getMySubmissions(current.user.id),
  ]);

  return (
    <div className="section-sm">
      <Container>
        <div className="mx-auto max-w-3xl">
          <Eyebrow className="mb-2">The Journal</Eyebrow>
          <h1 className="font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
            Write something for us
          </h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-ink-500">
            A place you went, what it was actually like, and what you&apos;d do differently. It
            doesn&apos;t have to be about one of our escapes. Nothing you send goes live on its own
            — a person reads every piece, and we write back either way.
          </p>

          {mine.length > 0 && <YourPieces posts={mine} />}

          <div className="mt-10">
            <SubmissionForm
              destinations={destinations.map((destination) => ({
                id: destination.id,
                name: destination.name,
              }))}
              defaultAuthorName={current.profile?.full_name ?? ""}
            />
          </div>
        </div>
      </Container>
    </div>
  );
}

const STATUS_COPY: Record<PostStatus, { tone: "pine" | "gold" | "ink" | "clay"; label: string; line: string }> = {
  submitted: {
    tone: "gold",
    label: "With us",
    line: "One of us is reading it. You'll get an email either way.",
  },
  published: { tone: "pine", label: "Live", line: "It's on the Journal, with your name on it." },
  rejected: {
    tone: "clay",
    label: "Not running",
    line: "We wrote to you about this one. Reply to that email if you'd like to talk it through.",
  },
  draft: {
    tone: "ink",
    label: "Held",
    line: "An editor has parked this one. We'll come back to you.",
  },
};

function YourPieces({ posts }: { posts: { id: string; title: string; slug: string; status: PostStatus; created_at: string; review_note: string | null }[] }) {
  return (
    <section className="mt-8 rounded-2xl border border-border bg-white p-6">
      <h2 className="heading-sm text-lg text-ink">What you&apos;ve sent us</h2>
      <ul className="mt-4 space-y-4">
        {posts.map((post) => {
          const status = STATUS_COPY[post.status];
          return (
            <li key={post.id} className="border-t border-border pt-4 first:border-0 first:pt-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={status.tone}>{status.label}</Badge>
                <span className="text-xs text-ink-500">{formatDate(post.created_at)}</span>
              </div>
              <p className="mt-1.5 font-medium text-ink">{post.title}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-ink-500">{status.line}</p>

              {/* The editor's note, shown to the person it was written for. */}
              {post.review_note && (
                <blockquote className="mt-2 border-l-2 border-border pl-3 text-sm leading-relaxed text-ink-700">
                  {post.review_note}
                </blockquote>
              )}

              {post.status === "published" && (
                <Link
                  href={`/blog/${post.slug}`}
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-pine underline underline-offset-2"
                >
                  Read it live <ExternalLink size={13} aria-hidden="true" />
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
