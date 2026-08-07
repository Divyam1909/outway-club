import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms that govern bookings made with Outway Club — what we commit to, what we ask of you, and how liability works.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      intro="These terms govern your use of this website and any trip you book through it. We've written them in plain language rather than boilerplate, because you should be able to actually read them before you pay us."
      lastUpdated="6 August 2026"
    >
      <LegalSection id="who-we-are" title="1. Who we are">
        <p>
          This website is operated by {site.legalName} (&ldquo;{site.name}&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;), a
          travel experience operator based in India, organising small-group escapes within India.
          {site.address ? ` Our registered address is ${site.address}.` : ""}
          {site.gstin ? ` Our GSTIN is ${site.gstin}.` : ""}
        </p>
        <p>
          You can reach us at{" "}
          <a href={`mailto:${site.email}`}>{site.email}</a> for anything relating to these terms, a
          booking, or a complaint.
        </p>
      </LegalSection>

      <LegalSection id="acceptance" title="2. Accepting these terms">
        <p>
          By creating an account, submitting an enquiry, or completing a booking, you confirm that
          you have read and accepted these terms, our{" "}
          <Link href="/privacy">Privacy Policy</Link> and our{" "}
          <Link href="/refund-policy">Cancellation &amp; Refund Policy</Link>. If you do not agree
          with them, please do not book.
        </p>
        <p>
          You must be at least 18 years old to make a booking. Travellers under 18 are welcome on a
          trip but must be booked and accompanied by a responsible adult who is party to these terms.
        </p>
      </LegalSection>

      <LegalSection id="what-we-sell" title="3. What you are buying">
        <p>
          We sell a place on an organised group trip. Each trip page lists a full day-by-day
          itinerary, an explicit inclusions list and an explicit exclusions list. Those three lists
          are the definition of what you are buying — if something is not in the inclusions list, it
          is not included, regardless of what may be implied elsewhere on the site.
        </p>
        <p>
          Prices are quoted per person in Indian Rupees (INR) on a twin-sharing basis unless stated
          otherwise, and are inclusive of applicable Indian taxes. Prices are not guaranteed until a
          booking is confirmed and paid; we may correct a price that has been published in error and
          will offer you a full refund rather than hold you to a corrected price.
        </p>
      </LegalSection>

      <LegalSection id="booking" title="4. Booking and payment">
        <p>
          A booking is confirmed only when full payment has been received and you have received a
          booking confirmation email containing a booking reference. Until that point, a seat is not
          held for you and availability shown on the site is indicative.
        </p>
        <p>
          Payments are processed by Razorpay Software Private Limited. We do not receive, process or
          store your card, UPI or netbanking credentials at any point. Your payment is subject to
          Razorpay&apos;s own terms in addition to these.
        </p>
        <p>
          You are responsible for the accuracy of the traveller details you enter, including names as
          they appear on government photo ID. Corrections after booking may not always be possible
          and, where a supplier charges us for a change, that cost is passed to you at actual.
        </p>
      </LegalSection>

      <LegalSection id="service-delivery" title="5. Service delivery">
        <p>
          Bookings are delivered digitally and immediately: your booking confirmation and reference
          are emailed to the address on your account as soon as payment is verified, and the booking
          appears in your account on this site. There is no physical shipment associated with any
          purchase.
        </p>
        <p>
          Detailed joining instructions — reporting point, timings, your trip captain&apos;s contact
          number and final packing notes — are emailed separately in the days before departure.
        </p>
      </LegalSection>

      <LegalSection id="your-responsibilities" title="6. What we ask of you">
        <ul>
          <li>
            Carry original government photo identification. Indian hotels are legally required to
            record it at check-in, and we cannot accommodate a traveller who cannot produce it.
          </li>
          <li>
            Tell us in writing, before departure, about any medical condition, allergy, dietary
            requirement, mobility limitation or medication that could affect your participation or
            our duty of care.
          </li>
          <li>
            Arrive at the stated reporting point on time. We cannot delay a group departure for a
            late traveller, and no refund is due for a missed departure.
          </li>
          <li>
            Behave in a way that does not endanger, harass or materially disrupt other travellers,
            our staff, our suppliers or local communities.
          </li>
          <li>
            Follow the reasonable safety instructions of your trip captain and any activity
            operator.
          </li>
        </ul>
        <p>
          We may remove a traveller from a trip, without refund, where their conduct presents a
          genuine risk to the safety or wellbeing of others. This is a last resort and we will
          document the reasons.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="7. Changes to a trip">
        <p>
          Itineraries are planned in advance but delivered in the real world. Weather, road
          conditions, permit decisions, monument closures and supplier failures can all require a
          change on the ground. Where that happens, your trip captain will substitute an alternative
          of comparable standard and will tell you why.
        </p>
        <p>
          <strong>Minor changes</strong> — a reordered day, a substituted viewpoint, a different
          restaurant of similar standard — do not entitle you to a refund.
        </p>
        <p>
          <strong>Significant changes</strong> — a change of departure date, a reduction in trip
          length, or a change of accommodation to a materially lower standard — entitle you to
          choose between accepting the change, moving to another departure, or cancelling with a full
          refund of what you paid us.
        </p>
        <p>
          <strong>Cancellation by us.</strong> If we cancel a departure for any reason, including not
          reaching the minimum group size, we will tell you as early as we can and you will receive
          either a full refund of all money paid to us, or a transfer to another departure with any
          price difference settled either way. Our liability in this situation is limited to that
          refund; we are not able to reimburse flights, trains or other arrangements you made
          independently, which is why we recommend refundable tickets or travel insurance.
        </p>
      </LegalSection>

      <LegalSection id="cancellation" title="8. Cancellation by you">
        <p>
          Cancellation terms, refund tiers and the process for requesting a cancellation are set out
          in full in our <Link href="/refund-policy">Cancellation &amp; Refund Policy</Link>, which
          forms part of these terms.
        </p>
      </LegalSection>

      <LegalSection id="risk" title="9. Assumption of risk">
        <p>
          Travel involves risks that cannot be fully eliminated, including road travel, altitude,
          weather, water, wildlife and activities undertaken on your own initiative. By booking you
          acknowledge those risks and confirm that you are medically fit for the trip as described on
          its trip page.
        </p>
        <p>
          Travel and medical insurance is <strong>not</strong> included in any trip price and is
          strongly recommended. Where a trip page states insurance is mandatory, you must hold a
          valid policy for the duration of the trip.
        </p>
      </LegalSection>

      <LegalSection id="liability" title="10. Liability">
        <p>
          We accept responsibility for the parts of your trip that we directly control, and for
          selecting our suppliers with reasonable care. We are not liable for loss, injury, delay or
          expense caused by circumstances outside our reasonable control, including but not limited
          to acts of God, extreme weather, natural disaster, epidemic, war, civil unrest, terrorism,
          strike, government or administrative action, road closure, or the acts of third parties not
          under our control.
        </p>
        <p>
          Where we are found liable, our total liability to you in respect of any booking is limited
          to the total amount you paid us for that booking. Nothing in these terms limits liability
          for death or personal injury caused by our negligence, or for fraud, where such limitation
          is not permitted by Indian law.
        </p>
        <p>
          You are responsible for your own belongings throughout the trip. We do not insure, and are
          not liable for, personal property that is lost, damaged or stolen.
        </p>
      </LegalSection>

      <LegalSection id="accounts" title="11. Your account">
        <p>
          You are responsible for keeping your account password confidential and for activity that
          takes place under your account. Tell us immediately if you believe your account has been
          accessed by someone else. You may close your account at any time by writing to{" "}
          <a href={`mailto:${site.email}`}>{site.email}</a>; we will retain booking records for as
          long as Indian tax and accounting law requires.
        </p>
      </LegalSection>

      <LegalSection id="content" title="12. Content and intellectual property">
        <p>
          All text, photography, itineraries, branding and design on this site belong to us or are
          used with permission, and may not be reproduced commercially without written consent.
        </p>
        <p>
          If you submit a review, photograph or video testimonial to us, you grant us a
          non-exclusive, royalty-free licence to display it on this site and in our marketing, with
          attribution to the first name and last initial you supply. You confirm that you own the
          content and that anyone identifiable in it has agreed to it being published. You can ask us
          to remove your content at any time by emailing us, and we will do so promptly.
        </p>
        <p>
          We moderate reviews for authenticity and abuse only. We do not remove a review because it
          is critical, and we never publish a review that did not come from a real traveller on a
          real booking.
        </p>
      </LegalSection>

      <LegalSection id="governing-law" title="13. Governing law and disputes">
        <p>
          These terms are governed by the laws of India. Any dispute arising out of them or out of a
          booking is subject to the exclusive jurisdiction of the courts at{" "}
          {site.city.split(",")[0]?.trim() || "Udaipur"}, Rajasthan.
        </p>
        <p>
          Before going to court, please write to us. Most problems are solved faster and better by
          email than by litigation, and we would genuinely rather fix something than argue about it.
        </p>
      </LegalSection>

      <LegalSection id="changes-to-terms" title="14. Changes to these terms">
        <p>
          We may update these terms from time to time. The version that applies to your booking is
          the version published on the date your booking was confirmed, and we will keep that version
          available on request. Material changes will be notified by email to account holders.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
