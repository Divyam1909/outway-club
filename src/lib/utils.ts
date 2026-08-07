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
    return `${format(startDate, "d")} – ${format(endDate, "d MMM yyyy")}`;
  }
  if (isSameYear(startDate, endDate)) {
    return `${format(startDate, "d MMM")} – ${format(endDate, "d MMM yyyy")}`;
  }
  return `${format(startDate, "d MMM yyyy")} – ${format(endDate, "d MMM yyyy")}`;
}

export function seatsLeft(totalSeats: number, seatsBooked: number): number {
  return Math.max(totalSeats - seatsBooked, 0);
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
