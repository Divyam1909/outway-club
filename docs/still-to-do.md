# Still to do

Everything known to be outstanding on **https://outway.club**. Open items
first, in the order of what it costs you to leave them undone. What has already
been settled is at the bottom, so this file can be read top-down and stopped at
any point.

**Last updated: 15 August 2026** — see the [change log](#change-log).

Nothing here is broken. `src/config/site.ts` omits anything unset rather than
printing a placeholder, so an unfilled value is invisible, not "TBD".

> ### Where these values go now
>
> **Not Vercel.** The site builds on this machine from `.env.local`, so every
> `NEXT_PUBLIC_*` value below is baked into the bundle at build time. Setting
> one means: edit `.env.local`, then **build and deploy** — and those are two
> separate commands, because `deploy` on its own re-uploads the last build:
>
> ```bash
> CF_BUILD=1 node node_modules/@opennextjs/cloudflare/dist/cli/index.js build
> CF_BUILD=1 node node_modules/@opennextjs/cloudflare/dist/cli/index.js deploy
> ```
>
> Editing anything in the Cloudflare dashboard will not change a
> `NEXT_PUBLIC_` value, and `wrangler.jsonc` overwrites dashboard edits on the
> next deploy anyway. See [`infrastructure.md`](infrastructure.md).

---

# Open

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

## 2. Phone and WhatsApp — email is your only channel

| Variable | Format | What appears when set |
|---|---|---|
| `NEXT_PUBLIC_CONTACT_PHONE` | `+91 98765 43210` | Contact page, a `tel:` link, `telephone` in the `TravelAgency` structured data, and "or call …" in the booking acknowledgement email |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `919876543210` — digits only, country code, no `+` or spaces | WhatsApp buttons across the site |

Both blank. The acknowledgement email ends "In a hurry? Write to
hello@outway.club" with no phone option, and there is no WhatsApp button
anywhere — the channel most Indian travellers reach for first.

**Also required for Razorpay activation** when checkout comes back on.

## 3. Registered address and GSTIN

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_BUSINESS_ADDRESS` | Blank falls back to `NEXT_PUBLIC_BUSINESS_CITY`, which **is** set. So the site shows a city, not an address. |
| `NEXT_PUBLIC_GSTIN` | 15 characters. Blank means no GSTIN on legal pages or invoices. Only needed once registered. |

Shows on: contact page, terms, privacy, footer, structured data.
**Also required for Razorpay activation.**

## 4. Where should ops alerts land?

`OPS_EMAIL` is `hello@outway.club` in `wrangler.jsonc`; on Vercel it was
`bookings@outway.club`. The migration moved booking alerts into the general
inbox — which is the exact thing a separate `bookings@` mailbox existed to
prevent, an operational alert getting lost under a general question.

Visible in the Resend log: the 15 Aug 05:22 alert went to `bookings@`, the 11:16
one to `hello@`. Both mailboxes exist and both deliver. Pick one deliberately
and set it in [`wrangler.jsonc`](../wrangler.jsonc), not the dashboard.

## 5. Housekeeping

- [ ] **DNSSEC is half-done.** Cloudflare has signed the zone and the DS record
      is entered at Porkbun, but it had not reached the `.club` registry as of
      15 Aug. Check with the command in
      [`infrastructure.md`](infrastructure.md#dnssec--pending). If it is still
      missing after a day, delete and re-create the record at Porkbun.
- [ ] **Delete the Vercel project** — not before **22 Aug 2026**. It is the
      rollback path and costs nothing to keep. See
      [`infrastructure.md`](infrastructure.md#rolling-back-to-vercel).
- [ ] **Back up `.env.local`** somewhere durable. It is gitignored, and it is
      now the only copy of production's build-time configuration.
- [ ] **Restart VS Code from a clean shell.** `NODE_TLS_REJECT_UNAUTHORIZED=0`
      and `NODE_ENV=production` are inherited from the running `Code.exe`. They
      are not in the registry, any shell profile, or VS Code settings, so a full
      quit and relaunch from the Start menu clears both. The first disables TLS
      certificate validation for every Node process; the second is what makes
      `npm install` silently skip Tailwind and TypeScript.
- [ ] **Decide on the managed `robots.txt`.** Cloudflare prepends a block
      disallowing `GPTBot`, `ClaudeBot`, `Google-Extended` and friends. Harmless
      for SEO — Googlebot is untouched — but the served file is no longer what
      `src/app/robots.ts` emits.
- [ ] **Connect GitHub to Cloudflare** (optional). Removes the local npm 2.15.12
      bug from the deploy path and stops production depending on one laptop's
      `.env.local`. Settings in [`infrastructure.md`](infrastructure.md).

## 6. Search

Google Search Console is verified by DNS TXT and the record survived the
nameserver move. The sitemap is live with 14 URLs.

- [ ] Confirm the sitemap is submitted and reporting **Success**
- [ ] Request indexing for `/`, `/trips` and `/trips/udaipur-mount-abu`
- [ ] Bing Webmaster Tools — can import the whole property from Search Console

`NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` and `NEXT_PUBLIC_BING_SITE_VERIFICATION`
are deliberately blank: verification is done at DNS instead, which survives
redeploys and covers every subdomain. Leave them blank on purpose.

## 7. Longer-lived

- [ ] **DMARC** is at `p=none`. Move to `p=quarantine` around **29 Aug 2026**,
      once the reports at `divyam@outway.club` come back clean:
      `v=DMARC1; p=quarantine; rua=mailto:divyam@outway.club; fo=1; pct=100`.
      This is also the precondition for the Gmail sender avatar — see
      [`supabase-auth-emails.md`](supabase-auth-emails.md#about-the-logo).
- [ ] **`npm audit`** — 4 high-severity advisories in `sharp` via libvips. The
      fix is `next@16`, a breaking upgrade. Post-launch work.
- [ ] **Re-upload the homepage hero and the live trip's gallery** through the
      admin editor. Photos uploaded before browser-side downscaling landed are
      still full size, and Workers has no image optimizer to compensate.
- [ ] **`NEXT_PUBLIC_YOUTUBE_URL`** — blank hides the footer link and drops it
      from `sameAs` in structured data. Set it when there is a channel.
- [ ] **Payments.** When checkout is switched back on, `site.paymentsEnabled`
      flips to `true`, the Razorpay webhook needs pointing at
      `https://outway.club/api/razorpay/webhook`, and **the webhook must be
      re-tested on Workers** before it is trusted — see
      [`infrastructure.md`](infrastructure.md#things-that-differ-from-vercel).

## 8. Test data still in the database

Left in place deliberately, safe to remove whenever:

| What | Where |
|---|---|
| `Demo Traveller` trip request, 15 Aug 05:22 UTC | `/admin/requests` |
| `Demo Traveller` trip request, 15 Aug 11:16 UTC — notes begin `CLOUDFLARE CUTOVER TEST` | `/admin/requests` |
| `demoaccdn02@gmail.com` account, password `Udaipur-Monsoon-2026!` | Supabase Auth |

`scripts/cleanup-test-data.mjs` removes the Playwright-generated rows (fixed
`@example.com` addresses and `pw-test-%` slugs) but **not** these two requests —
they use a real Gmail address, so they go through `/admin/requests` by hand.

---

# Settled

Decisions taken and things verified. Not to be re-litigated.

## Decided 15 August 2026

- **`demoaccdn02@gmail.com` stays an admin.** Promoted so the cutover could be
  tested end to end, and deliberately left that way. Be aware what it means:
  its password is in section 8 above, in a committed repo, so **anyone with
  repo access has admin on production**. If the repo is ever shared or made
  public, change that password first. To undo:
  `node scripts/make-admin.mjs demote demoaccdn02@gmail.com`
- **Cloudflare Web Analytics is allowed through the CSP** rather than switched
  off — you had no analytics at all, and this one is free and needs no consent
  banner. Two hosts in `next.config.mjs`: `static.cloudflareinsights.com` in
  `script-src`, `cloudflareinsights.com` in `connect-src`.
- **BIMI is not worth chasing yet.** The grey circle beside the sender name in
  Gmail is not a template setting; it needs DMARC at `p=quarantine` **and** a
  paid Verified Mark Certificate requiring a registered trademark.

## Verified 15 August 2026

- **Hosting** — apex and `www` on Cloudflare Workers, valid certificates, `www`
  301s to the apex, sitemap on the apex domain with 14 URLs.
- **DNS** — all thirteen records survived the nameserver move intact.
- **The D1 tag cache** — unpublishing the live trip removed it from `/`,
  `/trips`, `/destinations` and `/sitemap.xml` in under five seconds, and
  republishing restored it just as fast.
- **Admin on Workers** — sign-in, trip edit, save and list views all work.
- **Outbound mail, both paths** — a booking request produced an ack to the
  customer and an ops alert to the mailbox, and a password reset went out via
  Supabase SMTP. All Delivered in Resend, all in the Gmail inbox rather than
  spam, all three of **SPF, DKIM and DMARC PASS** on both, logo rendering, and
  the reset link resolving to `outway.club` rather than `localhost:3000`.
- **Supabase** — Site URL, the single `/auth/callback` redirect, SMTP through
  Resend, and the six branded templates.
- **Baked-in config** — `NEXT_PUBLIC_SITE_URL`, `EMAIL_FROM`, `OPS_EMAIL`,
  Instagram, legal name and business city all correct in the deployed bundle,
  and no stray Razorpay test key.
- **Google Search Console** domain-property verification.

---

## Change log

**15 Aug 2026**
- Site moved from Vercel to Cloudflare Workers; DNS moved from Porkbun to
  Cloudflare. Replaced `production-setup.md` and `cloudflare-deploy.md` with
  [`infrastructure.md`](infrastructure.md).
- This file replaced `IMPORTANT.md` and was reordered so open items lead.
- Added: the ops-email question (§4), DNSSEC (§5), the VS Code environment
  variables (§5), the `robots.txt` decision (§5).
- Resolved: Cloudflare Web Analytics CSP, the demo-admin decision, and the
  whole mail-delivery verification chain.
- Corrected: Resend's MX region is `ap-northeast-1`, not `ap-south-1` as the
  old docs claimed.
