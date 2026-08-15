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
  /**
   * Bare hostname, for the places that show a domain rather than link to one —
   * the search-result preview in the blog editor, print copy, and anywhere a
   * "https://" would be noise. Derived, so changing NEXT_PUBLIC_SITE_URL moves
   * it too and no second env var can drift out of sync.
   */
  host: env("NEXT_PUBLIC_SITE_URL", "http://localhost:3000")
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, ""),

  email: env("NEXT_PUBLIC_CONTACT_EMAIL", "hello@outway.club"),
  /** Where booking/enquiry alerts land. Falls back to the public address. */
  opsEmail: env("OPS_EMAIL") || env("NEXT_PUBLIC_CONTACT_EMAIL", "hello@outway.club"),

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

  /**
   * Search Console / Webmaster Tools ownership tokens.
   *
   * Only the bare token, not the whole <meta> tag — Next builds the tag. Empty
   * means no tag is rendered at all, which is correct: an empty content
   * attribute is a failed verification rather than an absent one.
   *
   * The DNS TXT method is the better one for the apex domain (it survives a
   * redeploy and covers every subdomain); this exists because the HTML-tag
   * method is the path of least resistance if you're already in the dashboard.
   */
  verification: {
    google: env("NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION"),
    bing: env("NEXT_PUBLIC_BING_SITE_VERIFICATION"),
  },

  /** Responded-within promise used in copy and auto-replies. Keep honest. */
  responseTime: "one business day",

  /**
   * Online checkout. False while we confirm seats by hand: "Book now" opens
   * the pre-booking questionnaire, ops reply, and payment is arranged
   * directly. Every claim about paying on this site reads from here, so
   * flipping it back to true is one edit rather than a copy hunt — see
   * components/trips/trust-band.tsx and components/booking/booking-panel.tsx.
   */
  paymentsEnabled: false,

  /**
   * How people actually pay while checkout is off: UPI or a bank transfer,
   * then a screenshot on WhatsApp. Published openly on the trip page, which is
   * how every small operator in this market does it — seeing the account
   * before you commit is reassurance, not exposure.
   *
   * Every field is env-sourced and the block hides itself unless a UPI ID or a
   * complete bank account is set. A half-filled account number would send
   * someone's money nowhere, so partial data renders nothing.
   */
  bank: {
    upiId: env("NEXT_PUBLIC_UPI_ID"),
    accountName: env("NEXT_PUBLIC_BANK_ACCOUNT_NAME"),
    bankName: env("NEXT_PUBLIC_BANK_NAME"),
    accountNumber: env("NEXT_PUBLIC_BANK_ACCOUNT_NUMBER"),
    ifsc: env("NEXT_PUBLIC_BANK_IFSC"),
  },
} as const;

/** True when there is at least one complete, usable way to pay. */
export function hasPaymentDetails(): boolean {
  const { upiId, accountName, bankName, accountNumber, ifsc } = site.bank;
  return Boolean(upiId) || Boolean(accountName && bankName && accountNumber && ifsc);
}

/**
 * The three lines under the price.
 *
 * Reassurance at the exact moment someone is deciding — the same job the
 * competition does with "Instant Confirmation · Best Price Guaranteed · 1000+
 * Happy Customers". Ours say only what is true today: a real person replies,
 * the price has nothing added to it, and we carry the risk if we cancel.
 *
 * This is the line to edit as claims become evidenced. "1,000 travellers" is
 * a fine badge the day the 1,000th traveller comes home; it is a lie the day
 * before, and this site's whole argument is that we don't do that.
 */
export const TRUST_POINTS = [
  "A person confirms your seat, within one business day",
  "No booking fee, no card surcharge, nothing added later",
  "If we cancel, you get 100% back. No exceptions",
] as const;

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
