/**
 * Transactional email, sent through Resend's REST API (no SDK dependency).
 *
 * If RESEND_API_KEY is unset the module degrades to a logged no-op, so local
 * development and preview deploys never fail a booking just because email
 * isn't wired up. Every caller treats a failed send as non-fatal — a payment
 * that succeeded must never be rolled back because an inbox was unreachable.
 *
 * Supabase's own auth emails (signup confirmation, password reset) are sent
 * by Supabase, not this module — point Supabase's SMTP settings at the same
 * provider before launch. See README.
 */

import { site } from "@/config/site";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || `${site.name} <${site.email}>`;

  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY not set, skipped "${subject}" to ${String(to)}`);
    return false;
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });

    if (!response.ok) {
      console.error(`[email] send failed (${response.status}):`, await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error("[email] send threw:", error);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

const COLORS = {
  ink: "#221F1A",
  inkSoft: "#6B6257",
  pine: "#1E3D32",
  clay: "#C1622D",
  cream: "#FBF7F0",
  border: "#E8E1D2",
};

function layout(options: { preheader: string; heading: string; body: string }): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${COLORS.cream};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${COLORS.ink};">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(options.preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.cream};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${COLORS.border};border-radius:16px;overflow:hidden;">
        <!-- Cream band rather than pine: the mark is a near-black disc, which
             disappears against a dark header. width/height are set as attributes
             AND in the style because Outlook ignores the CSS and Gmail ignores
             nothing. -->
        <tr><td align="center" style="background:${COLORS.cream};padding:22px 32px;border-bottom:3px solid ${COLORS.pine};">
          <img src="${site.url}/brand/logo-email.png" width="64" height="64" alt="${site.name}"
               style="display:block;width:64px;height:64px;border:0;outline:none;text-decoration:none;border-radius:50%;">
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;font-weight:600;color:${COLORS.ink};">${escapeHtml(options.heading)}</h1>
          ${options.body}
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid ${COLORS.border};">
          <p style="margin:0;font-size:12px;line-height:1.6;color:${COLORS.inkSoft};">
            ${site.name} · <a href="mailto:${site.email}" style="color:${COLORS.pine};">${site.email}</a><br>
            <a href="${site.url}/terms" style="color:${COLORS.inkSoft};">Terms</a> ·
            <a href="${site.url}/privacy" style="color:${COLORS.inkSoft};">Privacy</a> ·
            <a href="${site.url}/refund-policy" style="color:${COLORS.inkSoft};">Cancellation &amp; refunds</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${COLORS.inkSoft};">${text}</p>`;
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 8px;"><tr><td style="background:${COLORS.clay};border-radius:999px;">
    <a href="${href}" style="display:inline-block;padding:13px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">${escapeHtml(label)}</a>
  </td></tr></table>`;
}

function detailRows(rows: [string, string][]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-top:1px solid ${COLORS.border};">
    ${rows
      .map(
        ([label, value]) => `<tr>
      <td style="padding:11px 0;border-bottom:1px solid ${COLORS.border};font-size:14px;color:${COLORS.inkSoft};">${escapeHtml(label)}</td>
      <td style="padding:11px 0;border-bottom:1px solid ${COLORS.border};font-size:14px;font-weight:600;color:${COLORS.ink};text-align:right;">${escapeHtml(value)}</td>
    </tr>`
      )
      .join("")}
  </table>`;
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export interface BookingEmailData {
  bookingRef: string;
  bookingId: string;
  customerName: string;
  customerEmail: string;
  tripTitle: string;
  dateRange: string | null;
  numTravelers: number;
  totalAmount: string;
  travelerNames: string[];
  specialRequests?: string | null;
  paymentId: string | null;
}

