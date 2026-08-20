import { format, isSameMonth, isSameYear } from "date-fns";

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), "d MMM yyyy");
}

export function formatDateRange(start: string | Date, end: string | Date): string {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (isSameMonth(startDate, endDate) && isSameYear(startDate, endDate)) {
    return `${format(startDate, "d")} to ${format(endDate, "d MMM yyyy")}`;
  }
  if (isSameYear(startDate, endDate)) {
    return `${format(startDate, "d MMM")} to ${format(endDate, "d MMM yyyy")}`;
  }
  return `${format(startDate, "d MMM yyyy")} to ${format(endDate, "d MMM yyyy")}`;
}

/** "October 2026" — the label for a month filter value like "2026-10". */
export function formatMonth(isoMonth: string): string {
  return format(new Date(`${isoMonth}-01T00:00:00`), "MMMM yyyy");
}

export function seatsLeft(totalSeats: number, seatsBooked: number): number {
  return Math.max(totalSeats - seatsBooked, 0);
}

/**
 * "Escape 001" for a numbered edition, null for everything else. The number
 * lives on the trip row, so the badge follows the data instead of being typed
 * into a dozen components the way it used to be.
 */
export function editionLabel(trip: { edition_number: number | null }): string | null {
  if (trip.edition_number === null) return null;
  return `Escape ${String(trip.edition_number).padStart(3, "0")}`;
}

/**
 * Splits one authored line into a lead and a body.
 *
 * The whole journey layer is authored the same way — an em dash separating a
 * short label from the sentence that explains it:
 *
 *   "Conversations — The people sitting next to you are the actual product"
 *
 * A line with no dash is entirely valid and comes back as body-only, so a
 * one-liner never renders as an empty heading with nothing under it. Only the
 * first dash splits, because bodies legitimately contain them.
 */
export function splitLead(line: string): { lead: string | null; body: string } {
  const match = line.match(/^\s*(.{1,60}?)\s+—\s+([\s\S]+)$/);
  if (!match) return { lead: null, body: line.trim() };
  return { lead: match[1].trim(), body: match[2].trim() };
}

/**
 * Splits an itinerary activity into its time column and its label.
 *
 * Activities carry one more piece than the rest of the journey layer: an
 * operational clock time, in brackets, inside the lead.
 *
 *   "Late afternoon (4:00 PM) — Open-jeep exploration with a naturalist"
 *
 * The website shows "Late afternoon", because the brief is explicit that the
 * customer-facing journey shows the experience while exact timings live in the
 * internal operations sheet. The brochure PDF prints both, because somebody
 * has to actually run the day. One row in the database, two audiences, and no
 * second field to keep in sync.
 *
 * scripts/build-itinerary-pdf.mjs carries the same regex on purpose — it is a
 * plain Node script and cannot import this module. If you change the shape
 * here, change it there.
 */
export function splitActivity(activity: string): {
  /** The reader-facing band, e.g. "Late afternoon". Empty when there is none. */
  band: string;
  /** The operational time, e.g. "4:00 PM". Null when the line carries none. */
  exact: string | null;
  label: string;
} {
  const { lead, body } = splitLead(activity);
  if (lead === null) return { band: "", exact: null, label: body };

  const timed = lead.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  return timed
    ? { band: timed[1].trim(), exact: timed[2].trim(), label: body }
    : { band: lead, exact: null, label: body };
}

/**
 * Normalises an embedded Supabase relation to a single row.
 *
 * Without generated database types, postgrest-js widens every embedded
 * relation to an array — even a many-to-one like bookings → departures, which
 * actually comes back as a single object at runtime. This accepts both shapes.
 */
export function relatedOne<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T) ?? null;
  return (value as T) ?? null;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const CATEGORY_LABELS: Record<string, string> = {
  adventure: "Adventure",
  leisure: "Leisure",
  honeymoon: "Honeymoon",
  pilgrimage: "Pilgrimage",
  wildlife: "Wildlife",
  trek: "Trek",
  weekend: "Weekend",
  family: "Family",
  culture: "Culture & Heritage",
};

export const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Easy",
  moderate: "Moderate",
  challenging: "Challenging",
};
