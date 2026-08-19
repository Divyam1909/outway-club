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
 */
export const ITINERARY_PDFS: Record<string, { updated: string }> = {
  "udaipur-jawai": { updated: "2026-08-19" },
  "udaipur-mount-abu": { updated: "2026-08-19" },
};

export function itineraryPdfFor(slug: string): string | null {
  return slug in ITINERARY_PDFS ? `/itineraries/${slug}.pdf` : null;
}
