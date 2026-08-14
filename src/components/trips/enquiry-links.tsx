import Link from "next/link";
import { clsx } from "clsx";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { site, whatsappLink } from "@/config/site";

/**
 * The row under every "Book now": email, phone, WhatsApp, enquiry form.
 *
 * Plenty of people aren't ready to fill in a form — they want to ask one
 * question first, and if the only thing on the page is a booking button they
 * ask it somewhere else, or nowhere. Rendered as plain links rather than
 * buttons so it reads as "here's how to reach us", not a second call to action
 * competing with the first.
 */
export function EnquiryLinks({
  tripSlug,
  tripTitle,
  className,
  align = "start",
}: {
  tripSlug?: string;
  tripTitle?: string;
  className?: string;
  align?: "start" | "center";
}) {
  const whatsapp = whatsappLink(
    tripTitle
      ? `Hi Outway, I have a question about ${tripTitle}.`
      : "Hi Outway, I have a question about one of your escapes."
  );

  const linkClass =
    "flex items-center gap-1.5 text-ink-500 transition-colors hover:text-pine";

  return (
    <div
      className={clsx(
        "flex flex-wrap items-center gap-x-4 gap-y-2 text-xs",
        align === "center" ? "justify-center" : "justify-start",
        className
      )}
    >
      <Link href={tripSlug ? `/contact?trip=${tripSlug}` : "/contact"} className={linkClass}>
        <Mail size={13} aria-hidden="true" /> Write to us
      </Link>

      {site.phoneDisplay && (
        <a href={`tel:${site.phoneDisplay.replace(/\s/g, "")}`} className={linkClass}>
          <Phone size={13} aria-hidden="true" /> {site.phoneDisplay}
        </a>
      )}

      {whatsapp && (
        <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={linkClass}>
          <MessageCircle size={13} aria-hidden="true" /> WhatsApp
        </a>
      )}
    </div>
  );
}
