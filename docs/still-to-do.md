# Still to do

Everything known to be outstanding on **https://outway.club**, as of
**15 August 2026**, the day the site moved to Cloudflare. Nothing here is
broken — `src/config/site.ts` omits anything unset rather than printing a
placeholder — but each item is something a customer can't see, you can't be
reached by, or that will bite later.

Ordered by what it costs you to leave undone.

> ### Where these values go now
>
> **Not Vercel.** The site builds on this machine from `.env.local`, so every
> `NEXT_PUBLIC_*` value below is baked into the bundle at build time. Setting
> one means: edit `.env.local`, then **rebuild and redeploy** —
> `CF_BUILD=1 node node_modules/@opennextjs/cloudflare/dist/cli/index.js deploy`.
> Editing anything in the Cloudflare dashboard will not change a
> `NEXT_PUBLIC_` value, and `wrangler.jsonc` will overwrite dashboard edits on
> the next deploy anyway. See [`infrastructure.md`](infrastructure.md).

---

## 1. Nobody can pay you

Online checkout is off (`site.paymentsEnabled = false`), so the plan is UPI or
bank transfer arranged by hand. The site has a "Payment details" block built for
exactly that, and **it is currently hidden**, because it refuses to render on
partial data — a half-filled account number sends someone's money nowhere.

Confirmed still hidden on the live Cloudflare site on 15 Aug. A customer gets
all the way through the booking request and is shown no way to pay. They only
find out when you email them back.

Set **either** the UPI ID **or** all four bank fields. Both is better.

| Variable | Format |
|---|---|
| `NEXT_PUBLIC_UPI_ID` | `yourname@okhdfcbank` |
| `NEXT_PUBLIC_BANK_ACCOUNT_NAME` | Exact name on the account |
| `NEXT_PUBLIC_BANK_NAME` | e.g. `HDFC Bank, Udaipur` |
| `NEXT_PUBLIC_BANK_ACCOUNT_NUMBER` | Full number |
| `NEXT_PUBLIC_BANK_IFSC` | e.g. `HDFC0001234` |

UPI renders on its own. The bank block is all-or-nothing — account name, bank
name, account number and IFSC must all be present or none of it shows.

Shows on: trip page and booking page. Logic: `hasPaymentDetails()` in
`src/config/site.ts`.

---

## 2. Phone and WhatsApp — email is your only channel

| Variable | Format | What appears when set |
|---|---|---|
| `NEXT_PUBLIC_CONTACT_PHONE` | `+91 98765 43210` | Contact page, a `tel:` link, `telephone` in the `TravelAgency` structured data, and "or call …" in the booking acknowledgement email |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `919876543210` — digits only, country code, no `+` or spaces | WhatsApp buttons across the site |

Both blank. The acknowledgement email ends "In a hurry? Write to
hello@outway.club" with no phone option, and there is no WhatsApp button
anywhere — the channel most Indian travellers reach for first.

**Also required for Razorpay activation** when checkout comes back on.

---

## 3. Registered address and GSTIN

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_BUSINESS_ADDRESS` | Blank falls back to `NEXT_PUBLIC_BUSINESS_CITY`, which **is** set. So the site shows a city, not an address. |
| `NEXT_PUBLIC_GSTIN` | 15 characters. Blank means no GSTIN on legal pages or invoices. Only needed once registered. |

Shows on: contact page, terms, privacy, footer, structured data.
**Also required for Razorpay activation.**

---

## 4. Post-cutover housekeeping

Created by the move to Cloudflare on 15 Aug. None of it is urgent; all of it is
cheap.

- [ ] **DNSSEC is half-done.** Cloudflare has signed the zone and the DS record
      is entered at Porkbun, but it had not reached the `.club` registry as of
      15 Aug. Check with the command in
      [`infrastructure.md`](infrastructure.md#dnssec--pending). If it is still
      missing after a day, delete and re-create the record at Porkbun.
- [ ] **Demote the demo admin.** `demoaccdn02@gmail.com` was promoted to admin
      on 15 Aug so the cutover could be tested end to end. Its password is
      written down in this repo, which means anyone with repo access has admin
      on production. Undo it when you no longer need it:
      `node scripts/make-admin.mjs demote demoaccdn02@gmail.com`
- [ ] **Delete the Vercel project** — not before **22 Aug 2026**. It is the
      rollback path and it costs nothing to keep. See
      [`infrastructure.md`](infrastructure.md#rolling-back-to-vercel).
- [ ] **Remove the `workers.dev` redirect URL from Supabase** — Authentication →
      URL Configuration → Redirect URLs. Only needed while testing before the
      domain was pointed at the Worker.
- [ ] **Back up `.env.local`** somewhere durable. It is gitignored, and it is
      now the only copy of production's build-time configuration.
- [ ] **Decide on the Cloudflare beacon.** `static.cloudflareinsights.com` is
      injected into every page and blocked by the app's CSP, so Web Analytics
      collects nothing and every page logs a console error. Either add the host
      to `script-src` in `next.config.mjs` or turn the injection off in
      Cloudflare.
- [ ] **Decide on the managed `robots.txt`.** Cloudflare prepends a block
      disallowing `GPTBot`, `ClaudeBot`, `Google-Extended` and friends. Harmless
      for SEO — Googlebot is untouched — but it means the served file is no
      longer what `src/app/robots.ts` emits.
- [ ] **Connect GitHub to Cloudflare** (optional). Removes the local npm 2.15.12
      bug from the deploy path and stops production depending on one laptop's
      `.env.local`. Settings in [`infrastructure.md`](infrastructure.md).

---

## 5. Search

Google Search Console is verified by DNS TXT and the record survived the
nameserver move. The sitemap is live at `https://outway.club/sitemap.xml` with
14 URLs.