export function bookingConfirmationEmail(data: BookingEmailData) {
  return {
    subject: `Booking confirmed: ${data.tripTitle} (${data.bookingRef})`,
    html: layout({
      preheader: `Your seat on ${data.tripTitle} is confirmed. Reference ${data.bookingRef}.`,
      heading: `You're in, ${data.customerName.split(" ")[0] || "traveller"}.`,
      body: [
        paragraph(
          `Your seat on <strong style="color:${COLORS.ink};">${escapeHtml(data.tripTitle)}</strong> is confirmed and paid. Keep this email, the reference below is what we'll ask for.`
        ),
        detailRows([
          ["Booking reference", data.bookingRef],
          ...(data.dateRange ? ([["Dates", data.dateRange]] as [string, string][]) : []),
          ["Travellers", String(data.numTravelers)],
          ["Amount paid", data.totalAmount],
          ...(data.paymentId ? ([["Payment ID", data.paymentId]] as [string, string][]) : []),
        ]),
        paragraph(`<strong style="color:${COLORS.ink};">On the booking:</strong> ${escapeHtml(data.travelerNames.join(", "))}`),
        data.specialRequests
          ? paragraph(`<strong style="color:${COLORS.ink};">Your note to us:</strong> ${escapeHtml(data.specialRequests)}`)
          : "",
        paragraph(
          `We'll email the full joining instructions (pickup point, timings, what to pack and your trip captain's number) closer to departure. Carry an original government photo ID; it's mandatory at check-in.`
        ),
        button(`${site.url}/booking/confirmation/${data.bookingId}`, "View your booking"),
        paragraph(
          `Need to change something? Reply to this email or write to <a href="mailto:${site.email}" style="color:${COLORS.pine};">${site.email}</a>. Cancellation terms are on our <a href="${site.url}/refund-policy" style="color:${COLORS.pine};">refund policy</a> page.`
        ),
      ].join(""),
    }),
  };
}

export function newBookingAlertEmail(data: BookingEmailData) {
  return {
    subject: `New booking: ${data.tripTitle} · ${data.numTravelers} traveller${data.numTravelers > 1 ? "s" : ""} · ${data.totalAmount}`,
    html: layout({
      preheader: `${data.customerName} booked ${data.tripTitle}.`,
      heading: "New booking received",
      body: [
        detailRows([
          ["Reference", data.bookingRef],
          ["Trip", data.tripTitle],
          ...(data.dateRange ? ([["Dates", data.dateRange]] as [string, string][]) : []),
          ["Customer", data.customerName],
          ["Email", data.customerEmail],
          ["Travellers", String(data.numTravelers)],
          ["Amount", data.totalAmount],
          ...(data.paymentId ? ([["Razorpay payment", data.paymentId]] as [string, string][]) : []),
        ]),
        paragraph(`<strong style="color:${COLORS.ink};">Names:</strong> ${escapeHtml(data.travelerNames.join(", "))}`),
        data.specialRequests
          ? paragraph(`<strong style="color:${COLORS.ink};">Special requests:</strong> ${escapeHtml(data.specialRequests)}`)
          : "",
        button(`${site.url}/admin/bookings/${data.bookingId}`, "Open in admin"),
      ].join(""),
    }),
  };
}

export interface CancellationEmailData {
  bookingRef: string;
  customerName: string;
  customerEmail: string;
  tripTitle: string;
  refundAmount: string;
  refundPercent: number;
  totalAmount: string;
  reason?: string | null;
}

export function cancellationEmail(data: CancellationEmailData) {
  const refunded = data.refundPercent > 0;
  return {
    subject: `Booking cancelled: ${data.tripTitle} (${data.bookingRef})`,
    html: layout({
      preheader: refunded
        ? `${data.refundAmount} will be refunded to your original payment method.`
        : `Your booking has been cancelled.`,
      heading: "Your booking has been cancelled",
      body: [
        paragraph(
          `We've cancelled booking <strong style="color:${COLORS.ink};">${data.bookingRef}</strong> for ${escapeHtml(data.tripTitle)}. Sorry we won't see you on this one.`
        ),
        detailRows([
          ["Amount paid", data.totalAmount],
          ["Refund tier", `${data.refundPercent}% of amount paid`],
          ["Refund due", data.refundAmount],
        ]),
        refunded
          ? paragraph(
              `The refund has been initiated to your original payment method. Banks typically take 5 to 7 working days to post it, and it will appear against the original transaction rather than as a new credit.`
            )
          : paragraph(
              `This cancellation falls inside the no-refund window in our <a href="${site.url}/refund-policy" style="color:${COLORS.pine};">cancellation policy</a>, so no refund is due. If you believe there are exceptional circumstances here, reply to this email and we'll look at it properly.`
            ),
        paragraph(
          `Questions about this: <a href="mailto:${site.email}" style="color:${COLORS.pine};">${site.email}</a>.`
        ),
      ].join(""),
    }),
  };
}

