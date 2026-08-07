/**
 * Allowlist sanitiser for article bodies produced by the blog editor.
 *
 * The editor is a contentEditable surface, so what it hands back is browser
 * HTML — and the article page renders it with dangerouslySetInnerHTML. Only
 * admins can post, but "trusted author" is not a security model: a stolen
 * admin session, a paste from a compromised page, or a future writer role all
 * end up writing to the same column. Everything is therefore rebuilt from an
 * allowlist here, on the server, before it is stored.
 *
 * Deny-listing (stripping <script>) is the approach that keeps getting
 * bypassed; this drops every tag and attribute that isn't explicitly named.
 */

/** Tags kept as-is. Anything else has its markup dropped, text preserved. */
const ALLOWED_TAGS = new Set([
  "p", "br", "hr",
  "h2", "h3", "h4",
  // b/i/u/strike are what contentEditable actually emits — keeping them
  // avoids silently discarding formatting the writer applied and could see.
  "strong", "b", "em", "i", "u", "s", "strike", "del", "ins", "mark", "sub", "sup",
  "ul", "ol", "li",
  "blockquote", "figure", "figcaption",
  "a", "img",
  "code", "pre",
  "span", "div",
]);

/** Tags whose entire subtree — text included — is discarded. */
const VOID_THE_SUBTREE = new Set(["script", "style", "iframe", "object", "embed", "noscript", "template"]);

const SELF_CLOSING = new Set(["br", "hr", "img"]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title"]),
  img: new Set(["src", "alt", "width", "height"]),
  "*": new Set(["class"]),
};

/**
 * Class names the editor can apply. Keeping this closed means a class can
 * never be used to smuggle in a layout that covers the page or mimics site
 * chrome, and the article stylesheet only has to style what's listed.
 */
const ALLOWED_CLASSES = new Set([
  "post-lead",
  "post-small",
  "post-serif",
  "post-sans",
  "post-center",
  "post-right",
  "post-figure",
  "post-pullquote",
]);

const ALLOWED_URL_SCHEMES = ["https:", "http:", "mailto:", "tel:"];

function isSafeUrl(value: string): boolean {
  const trimmed = value.trim();
  // Relative and anchor links stay inside the site, so they're always fine.
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return true;
  try {
    const url = new URL(trimmed);
    return ALLOWED_URL_SCHEMES.includes(url.protocol);
  } catch {
    return false;
  }
}

function escapeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(value: string): string {
  return escapeText(value).replace(/"/g, "&quot;");
}

/** Pulls name="value" / name='value' / name=value pairs out of a tag. */
function parseAttributes(raw: string): Map<string, string> {
  const attrs = new Map<string, string>();
  const pattern = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(raw)) !== null) {
    const name = match[1].toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? "";
    if (!attrs.has(name)) attrs.set(name, value);
  }
  return attrs;
}

function cleanClasses(value: string): string {
  return value
    .split(/\s+/)
    .filter((name) => ALLOWED_CLASSES.has(name))
    .join(" ");
}

function serializeAttributes(tag: string, raw: string): string {
  const attrs = parseAttributes(raw);
  const allowed = ALLOWED_ATTRS[tag] ?? new Set<string>();
  const global = ALLOWED_ATTRS["*"];
  const out: string[] = [];

  for (const [name, value] of attrs) {
    if (!allowed.has(name) && !global.has(name)) continue;

    if (name === "class") {
      const classes = cleanClasses(value);
      if (classes) out.push(`class="${escapeAttr(classes)}"`);
      continue;
    }

    if (name === "href" || name === "src") {
      if (!isSafeUrl(value)) continue;
      out.push(`${name}="${escapeAttr(value.trim())}"`);
      continue;
    }

    if (name === "width" || name === "height") {
      const number = parseInt(value, 10);
      if (Number.isFinite(number) && number > 0 && number <= 8000) {
        out.push(`${name}="${number}"`);
      }
      continue;
    }

    out.push(`${name}="${escapeAttr(value)}"`);
  }

  // External links must not hand the opener a window reference.
  if (tag === "a") {
    const href = attrs.get("href") ?? "";
    if (/^https?:/i.test(href.trim())) {
      out.push('target="_blank"', 'rel="noopener noreferrer nofollow"');
    }
  }

  return out.length > 0 ? ` ${out.join(" ")}` : "";
}

/**
 * Returns HTML containing only allowlisted tags, attributes and URL schemes.
 * Unknown tags are unwrapped (their text survives); script-like subtrees are
 * removed whole.
 */
export function sanitizeHtml(input: unknown): string {
  if (typeof input !== "string" || input.length === 0) return "";

  const source = input.slice(0, 200_000);
  const tagPattern = /<\/?([a-zA-Z][a-zA-Z0-9-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>|<!--[\s\S]*?-->/g;

  const openStack: string[] = [];
  let out = "";
  let cursor = 0;
  /** Depth inside a discarded subtree; > 0 means swallow everything. */
  let skipDepth = 0;
  let skipTag: string | null = null;

  let match: RegExpExecArray | null;
  while ((match = tagPattern.exec(source)) !== null) {
    const text = source.slice(cursor, match.index);
    if (skipDepth === 0 && text) out += escapeText(text);
    cursor = tagPattern.lastIndex;

    const full = match[0];
    if (full.startsWith("<!--")) continue; // comments never survive

    const tag = (match[1] ?? "").toLowerCase();
    const rawAttrs = match[2] ?? "";
    const isClosing = full.startsWith("</");

    if (skipDepth > 0) {
      if (tag === skipTag) skipDepth += isClosing ? -1 : 1;
      if (skipDepth === 0) skipTag = null;
      continue;
    }

    if (VOID_THE_SUBTREE.has(tag)) {
      if (!isClosing && !full.endsWith("/>")) {
        skipDepth = 1;
        skipTag = tag;
      }
      continue;
    }

    if (!ALLOWED_TAGS.has(tag)) continue; // unwrap: keep the text, drop the tag

    if (isClosing) {
      const index = openStack.lastIndexOf(tag);
      if (index === -1) continue; // stray close tag
      // Close anything left dangling inside it, innermost first.
      while (openStack.length > index) {
        out += `</${openStack.pop()}>`;
      }
      continue;
    }

    const attrs = serializeAttributes(tag, rawAttrs);

    if (SELF_CLOSING.has(tag)) {
      if (tag === "img" && !/\ssrc="/.test(attrs)) continue; // an img with no usable src is noise
      out += `<${tag}${attrs} />`;
      continue;
    }

    out += `<${tag}${attrs}>`;
    openStack.push(tag);
  }

  if (skipDepth === 0) out += escapeText(source.slice(cursor));
  while (openStack.length > 0) out += `</${openStack.pop()}>`;

  return out.trim();
}

/** Visible text of an HTML fragment — used for excerpts and reading time. */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(p|div|h2|h3|h4|li|blockquote|figure)>/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Average adult reading speed, rounded up, floor of one minute. */
export function readingMinutes(html: string): number {
  const words = htmlToPlainText(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
