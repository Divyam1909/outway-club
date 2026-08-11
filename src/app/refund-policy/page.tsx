import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { site, REFUND_TIERS } from "@/config/site";

export const metadata: Metadata = {
  title: "Cancellation & Refund Policy",
  description:
    "Outway Club's cancellation windows, refund percentages, processing times and the exact steps to cancel a booking.",
  alternates: { canonical: "/refund-policy" },
};

export default function RefundPolicyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Cancellation &amp; Refund Policy"
      intro="Plans change. Here is exactly what you get back and when, with no interpretation required. These same percentages are what our system applies automatically when you cancel: the page and the code read from one shared source."
      lastUpdated="6 August 2026"
    >
      <LegalSection id="tiers" title="1. If you cancel">
        <p>
          The refund you receive depends on how many days before the departure date we receive your
          cancellation. All percentages are calculated on the total amount you actually paid us.
        </p>

        <div className="not-prose my-7 overflow-x-auto rounded-2xl border border-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-cream-300 text-xs uppercase tracking-[0.18em] text-ink-500">
              <tr>
                <th scope="col" className="px-5 py-3.5 font-semibold">
                  When we receive your cancellation
                </th>
                <th scope="col" className="px-5 py-3.5 text-right font-semibold">
                  You get back
                </th>
              </tr>
            </thead>
            <tbody>
              {REFUND_TIERS.map((tier) => (
                <tr key={tier.label} className="border-b border-border last:border-0">
                  <td className="px-5 py-4 text-ink-700">{tier.label}</td>
                  <td className="px-5 py-4 text-right">
                    <span
                      className={
                        tier.refundPercent > 0
                          ? "heading-sm text-lg text-pine"
                          : "heading-sm text-lg text-ink-500"
                      }
                    >
                      {tier.refundPercent}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          The retained portion is not a penalty: it covers the hotel, transport and permit deposits
          we have already committed on your behalf, which suppliers do not return to us at short
          notice.
        </p>
        <p>
          <strong>No-shows.</strong> Failing to arrive at the stated reporting point without
          cancelling is treated as a cancellation on the day of departure, and no refund is due.
        </p>
      </LegalSection>

      <LegalSection id="how-to-cancel" title="2. How to cancel">
        <p>The fastest route is self-service, and it timestamps your request instantly:</p>
        <ol>
          <li>
            Sign in and open <Link href="/account">My bookings</Link>.
          </li>
          <li>Find the booking and choose &ldquo;Cancel booking&rdquo;.</li>
          <li>
            You&apos;ll see the exact refund amount before you confirm, based on today&apos;s date.
          </li>
          <li>Confirm. You&apos;ll get a cancellation email with the refund figure straight away.</li>
        </ol>
        <p>
          You can also email <a href={`mailto:${site.email}`}>{site.email}</a> from the address on
          your booking. The cancellation takes effect from the time your email reaches us, not from
          when we reply, so send it, and don&apos;t wait for us before your tier changes.
        </p>
      </LegalSection>

      <LegalSection id="processing" title="3. How and when the money comes back">
        <ul>
          <li>
            Refunds are initiated to the <strong>original payment method</strong> through Razorpay.
            We cannot refund to a different card, UPI ID or bank account.
          </li>
          <li>
            We initiate the refund within <strong>2 working days</strong> of the cancellation being
            confirmed.
          </li>
          <li>
            Your bank then takes a further <strong>5 to 7 working days</strong> to post it. That leg is
            outside our control.
          </li>
          <li>
            The credit usually appears against the original transaction on your statement rather than
            as a separate line. If you can&apos;t find it after 10 working days, email us with your
            booking reference and we will chase it with Razorpay.
          </li>
          <li>
            Payment gateway charges on the original transaction are absorbed by us, not deducted from
            your refund.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="we-cancel" title="4. If we cancel or significantly change a trip">
        <p>
          If we cancel a departure for any reason (including not reaching the minimum group size,
          which we will confirm no later than 15 days before departure) you choose between:
        </p>
        <ul>
          <li>
            A <strong>100% refund</strong> of everything you paid us, with no deduction whatsoever, or
          </li>
          <li>
            A <strong>transfer to another departure</strong>, with any price difference settled either
            way.
          </li>
        </ul>
        <p>
          The same choice applies if we make a significant change to a confirmed booking: a change of
          departure date, a reduction in the length of the trip, or a change of accommodation to a
          materially lower standard.
        </p>
        <p>
          Please note that our liability in this situation is limited to money you paid{" "}
          <em>us</em>. We cannot reimburse flights, trains or hotels you booked independently, which
          is why we recommend refundable tickets or travel insurance for the connecting legs.
        </p>
      </LegalSection>

      <LegalSection id="transfers" title="5. Transfers and name changes">
        <p>
          <strong>Moving to another date.</strong> If you ask 15 or more days before departure, we
          will move your booking to another departure of the same trip once, free of charge, subject
          to availability. Inside 15 days, the cancellation tiers above apply instead.
        </p>
        <p>
          <strong>Transferring your seat to someone else.</strong> Allowed up to 7 days before
          departure at no charge, provided the replacement traveller accepts our{" "}
          <Link href="/terms">Terms of Service</Link> and provides valid ID. Where a supplier charges
          us to make the change, that cost is passed to you at actual with the invoice shown.
        </p>
      </LegalSection>

      <LegalSection id="force-majeure" title="6. Events outside anyone's control">
        <p>
          Where a trip cannot run because of an event outside our reasonable control (extreme
          weather, natural disaster, epidemic, civil unrest, road closure or a government or
          administrative order) we will refund every amount we are able to recover from our
          suppliers, and will offer a credit note valid for 12 months for any portion that suppliers
          retain. We will show you exactly what was recovered and what was retained. We do not profit
          from a cancelled trip in any circumstance.
        </p>
      </LegalSection>

      <LegalSection id="unused" title="7. Unused services and mid-trip departure">
        <p>
          No refund is due for any part of a trip you choose not to use (a meal you skip, a night you
          spend elsewhere, an activity you sit out) or if you leave a trip early for personal
          reasons. Where you leave early on medical grounds, tell your trip captain, keep the
          documentation, and claim through your travel insurance.
        </p>
      </LegalSection>

      <LegalSection id="disputes" title="8. If you disagree with a refund decision">
        <p>
          Email <a href={`mailto:${site.email}`}>{site.email}</a> with your booking reference and what
          you think is wrong. We will give you a written answer within {site.responseTime}, and if we
          got it wrong we will fix it, including reopening a refund that has already been processed.
          Escalation routes are set out in our <Link href="/terms">Terms of Service</Link>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