export function cancellationAlertEmail(data: CancellationEmailData & { bookingId: string }) {
  return {
    subject: `Cancellation: ${data.tripTitle} (${data.bookingRef}) · refund ${data.refundAmount}`,
    html: layout({
      preheader: `${data.customerName} cancelled ${data.bookingRef}.`,
      heading: "Booking cancelled",
      body: [
        detailRows([
          ["Reference", data.bookingRef],
          ["Trip", data.tripTitle],
          ["Customer", data.customerName],
          ["Email", data.customerEmail],
          ["Paid", data.totalAmount],
          ["Refund due", `${data.refundAmount} (${data.refundPercent}%)`],
          ...(data.reason ? ([["Reason given", data.reason]] as [string, string][]) : []),
        ]),
        button(`${site.url}/admin/bookings/${data.bookingId}`, "Open in admin"),
      ].join(""),
    }),
  };
}

export interface EnquiryEmailData {
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  tripTitle?: string | null;
}

export function enquiryAlertEmail(data: EnquiryEmailData) {
  return {
    subject: `New enquiry: ${data.name}${data.tripTitle ? ` · ${data.tripTitle}` : ""}`,
    html: layout({
      preheader: data.message.slice(0, 120),
      heading: "New enquiry",
      body: [
        detailRows([
          ["Name", data.name],
          ["Email", data.email],
          ...(data.phone ? ([["Phone", data.phone]] as [string, string][]) : []),
          ...(data.tripTitle ? ([["About", data.tripTitle]] as [string, string][]) : []),
        ]),
        paragraph(escapeHtml(data.message).replace(/\n/g, "<br>")),
      ].join(""),
    }),
  };
}

export function enquiryAcknowledgementEmail(data: EnquiryEmailData) {
  return {
    subject: `We've got your message: ${site.name}`,
    html: layout({
      preheader: `Thanks for writing in. We reply within ${site.responseTime}.`,
      heading: `Thanks for writing in, ${data.name.split(" ")[0]}.`,
      body: [
        paragraph(
          `A real person reads every message that comes through the site. We'll get back to you within ${site.responseTime}${data.tripTitle ? ` about <strong style="color:${COLORS.ink};">${escapeHtml(data.tripTitle)}</strong>` : ""}.`
        ),
        paragraph(`For reference, here's what you sent:`),
        `<blockquote style="margin:0 0 14px;padding:12px 16px;border-left:3px solid ${COLORS.border};font-size:14px;line-height:1.6;color:${COLORS.inkSoft};">${escapeHtml(data.message).replace(/\n/g, "<br>")}</blockquote>`,
        button(`${site.url}/trips`, "Browse the current escape"),
      ].join(""),
    }),
  };
}

export interface TripRequestEmailData {
  requestId: string;
  name: string;
  email: string;
  phone: string;
  tripTitle: string;
  dateRange: string | null;
  numTravelers: number;
  /** Already-resolved label, e.g. "Delhi NCR" or the free-text city. */
  origin: string;
  travelHelp: string;
  /** Questionnaire answers as [question, answer] label pairs. */
  answers: [string, string][];
  dealBreakers?: string | null;
  notes?: string | null;
}

export function tripRequestAlertEmail(data: TripRequestEmailData) {
  return {
    subject: `Booking request: ${data.tripTitle} · ${data.name} · ${data.numTravelers} traveller${
      data.numTravelers > 1 ? "s" : ""
    }`,
    html: layout({
      preheader: `${data.name} wants ${data.numTravelers} seat${
        data.numTravelers > 1 ? "s" : ""
      } on ${data.tripTitle}, from ${data.origin}.`,
      heading: "New booking request",
      body: [
        detailRows([
          ["Trip", data.tripTitle],
          ...(data.dateRange ? ([["Dates", data.dateRange]] as [string, string][]) : []),
          ["Name", data.name],
          ["Email", data.email],
          ["Phone", data.phone],
          ["Travellers", String(data.numTravelers)],
          ["Starting from", data.origin],
          ["Flights / trains", data.travelHelp],
        ]),
        paragraph(`<strong style="color:${COLORS.ink};">How they travel</strong>`),
        detailRows(data.answers),
        data.dealBreakers
          ? paragraph(
              `<strong style="color:${COLORS.ink};">Would ruin it for them:</strong> ${escapeHtml(data.dealBreakers)}`
            )
          : "",
        data.notes
          ? paragraph(`<strong style="color:${COLORS.ink};">Anything else:</strong> ${escapeHtml(data.notes)}`)
          : "",
        paragraph(
          `Nothing is held and no seat has moved. Reply to this email to confirm the seat and take payment.`
        ),
        button(`${site.url}/admin/requests`, "Open in admin"),
      ].join(""),
    }),
  };
}

