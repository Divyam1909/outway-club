/**
 * Downloadable itinerary brochures.
 *
 * The PDFs live in `public/itineraries/<slug>.pdf` and are generated from the
 * live trip rows by `npm run itinerary:pdf -- <slug>` — so regenerating is the
 * fix when an itinerary changes, never a redesign.
 *
 * This map exists because the trip page cannot ask the filesystem whether a
 * file is there: it renders on the edge, where there is no `fs`. Listing the
 * slugs by hand is two lines of maintenance and it fails in the safe direction
 * — a trip missing from here simply shows no download button, whereas a link
 * built by convention would 404 for every escape whose brochure hasn't been
 * generated yet.
 *
 * Adding one:
 *   1. npm run itinerary:pdf -- your-trip-slug
 *   2. add the slug below
 *
 * A brochure listed here is a public URL. That is fine and deliberate for a
 * published escape; for an unpublished one it is the whole point — ops need
 * something to send to the person asking what else is coming, and the trip
 * page itself 404s, so the file is the only surface. Nothing links to a draft
 * escape's PDF from the public site — the trip page that would carry the
 * button doesn't render at all — so the admin trips table is the only place
 * it is reachable from, and `trips.is_published` stays the single source of
 * truth for what is live.
 */
export const ITINERARY_PDFS: Record<string, { updated: string }> = {
  /** Escape 001. Live. */
  "jawai-udaipur": { updated: "2026-08-20" },
  /** Escape 002. Unpublished — admin console only. */
  "jawai-jodhpur": { updated: "2026-08-20" },
  /** Escape 003. Between departures, kept for ops. */
  "udaipur-mount-abu": { updated: "2026-08-19" },
};

export function itineraryPdfFor(slug: string): string | null {
  return slug in ITINERARY_PDFS ? `/itineraries/${slug}.pdf` : null;
}