- [ ] Confirm the sitemap is submitted and reporting **Success**
- [ ] Request indexing for `/`, `/trips` and `/trips/udaipur-mount-abu`
- [ ] Bing Webmaster Tools — can import the whole property from Search Console

`NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` and `NEXT_PUBLIC_BING_SITE_VERIFICATION`
are deliberately blank: verification is done at DNS instead, which survives
redeploys and covers every subdomain. Leave them blank on purpose.

---

## 6. Longer-lived

- [ ] **DMARC** is at `p=none`. Move to `p=quarantine` about two weeks after
      launch, once the reports at `divyam@outway.club` come back clean. Full
      value: `v=DMARC1; p=quarantine; rua=mailto:divyam@outway.club; fo=1; pct=100`
- [ ] **`npm audit`** — 4 high-severity advisories in `sharp` via libvips. The
      fix is `next@16`, a breaking upgrade. Post-launch work.
- [ ] **Re-upload the homepage hero and the live trip's gallery** through the
      admin editor. Photos uploaded before browser-side downscaling landed are
      still full size, and Workers has no image optimizer to compensate. See
      [`infrastructure.md`](infrastructure.md#things-that-differ-from-vercel).
- [ ] **`NEXT_PUBLIC_YOUTUBE_URL`** — blank hides the footer link and drops it
      from `sameAs` in structured data. Set it when there is a channel.
- [ ] **Payments.** When checkout is switched back on, `site.paymentsEnabled`
      flips to `true`, the Razorpay webhook needs pointing at
      `https://outway.club/api/razorpay/webhook`, and **the webhook must be
      re-tested on Workers** before it is trusted — see
      [`infrastructure.md`](infrastructure.md#things-that-differ-from-vercel).

---

## 7. Test data still in the database

Left in place deliberately, and safe to remove whenever:

| What | Where |
|---|---|
| `Demo Traveller` trip request, 15 Aug 05:22 UTC | `/admin/requests` |
| `Demo Traveller` trip request, 15 Aug 11:16 UTC — notes begin `CLOUDFLARE CUTOVER TEST` | `/admin/requests` |
| `demoaccdn02@gmail.com` account, password `Udaipur-Monsoon-2026!` | Supabase Auth |

`scripts/cleanup-test-data.mjs` removes the Playwright-generated rows (fixed
`@example.com` addresses and `pw-test-%` slugs) but **not** these two requests —
they use a real Gmail address, so they have to go through `/admin/requests` by
hand.

---

## Done, for reference

Not to be re-litigated:

- Domain, DNS, and the full mail record set — apex and `www` on Cloudflare
  Workers with valid certificates, Zoho receiving, Resend sending, SPF, DKIM
  and DMARC all previously verified passing at Gmail.
- The D1 tag cache — verified on 15 Aug: an admin publish reaches `/trips` in
  under five seconds.
- Supabase SMTP, Site URL, `/auth/callback` redirect, and the six branded auth
  email templates ([`supabase-auth-emails.md`](supabase-auth-emails.md)).
- `NEXT_PUBLIC_SITE_URL`, `EMAIL_FROM`, `OPS_EMAIL`, Instagram, legal name and
  business city — all set and confirmed live in the deployed bundle.
- Google Search Console domain-property verification.