export function tripRequestAcknowledgementEmail(data: TripRequestEmailData) {
  return {
    subject: `We've got your request: ${data.tripTitle}`,
    html: layout({
      preheader: `Nothing is booked yet. We'll come back to you within ${site.responseTime}.`,
      heading: `Thanks, ${data.name.split(" ")[0] || "traveller"}. We've got it.`,
      body: [
        paragraph(
          `You asked for ${data.numTravelers} seat${
            data.numTravelers > 1 ? "s" : ""
          } on <strong style="color:${COLORS.ink};">${escapeHtml(data.tripTitle)}</strong>. Nothing is booked and nothing has been charged yet — this is a request, and a person reads it.`
        ),
        detailRows([
          ["Trip", data.tripTitle],
          ...(data.dateRange ? ([["Dates", data.dateRange]] as [string, string][]) : []),
          ["Travellers", String(data.numTravelers)],
          ["Starting from", data.origin],
          ["Flights / trains", data.travelHelp],
        ]),
        paragraph(
          `<strong style="color:${COLORS.ink};">What happens next.</strong> We'll write or call within ${site.responseTime} to confirm your seat is free, answer whatever you still want to ask, and only then take payment. If the answers you gave suggest a different departure would suit you better, we'll say so.`
        ),
        paragraph(
          `Timings shown on the itinerary are indicative and can shift with weather, traffic and monument hours. The route and the stays don't.`
        ),
        button(`${site.url}/contact`, "Reply or ask us something"),
        paragraph(
          `In a hurry? Write to <a href="mailto:${site.email}" style="color:${COLORS.pine};">${site.email}</a>${
            site.phoneDisplay ? ` or call ${escapeHtml(site.phoneDisplay)}` : ""
          }.`
        ),
      ].join(""),
    }),
  };
}

export function waitlistWelcomeEmail(data: { email: string; name?: string | null }) {
  return {
    subject: `You're on the list: ${site.name}`,
    html: layout({
      preheader: "We'll email you first when Escape 002 opens.",
      heading: data.name ? `You're on the list, ${data.name.split(" ")[0]}.` : "You're on the list.",
      body: [
        paragraph(
          `We run one escape at a time and we tell this list before we tell anyone else. When Escape 002 opens, you'll get the dates, the route and a booking link before it goes public.`
        ),
        paragraph(
          `No weekly newsletter, no drip campaign. You'll hear from us when there's an actual trip to hear about.`
        ),
        // The catalogue, not a specific trip. This pointed at a hardcoded slug
        // that had already been renamed once and only still worked because a
        // permanent redirect was catching it — a link in an email outlives the
        // trip it names, so it should name the list instead.
        button(`${site.url}/trips`, "See what's running now"),
      ].join(""),
    }),
  };
}

export function newBlogCommentAlertEmail(data: {
  authorName: string;
  postTitle: string;
  postSlug: string;
  rating: number | null;
  body: string;
}) {
  return {
    subject: `New blog comment awaiting approval: ${data.postTitle}`,
    html: layout({
      preheader: data.body.slice(0, 120),
      heading: "New comment on the journal",
      body: [
        detailRows([
          ["From", data.authorName],
          ["Post", data.postTitle],
          ["Rating", data.rating ? `${data.rating} / 5` : "No rating given"],
        ]),
        paragraph(escapeHtml(data.body).replace(/\n/g, "<br>")),
        paragraph(`It stays hidden until you approve it.`),
        button(`${site.url}/admin/blog/comments`, "Moderate comments"),
      ].join(""),
    }),
  };
}

export function newReviewAlertEmail(data: {
  authorName: string;
  tripTitle: string;
  rating: number;
  body: string;
  hasVideo: boolean;
}) {
  return {
    subject: `New review awaiting approval: ${data.rating}★ from ${data.authorName}`,
    html: layout({
      preheader: data.body.slice(0, 120),
      heading: "New review submitted",
      body: [
        detailRows([
          ["From", data.authorName],
          ["Trip", data.tripTitle],
          ["Rating", `${data.rating} / 5`],
          ["Video testimonial", data.hasVideo ? "Yes" : "No"],
        ]),
        paragraph(escapeHtml(data.body).replace(/\n/g, "<br>")),
        paragraph(`It stays hidden until you approve it.`),
        button(`${site.url}/admin/reviews`, "Moderate reviews"),
      ].join(""),
    }),
  };
}
