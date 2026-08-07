import Link from "next/link";
import { Clock, MessageCircle } from "lucide-react";
import { clsx } from "clsx";
import { SmartImage } from "@/components/ui/smart-image";
import { formatDate } from "@/lib/utils";
import type { BlogPost } from "@/lib/types";

/**
 * A post in a grid. `featured` switches to the wide two-column treatment used
 * once at the top of /blog.
 */
export function PostCard({ post, featured = false }: { post: BlogPost; featured?: boolean }) {
  const date = post.published_at ?? post.created_at;

  return (
    <article
      className={clsx(
        "card-lift group flex overflow-hidden rounded-2xl border border-border bg-white shadow-soft",
        featured ? "flex-col lg:flex-row" : "h-full flex-col"
      )}
    >
      <Link
        href={`/blog/${post.slug}`}
        aria-hidden="true"
        tabIndex={-1}
        className={clsx(
          "relative shrink-0 overflow-hidden bg-cream-300",
          featured ? "aspect-[16/10] lg:aspect-auto lg:w-[52%]" : "aspect-[16/10]"
        )}
      >
        <SmartImage
          src={post.cover_image}
          alt=""
          fill
          sizes={featured ? "(max-width: 1024px) 100vw, 52vw" : "(max-width: 768px) 100vw, 33vw"}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:group-hover:scale-100"
          fallbackLabel="Outway journal"
        />
      </Link>

      <div className={clsx("flex flex-1 flex-col", featured ? "p-7 sm:p-9" : "p-6")}>
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ink-400">
          {post.destination?.name && (
            <span className="font-semibold uppercase tracking-[0.14em] text-clay">
              {post.destination.name}
            </span>
          )}
          <time dateTime={date}>{formatDate(date)}</time>
          <span className="flex items-center gap-1">
            <Clock size={12} /> {post.reading_minutes} min read
          </span>
          {post.comment_count > 0 && (
            <span className="flex items-center gap-1">
              <MessageCircle size={12} /> {post.comment_count}
            </span>
          )}
        </div>

        <h3
          className={clsx(
            "font-display font-semibold leading-snug text-ink",
            featured ? "text-2xl sm:text-3xl" : "text-xl"
          )}
        >
          <Link href={`/blog/${post.slug}`} className="transition-colors hover:text-pine">
            {post.title}
          </Link>
        </h3>

        <p
          className={clsx(
            "mt-3 flex-1 leading-relaxed text-ink-500",
            featured ? "text-base" : "line-clamp-3 text-sm"
          )}
        >
          {post.excerpt}
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <span className="text-xs font-medium text-ink-400">By {post.author_name}</span>
          {post.tags.length > 0 && (
            <span className="flex flex-wrap gap-1.5">
              {post.tags.slice(0, featured ? 4 : 2).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-cream-300 px-2.5 py-1 text-[11px] font-medium capitalize text-ink-500"
                >
                  {tag}
                </span>
              ))}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
