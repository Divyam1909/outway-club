/**
 * Single source of truth for business identity, contact details and policy
 * numbers. Everything user-facing — legal pages, emails, structured data,
 * the contact page — reads from here, so there is exactly one file to edit
 * when a real phone number / address / GSTIN is available.
 *
 * Anything sourced from an env var renders conditionally: if it isn't set,
 * the UI omits it entirely rather than printing a placeholder.
 */

function env(key: string, fallback = ""): string {
  return (process.env[key] ?? "").trim() || fallback;
}

export const site = {
  name: "Outway Club",
  /** Registered entity name used on legal pages & invoices. */
  legalName: env("NEXT_PUBLIC_LEGAL_NAME", "Outway Club"),
  tagline: "Journeys, not tour packages.",
  description:
    "Outway Club runs small-group escapes across India, each one planned end to end, capped tight, and on sale only once every night and transfer is booked.",

  url: env("NEXT_PUBLIC_SITE_URL", "http://localhost:3000").replace(/\/$/, ""),

  email: env("NEXT_PUBLIC_CONTACT_EMAIL", "hello@outwayclub.com"),
  /** Where booking/enquiry alerts land. Falls back to the public address. */
  opsEmail: env("OPS_EMAIL") || env("NEXT_PUBLIC_CONTACT_EMAIL", "hello@outwayclub.com"),

  /** Digits only, with country code, e.g. "919876543210". Empty = hidden. */
  whatsapp: env("NEXT_PUBLIC_WHATSAPP_NUMBER").replace(/[^\d]/g, ""),
  /** Display form, e.g. "+91 98765 43210". Empty = hidden. */
  phoneDisplay: env("NEXT_PUBLIC_CONTACT_PHONE"),
  /** Full registered address. Empty = hidden. */
  address: env("NEXT_PUBLIC_BUSINESS_ADDRESS"),
  /** City shown as a soft location cue when no full address is set. */
  city: env("NEXT_PUBLIC_BUSINESS_CITY", "Udaipur, Rajasthan"),
  gstin: env("NEXT_PUBLIC_GSTIN"),

  social: {
    instagram: env("NEXT_PUBLIC_INSTAGRAM_URL", "https://instagram.com/outway.club"),
    youtube: env("NEXT_PUBLIC_YOUTUBE_URL"),
  },

  /** Responded-within promise used in copy and auto-replies. Keep honest. */
  responseTime: "one business day",
} as const;

export function whatsappLink(message?: string): string | null {
  if (!site.whatsapp) return null;
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${site.whatsapp}${text}`;
}

/**
 * Cancellation & refund tiers. These exact numbers are rendered on
 * /refund-policy AND used by the cancellation API to compute refunds —
 * the page and the code can never drift apart.
 */
export const REFUND_TIERS = [
  { minDaysBefore: 15, refundPercent: 90, label: "15 days or more before departure" },
  { minDaysBefore: 7, refundPercent: 50, label: "7 to 14 days before departure" },
  { minDaysBefore: 0, refundPercent: 0, label: "Less than 7 days before departure" },
] as const;

export function refundPercentFor(daysBeforeDeparture: number): number {
  const tier = REFUND_TIERS.find((t) => daysBeforeDeparture >= t.minDaysBefore);
  return tier?.refundPercent ?? 0;
}
