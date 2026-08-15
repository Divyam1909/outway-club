import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, MapPin } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SmartImage } from "@/components/ui/smart-image";
import { PostCard } from "@/components/blog/post-card";
import { ShareButtons } from "@/components/blog/share-buttons";
import { CommentsSection } from "@/components/blog/comments-section";
import { RecordView } from "@/components/blog/record-view";
import { BlogPostJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { Eyebrow } from "@/components/ui/eyebrow";
import {
  getApprovedComments,
  getPostBySlug,
  getPublishedPostSlugs,
  getRelatedPosts,
} from "@/lib/blog";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { formatDate } from "@/lib/utils";
import { site } from "@/config/site";

export const revalidate = 300;

/** Prerender published posts — see the note on the trip page. */
export async function generateStaticParams() {
  const slugs = await getPublishedPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  if (!isSupabaseConfigured()) return {};
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) return { title: "Post not found" };

  const title = post.seo_title || post.title;
  const description = post.seo_description || post.excerpt;
  const image = post.cover_image
    ? post.cover_image.startsWith("http")
      ? post.cover_image
      : `${site.url}${post.cover_image}`
    : `${site.url}/brand/logo.png`;

  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    keywords: post.tags,
    authors: [{ name: post.author_name }],
    openGraph: {
      type: "article",
      title,
      description,
      url: `${site.url}/blog/${post.slug}`,
      images: [{ url: image, alt: post.title }],
      publishedTime: post.published_at ?? post.created_at,
      modifiedTime: post.updated_at,
      authors: [post.author_name],
      tags: post.tags,
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  // View counting moved to <RecordView>, and comment prefill to the form
  // itself: both used to run here, and between them they made this page
  // uncacheable and its view count a measure of cache expiry. Neither is worth
  // a per-request render of an article that changes every few months.
  const [comments, related] = await Promise.all([
    getApprovedComments(post.id),
    getRelatedPosts(post),
  ]);

  const rated = comments.filter((comment) => comment.rating !== null);
  const averageRating =
    rated.length > 0
      ? rated.reduce((sum, comment) => sum + (comment.rating ?? 0), 0) / rated.length
      : 0;

  const published = post.published_at ?? post.created_at;
  const url = `${site.url}/blog/${post.slug}`;

  return (
    <article className="pb-20 sm:pb-24">
      <RecordView slug={post.slug} />
      <BlogPostJsonLd post={post} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Journal", path: "/blog" },
          { name: post.title, path: `/blog/${post.slug}` },
        ]}
      />

      {/* --- Header ---------------------------------------------------------- */}
      <header className="border-b border-border bg-cream-300 section-sm">
        {/* Same measure as the article body below, so the headline and the
            first paragraph share one left edge. */}
        <Container className="max-w-[42rem]">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-pine"
          >
            <ArrowLeft size={15} /> The Outway Journal
          </Link>

          {post.tags.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <li key={tag}>
                  <Link
                    href={`/blog?tag=${encodeURIComponent(tag)}`}
                    className="inline-flex rounded-full bg-clay-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-clay-600 transition-colors hover:bg-clay-100"
                  >
                    {tag}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <h1 className="mt-4 font-display text-3xl font-semibold leading-tight text-ink sm:text-[44px] sm:leading-[1.12]">
            {post.title}
          </h1>

          {post.subtitle && (
            <p className="mt-4 text-lg leading-relaxed text-ink-500 sm:text-xl">{post.subtitle}</p>
          )}

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-6 text-sm text-ink-500">
            <span className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pine text-xs font-semibold text-cream-100">
                {post.author_name.trim().charAt(0).toUpperCase()}
              </span>
              <span>
                <span className="font-medium text-ink">{post.author_name}</span>
                {post.author_role && (
                  <span className="block text-xs text-ink-500">{post.author_role}</span>
                )}
              </span>
            </span>
            <time dateTime={published}>{formatDate(published)}</time>
            <span className="flex items-center gap-1.5">
              <Clock size={14} /> {post.reading_minutes} min read
            </span>
            {post.destination?.slug && (
              <Link
                href={`/destinations/${post.destination.slug}`}
                className="flex items-center gap-1.5 font-medium text-pine hover:underline"
              >
                <MapPin size={14} /> {post.destination.name}
              </Link>
            )}
          </div>
        </Container>
      </header>

      {/* --- Cover ----------------------------------------------------------- */}
      {post.cover_image && (
        <Container className="max-w-5xl">
          <figure className="-mt-0 pt-8 sm:pt-10">
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-cream-300">
              <SmartImage
                src={post.cover_image}
                alt={post.cover_caption || post.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="object-cover"
              />
            </div>
            {post.cover_caption && (
              <figcaption className="mt-3 text-center text-[13px] text-ink-500">
                {post.cover_caption}
              </figcaption>
            )}
          </figure>
        </Container>
      )}

      {/* --- Body ------------------------------------------------------------ */}
      <Container className="max-w-[42rem] pt-10 sm:pt-14">
        {/* Sanitised on the server against a tag allowlist before it was
            stored — see src/lib/sanitize-html.ts. */}
        <div
          className="post-prose"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: post.content_html }}
        />

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-7">
          <ShareButtons url={url} title={post.title} />
          <span className="text-xs text-ink-500">
            Last updated {formatDate(post.updated_at)}
          </span>
        </div>

        {/* --- Trip CTA ------------------------------------------------------ */}
        {post.trip?.slug && (
          <aside className="mt-10 overflow-hidden rounded-2xl border border-border bg-pine-700 text-cream-100">
            <div className="flex flex-col gap-5 p-7 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div>
                <Eyebrow tone="dark">
                  Written about a real escape
                </Eyebrow>
                <h2 className="mt-2 heading-fluid text-xl sm:text-2xl">
                  {post.trip.title}
                </h2>
              </div>
              <Link href={`/trips/${post.trip.slug}`} className="btn shrink-0 bg-gold px-6 py-3 text-pine-700 hover:bg-gold-400">
                See the trip <ArrowRight size={16} />
              </Link>
            </div>
          </aside>
        )}

        {/* --- Comments ------------------------------------------------------ */}
        <div className="mt-14">
          <CommentsSection postId={post.id} comments={comments} averageRating={averageRating} />
        </div>
      </Container>

      {/* --- Related --------------------------------------------------------- */}
      {related.length > 0 && (
        <section className="mt-16 border-t border-border pt-14 sm:mt-20">
          <Container>
            <h2 className="mb-7 font-display text-2xl font-semibold text-ink">Read next</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {related.map((entry) => (
                <PostCard key={entry.id} post={entry} />
              ))}
            </div>
          </Container>
        </section>
      )}
    </article>
  );
}
