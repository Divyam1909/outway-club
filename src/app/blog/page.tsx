import type { Metadata } from "next";
import Link from "next/link";
import { NotebookPen, PenLine } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { PostCard } from "@/components/blog/post-card";
import { NewsletterForm } from "@/components/newsletter-form";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { getFeaturedPost, getPostTags, getPublishedPosts } from "@/lib/blog";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "The Outway Journal",
  description:
    "Field notes from the road — destination guides, honest trip write-ups and the reasoning behind how we plan an Outway escape.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "The Outway Journal",
    description:
      "Field notes from the road — destination guides, honest trip write-ups and how we plan an Outway escape.",
    url: `${site.url}/blog`,
    type: "website",
  },
};

export const revalidate = 300;

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;

  const [posts, tags, featured] = await Promise.all([
    getPublishedPosts({ tag }),
    getPostTags(),
    // A tag view is a filtered list, not a front page — no pinned post there.
    tag ? Promise.resolve(null) : getFeaturedPost(),
  ]);

  const rest = featured ? posts.filter((post) => post.id !== featured.id) : posts;

  return (
    <div className="pb-20 sm:pb-24">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Journal", path: "/blog" },
        ]}
      />

      <section className="border-b border-border bg-cream-300/40 py-16 sm:py-20">
        <Container className="max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-clay">
            The Outway Journal
          </p>
          <h1 className="font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
            Field notes from the road
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-500">
            Everything here is written by the people who actually plan and run the escapes —
            what a place is really like, what we got wrong, and why an itinerary looks the way it
            does.
          </p>
        </Container>
      </section>

      {/* --- Tag filter ------------------------------------------------------ */}
      {tags.length > 0 && (
        <section className="border-b border-border bg-white/60">
          <Container>
            <nav aria-label="Filter by topic" className="-mx-1 overflow-x-auto py-4 no-scrollbar">
              <ul className="flex w-max items-center gap-2 px-1">
                <li>
                  <Link
                    href="/blog"
                    aria-current={!tag ? "page" : undefined}
                    className={
                      !tag
                        ? "inline-flex rounded-full bg-pine px-4 py-2 text-sm font-medium text-cream-100"
                        : "inline-flex rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-ink-700 transition-colors hover:border-pine hover:text-pine"
                    }
                  >
                    All writing
                  </Link>
                </li>
                {tags.map((entry) => (
                  <li key={entry.tag}>
                    <Link
                      href={`/blog?tag=${encodeURIComponent(entry.tag)}`}
                      aria-current={tag === entry.tag ? "page" : undefined}
                      className={
                        tag === entry.tag
                          ? "inline-flex whitespace-nowrap rounded-full bg-pine px-4 py-2 text-sm font-medium capitalize text-cream-100"
                          : "inline-flex whitespace-nowrap rounded-full border border-border bg-white px-4 py-2 text-sm font-medium capitalize text-ink-700 transition-colors hover:border-pine hover:text-pine"
                      }
                    >
                      {entry.tag}
                      <span className="ml-1.5 text-xs opacity-60">{entry.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </Container>
        </section>
      )}

      {/* --- Featured ------------------------------------------------------- */}
      {featured && (
        <section className="pt-12 sm:pt-14">
          <Container>
            <Reveal>
              <PostCard post={featured} featured />
            </Reveal>
          </Container>
        </section>
      )}

      {/* --- Grid ------------------------------------------------------------ */}
      {rest.length > 0 && (
        <section className="pt-10 sm:pt-12">
          <Container>
            {tag && (
              <h2 className="mb-6 font-display text-2xl font-semibold capitalize text-ink">
                {posts.length} post{posts.length === 1 ? "" : "s"} tagged &ldquo;{tag}&rdquo;
              </h2>
            )}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((post, index) => (
                <Reveal key={post.id} delay={index * 70}>
                  <PostCard post={post} />
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* --- Empty states ---------------------------------------------------- */}
      {posts.length === 0 && (
        <section className="pt-14">
          <Container className="max-w-2xl">
            <div className="rounded-3xl border border-border bg-white p-8 text-center shadow-card sm:p-10">
              <span className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-clay-50 text-clay">
                {tag ? <PenLine size={22} /> : <NotebookPen size={22} />}
              </span>
              <h2 className="font-display text-2xl font-semibold text-ink">
                {tag ? "Nothing under that topic yet" : "The first entries are being written"}
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-500">
                {tag
                  ? "We only tag a post when it genuinely belongs to a topic, so some are still empty."
                  : "We'd rather publish one piece worth your time than fill this page with search-engine filler. The Udaipur and Mount Abu guides are first up."}
              </p>
              <Link href={tag ? "/blog" : "/trips"} className="btn-accent mt-7">
                {tag ? "Back to all writing" : "See the current escape"}
              </Link>
            </div>
          </Container>
        </section>
      )}

      {/* --- Newsletter ------------------------------------------------------ */}
      <section className="pt-16">
        <Container>
          <div className="rounded-3xl bg-pine-700 px-8 py-12 text-cream-100 sm:px-12">
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
              <div>
                <h2 className="font-display text-2xl font-semibold sm:text-3xl">
                  New writing, roughly once a month
                </h2>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-cream-100/70">
                  The same list we use to announce a new escape. One email when there&apos;s
                  something worth reading or booking — nothing else, ever.
                </p>
              </div>
              <NewsletterForm source="blog" />
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
