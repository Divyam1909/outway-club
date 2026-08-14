import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What personal data Outway Club collects, why we collect it, who we share it with, and how to get it deleted.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      intro="This explains exactly what personal data we hold about you, why we hold it, who else sees it, and how to make us delete it. We collect the minimum needed to run a trip: nothing is sold, and there is no advertising tracking on this site."
      lastUpdated="6 August 2026"
    >
      <LegalSection id="controller" title="1. Who controls your data">
        <p>
          {site.legalName} is the data fiduciary (controller) for the personal data described here.
          {site.address ? ` Our registered address is ${site.address}.` : ""} For any privacy request,
          write to <a href={`mailto:${site.email}`}>{site.email}</a> with &ldquo;Privacy&rdquo; in the
          subject line.
        </p>
        <p>
          This policy is written to meet the Digital Personal Data Protection Act, 2023 (India) and,
          where it applies to travellers based in Europe, the GDPR.
        </p>
      </LegalSection>

      <LegalSection id="what-we-collect" title="2. What we collect">
        <h3>When you create an account</h3>
        <ul>
          <li>Your name and email address</li>
          <li>A password, stored only as a salted hash by our authentication provider: we never see it</li>
        </ul>

        <h3>When you send a booking request</h3>
        <ul>
          <li>Your name, email address and phone number, and how many of you are travelling</li>
          <li>The city you are travelling from, and whether you want us to book your flight or train</li>
          <li>
            Your answers to the short questionnaire about how you like to travel, including the age
            band you select. We use these only to place you in a group that suits you, and we do not
            publish them, sell them or share them with anyone outside Outway Club.
          </li>
          <li>Anything you choose to add in the two optional boxes at the end</li>
        </ul>

        <h3>When you make a booking</h3>
        <ul>
          <li>Full name, age and gender for each traveller on the booking</li>
          <li>Contact email and, where you provide it, a phone number</li>
          <li>Special requests you choose to tell us, which may include dietary or medical information</li>
          <li>Booking amount, Razorpay order and payment identifiers, and refund identifiers</li>
        </ul>
        <p>
          We do <strong>not</strong> receive or store your card number, CVV, UPI PIN or netbanking
          credentials. Those go directly from your browser to Razorpay.
        </p>

        <h3>When you contact us or subscribe</h3>
        <ul>
          <li>Name, email, optional phone number and the content of your message</li>
          <li>Your email address if you join the list for future escapes</li>
        </ul>

        <h3>When you submit a review</h3>
        <ul>
          <li>The display name you choose, your rating, review text and, optionally, a video link</li>
        </ul>

        <h3>Automatically</h3>
        <ul>
          <li>
            Your IP address, used solely to rate-limit our public forms and payment endpoint against
            abuse. These counters are keyed to your IP and pruned automatically.
          </li>
          <li>
            A session cookie so you stay signed in. It is strictly necessary for the site to work.
          </li>
        </ul>
        <p>
          There are no advertising cookies, no third-party analytics trackers and no cross-site
          profiling on this website.
        </p>
      </LegalSection>

      <LegalSection id="why" title="3. Why we hold it, and on what basis">
        <ul>
          <li>
            <strong>To deliver a trip you booked</strong>: performance of our contract with you.
            Traveller names go to hotels; group counts go to transport operators.
          </li>
          <li>
            <strong>To take payment and issue refunds</strong>: performance of contract, and legal
            obligation for tax records.
          </li>
          <li>
            <strong>To reply to enquiries and booking requests</strong>: your consent, given by
            writing to us or sending the request, and steps taken at your request before entering a
            contract.
          </li>
          <li>
            <strong>To email you about a future escape</strong>: your consent, given by subscribing.
            One click unsubscribes and we never add you without an action from you.
          </li>
          <li>
            <strong>To prevent spam and fraud on our forms and checkout</strong>: our legitimate
            interest in keeping the service usable and secure.
          </li>
          <li>
            <strong>To publish a review you submitted</strong>: your consent, revocable at any time.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="sharing" title="4. Who we share it with">
        <p>We share the minimum necessary with these categories of recipient, and no one else:</p>
        <ul>
          <li>
            <strong>Supabase</strong>: database, authentication and file storage. Your account and
            booking records live here.
          </li>
          <li>
            <strong>Razorpay</strong>: payment processing and refunds. Receives your name, email and
            payment instrument details directly.
          </li>
          <li>
            <strong>Resend</strong>: sends our transactional email. Receives your email address and
            the content of the message being sent.
          </li>
          <li>
            <strong>Vercel</strong>: hosts and serves this website.
          </li>
          <li>
            <strong>Trip suppliers</strong>: the specific hotels, transport operators and activity
            providers on your itinerary receive the traveller names and, where relevant, the dietary
            or accessibility information you gave us.
          </li>
          <li>
            <strong>Authorities</strong>: where we are legally required to disclose, for example
            hotel ID records mandated under Indian law.
          </li>
        </ul>
        <p>
          We do not sell personal data, we do not rent mailing lists, and we do not share your data
          with advertisers.
        </p>
      </LegalSection>

      <LegalSection id="retention" title="5. How long we keep it">
        <ul>
          <li>
            <strong>Booking and payment records</strong>: 8 years from the end of the financial
            year, as required by Indian tax and accounting law.
          </li>
          <li>
            <strong>Account data</strong>: until you ask us to delete the account.
          </li>
          <li>
            <strong>Enquiries</strong>: 24 months from your last contact with us.
          </li>
          <li>
            <strong>Marketing subscriptions</strong>: until you unsubscribe.
          </li>
          <li>
            <strong>Rate-limit records</strong>: automatically deleted after 24 hours.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="rights" title="6. Your rights">
        <p>You can, at any time and free of charge:</p>
        <ul>
          <li>Ask for a copy of the personal data we hold about you</li>
          <li>Ask us to correct anything inaccurate</li>
          <li>Ask us to delete your data, subject to records we must keep by law</li>
          <li>Withdraw consent for marketing email, or ask us to unpublish a review you submitted</li>
          <li>Ask us to restrict or object to a particular use of your data</li>
          <li>Nominate someone to exercise these rights on your behalf if you are unable to</li>
        </ul>
        <p>
          Email <a href={`mailto:${site.email}`}>{site.email}</a> and we will respond within 30 days.
          If you are not satisfied with our response you have the right to complain to the Data
          Protection Board of India.
        </p>
      </LegalSection>

      <LegalSection id="security" title="7. How we protect it">
        <p>
          All traffic to this site is encrypted in transit over HTTPS. Database access is governed by
          row-level security policies, so one traveller cannot read another&apos;s booking even if
          they hold a valid session. Administrative access is limited to named accounts with an
          explicit admin role. Passwords are hashed, never stored in readable form, and payment
          credentials never touch our servers.
        </p>
        <p>
          No system is perfectly secure. If a breach occurs that is likely to affect you, we will
          notify you and the Data Protection Board without undue delay.
        </p>
      </LegalSection>

      <LegalSection id="children" title="8. Children">
        <p>
          This site is not directed at children and we do not knowingly create accounts for anyone
          under 18. Where a minor travels with us, their details are provided by the accompanying
          adult who made the booking, and we process them only to deliver the trip. If you believe a
          child has given us data directly, tell us and we will delete it.
        </p>
      </LegalSection>

      <LegalSection id="transfers" title="9. International transfers">
        <p>
          Our infrastructure providers may process data on servers outside India. Where that happens,
          transfers are made under the providers&apos; standard contractual clauses and equivalent
          safeguards. You can ask us for details of where your data is hosted.
        </p>
      </LegalSection>

      <LegalSection id="updates" title="10. Changes to this policy">
        <p>
          If we change how we use personal data in a material way, we will update this page and email
          account holders before the change takes effect. See also our{" "}
          <Link href="/terms">Terms of Service</Link> and{" "}
          <Link href="/refund-policy">Cancellation &amp; Refund Policy</Link>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
