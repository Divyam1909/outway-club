/**
 * Routes <img> tags inside stored article HTML through Cloudflare's image
 * transformation endpoint.
 *
 * Why this exists: article bodies are stored as HTML and rendered with
 * dangerouslySetInnerHTML, so their <img> tags never pass through next/image.
 * The Images binding in wrangler.jsonc optimises every <Image> component on the
 * site but cannot see these — they were being delivered as full-size originals
 * into a 672px column, roughly 1.5MB on the Udaipur guide alone.
 *
 * This runs at render time and is deliberately never written back to the
 * database. `sanitize-html.ts` allows only src/alt/width/height on <img>, so a
 * re-save from the admin editor would strip the srcset regardless — which is
 * the right outcome. The stored copy stays platform-neutral markup; the CDN
 * wiring is applied on the way out.
 *
 * Gated on NODE_ENV rather than a platform flag, matching the pattern
 * Cloudflare and OpenNext use for their own next/image loader. In development
 * the file is served straight from /public. NOTE: that means a deploy back to
 * Vercel would emit /cdn-cgi/image/ URLs that resolve to nothing — if this app
 * ever runs somewhere other than Cloudflare in production, this needs a real
 * platform check.
 */

/** The article column is `max-w-[42rem]`. */
const BODY_COLUMN_PX = 672;

/** 1×, ~1.5× and 2× the column. Each width is one unique transformation per
 *  image per month, so the list is kept deliberately short. */
const WIDTHS = [640, 960, 1344];

const QUALITY = 80;

/**
 * Remote hosts routed through the CDN. Images uploaded from the admin editor
 * land in Supabase Storage, so a published article can reference either a
 * same-origin /images path or an absolute Supabase URL.
 *
 * A host here must ALSO appear in two other places or its transformations fail
 * at request time: `remotePatterns` in next.config.mjs, and the zone's allowed
 * sources list in the Cloudflare dashboard (Images → Sources → Specified
 * origins). Same-origin images are exempt — Cloudflare always permits source
 * images from the zone serving the transformation.
 */
const ALLOWED_REMOTE_HOSTS = [/(^|\.)supabase\.co$/];

function isRewritable(src: string): boolean {
  if (src.startsWith("/cdn-cgi/")) return false;
  if (src.startsWith("/")) return true;
  try {
    const url = new URL(src);
    return url.protocol === "https:" && ALLOWED_REMOTE_HOSTS.some((h) => h.test(url.hostname));
  } catch {
    return false;
  }
}

function transformUrl(path: string, width: number): string {
  // Cloudflare takes the source after the comma-separated option list: a
  // same-origin path with its leading slash removed, or a full absolute URL.
  const source = path.startsWith("/") ? path.slice(1) : path;
  return `/cdn-cgi/image/width=${width},quality=${QUALITY},format=auto/${source}`;
}

export function optimizeArticleImages(html: string): string {
  const useCdn = process.env.NODE_ENV !== "development";

  return html.replace(/<img\b([^>]*?)\s*\/?>/gi, (tag, rawAttrs: string) => {
    const src = /\ssrc="([^"]*)"/i.exec(rawAttrs)?.[1];
    if (!src) return tag;

    let attrs = rawAttrs;

    // Worth doing on every platform: these figures all sit below the fold.
    if (!/\sloading=/i.test(attrs)) attrs += ' loading="lazy"';
    if (!/\sdecoding=/i.test(attrs)) attrs += ' decoding="async"';

    if (!useCdn || !isRewritable(src)) return `<img${attrs} />`;

    const srcset = WIDTHS.map((w) => `${transformUrl(src, w)} ${w}w`).join(", ");
    attrs = attrs.replace(
      /\ssrc="[^"]*"/i,
      ` src="${transformUrl(src, WIDTHS[WIDTHS.length - 1])}"`,
    );
    attrs += ` srcset="${srcset}" sizes="(max-width: ${BODY_COLUMN_PX}px) 100vw, ${BODY_COLUMN_PX}px"`;

    return `<img${attrs} />`;
  });
}
