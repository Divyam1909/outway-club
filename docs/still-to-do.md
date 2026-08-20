# Still to do

Everything known to be outstanding on **https://outway.club**. Open items
first, in the order of what it costs you to leave them undone. What has already
been settled is at the bottom, so this file can be read top-down and stopped at
any point.

**Last updated: 16 August 2026** — see the [change log](#change-log).

Nothing here is broken. `src/config/site.ts` omits anything unset rather than
printing a placeholder, so an unfilled value is invisible, not "TBD".

> ### Where these values go now
>
> Every `NEXT_PUBLIC_*` below is baked into the bundle at **build** time, so
> setting one means changing it wherever the build happens. Since 16 Aug 2026
> that is **two places**:
>
> 1. **Workers Builds → Settings → Variables**, as a *build* variable. This is
>    what a pushed commit uses, so this is the one that reaches production.
> 2. **`.env.local`** on this laptop, for `npm run dev` and any hand-built
>    deploy.
>
> Set both. They can drift silently, and a local build and a CI build of the
> same commit will happily produce different bundles.
>
> Then just `git push`. To ship by hand instead, run two separate commands,
> because `deploy` on its own re-uploads the last build:
>
> ```bash
> npm run cf:build
> npm run cf:deploy
> ```
>
> Do not confuse the two Cloudflare variable screens. **Build** variables are
> the ones above and they matter for `NEXT_PUBLIC_*`. The Worker's **runtime**
> variables are a different screen, they have no effect on a `NEXT_PUBLIC_`
> value, and `wrangler.jsonc` overwrites them on every deploy anyway. See
> [`infrastructure.md`](infrastructure.md).

---

# Open

> ### The Jawai relaunch — 20 Aug 2026
>
> Escape 001 is now **Jawai × Udaipur**, Delhi → Jawai → Udaipur → Delhi, two
> nights in Jawai and one full day in Udaipur, 4–8 September, ₹18,999 list and
> ₹16,999 with the departure code. Same trip row as before, so bookings and
> requests survived; the slug moved from `udaipur-jawai` and redirects.
> **Escape 002 (Jawai × Jodhpur)** is seeded and unpublished — admin console
> only. **Escape 003** is the old Mount Abu route, also unpublished.
>
> Three things are outstanding and none of them block the site:
>
> - [ ] **Photography.** `public/images/jawai/`, `jodhpur/` and `outway/` are
>       branded placeholder panels, not photographs. The shot list — one
>       detailed paragraph per image, ready to paste into an image model — is
>       in **`image.md`** at the repo root. Sixteen files. The Jawai set
>       matters most: it is the Escape 001 hero and the homepage hero.
> - [ ] **Escape 002 costing.** Its ₹18,999 is carried across from Escape 001
>       rather than quoted from a Jodhpur supplier, and it has no named stay
>       for the Jodhpur night. Both need doing before that checkbox is flicked.
> - [ ] **A trip captain.** `src/config/trip-captains.ts` is still an empty
>       array, so every trip page shows the explainer and no face. The brand
>       now rests on "you remember the people" harder than it did, which makes
>       an anonymous host a bigger gap than it was.

> ### ~~Four commits are on GitHub and none of them are live~~ — shipped 16 Aug
>
> Deployed by hand on 16 Aug, and GitHub is now connected to Cloudflare, so a
> push to `main` builds and deploys on its own. See
> [`infrastructure.md`](infrastructure.md#deploying-from-github--connected-16-aug-2026).
>
> All four are verified against the live site, not merely deployed:
>
> - **Sitemap `lastmod`** — `/about`, `/terms` and the other undated pages carry
>   no `lastmod`; `/trips` carries the real newest trip date rather than the time
>   of the last cache regeneration.
> - **Article images** — the Journal article serves
>   `/cdn-cgi/image/width=1344,quality=80,format=auto/…` rewrites, not the plain
>   `<img>` tags it served on 15 Aug.
> - **Images binding** — one of those rewritten URLs returns `200 image/jpeg`,
>   so the zone toggle is on and transformations really run. This is the failure
>   `wrangler.jsonc` warns about: the binding resolves at deploy time whether or
>   not the toggle is on, and only fails at request time.
> - **`OPS_EMAIL`** — the Worker reports `bookings@outway.club` in its bindings.
>
> Worth repeating: `cf:deploy` **does not build**. The first attempt on 16 Aug
> re-shipped the 15 Aug bundle, green and silent, and the fix only went live
> after running `cf:build` first. CI runs both in order, which is the real
> reason to keep using it.

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
| `NEXT_PUBLIC_UPI_QR` | `/images/upi-qr.png` — commit the image under `public/images/` — or a full https URL. Optional |
| `NEXT_PUBLIC_BANK_ACCOUNT_NAME` | Exact name on the account |
| `NEXT_PUBLIC_BANK_NAME` | e.g. `HDFC Bank, Udaipur` |
| `NEXT_PUBLIC_BANK_ACCOUNT_NUMBER` | Full number |
| `NEXT_PUBLIC_BANK_IFSC` | e.g. `HDFC0001234` |

UPI renders on its own, with the QR beside it when one is set. The bank block
is all-or-nothing — account name, bank name, account number and IFSC must all be
present or none of it shows.

Set them in **both** places or they will drift: `.env.local` for local builds,
and the build variables in Workers Builds for anything pushed to `main`. These
are `NEXT_PUBLIC_`, so they are baked in at build time — adding them to the
Worker's runtime variables does nothing.

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

## 4. Housekeeping

- [ ] **Delete the Vercel project** — not before **22 Aug 2026**. It is the
      rollback path and costs nothing to keep. See
      [`infrastructure.md`](infrastructure.md#rolling-back-to-vercel).
- [ ] **Back up `.env.local`** somewhere durable — a password manager, not
      another folder. Less urgent since 16 Aug, because Workers Builds now holds
      a second copy of the same 20 values, but that copy is not exportable and
      the two can drift. Still the only file with the *server* secrets in it.
- [ ] **Restart VS Code from a clean shell.** `NODE_TLS_REJECT_UNAUTHORIZED=0`
      and `NODE_ENV=production` are inherited from the running `Code.exe`. They
      are not in the registry, any shell profile, or VS Code settings, so a full
      quit and relaunch from the Start menu clears both. The first disables TLS
      certificate validation for every Node process; the second is what makes
      `npm install` silently skip Tailwind and TypeScript. **Still set as of 16
      Aug** — both re-measured in this session, and the TLS one is the reason
      every local build prints a `NODE_TLS_REJECT_UNAUTHORIZED` warning. CI is
      unaffected; it never sees either.
- [ ] **`outputFileTracingRoot` in `next.config.mjs` is now optional.** It was
      pinned because of the stray `C:\Users\divya\node_modules`, which has since
      been deleted. Harmless to keep and correct either way, so this is a
      tidy-up, not a fix.

## 5. Search

Google Search Console is verified by DNS TXT and the record survived the
nameserver move. The sitemap is live with 14 URLs and serves 200 as
`application/xml` in under a second, to Googlebot's user agent as well.

- [ ] **Sitemap says "Couldn't fetch"** — submitted 15 Aug, `Last read` blank,
      `Discovered pages 0`, type `Unknown`. Not a fault to chase: on 16 Aug a
      **Live Test** in URL Inspection returned *URL is available to Google /
      Page can be indexed*, and the endpoint answers 200 `application/xml` to
      Googlebot's user agent, unredirected and unblocked. The report is a stale
      record of one failed read at submission time. Resubmit from **Sitemaps**
      and leave it; do not use *Request indexing*, which is for pages and does
      nothing for a sitemap. If it is still `Couldn't fetch` after 48h, remove
      the entry and re-add it.
- [ ] Request indexing for `/trips/jawai-udaipur`, `/destinations/jawai`,
      `/blog/udaipur-travel-guide`, `/destinations/udaipur`, `/trips` and
      `/blog`. Only `/` is indexed so far and the quota is about ten URLs a day.
      `/trips/udaipur-jawai` now 301s to `/trips/jawai-udaipur`, so anything
      already indexed under the old slug will follow on its own.
- [ ] Bing Webmaster Tools — can import the whole property from Search Console

`NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` and `NEXT_PUBLIC_BING_SITE_VERIFICATION`
are deliberately blank: verification is done at DNS instead, which survives
redeploys and covers every subdomain. Leave them blank on purpose.

## 6. Longer-lived

- [ ] **DMARC** is at `p=none`. Move to `p=quarantine` around **29 Aug 2026**,
      once the reports at `divyam@outway.club` come back clean:
      `v=DMARC1; p=quarantine; rua=mailto:divyam@outway.club; fo=1; pct=100`.
      This is also the precondition for the Gmail sender avatar — see
      [`supabase-auth-emails.md`](supabase-auth-emails.md#about-the-logo).
- [ ] **`npm audit`** — 4 high-severity advisories in `sharp` via libvips. The
      fix is `next@16`, a breaking upgrade. Post-launch work.
- [ ] **`NEXT_PUBLIC_YOUTUBE_URL`** — blank hides the footer link and drops it
      from `sameAs` in structured data. Set it when there is a channel.
- [ ] **Payments.** When checkout is switched back on, `site.paymentsEnabled`
      flips to `true`, the Razorpay webhook needs pointing at
      `https://outway.club/api/razorpay/webhook`, and **the webhook must be
      re-tested on Workers** before it is trusted — see
      [`infrastructure.md`](infrastructure.md#things-that-differ-from-vercel).
- [ ] **Per-worker test data isolation**, so the Playwright suite can run in
      parallel again. Every spec shares one Supabase database and most of them
      mutate it — roles, posts, promo codes, seats — so concurrent workers read
      each other's writes. On 20 Aug 2026 that produced a phantom React
      hydration mismatch on the admin console minutes after the real one had
      been fixed, which cost more time than the parallelism saves.

      `playwright.config.ts` is now `workers: 1` by default for that reason
      (`PW_WORKERS=4` opts back in, and is safe for the read-only specs). To
      get parallelism back properly, each worker needs its own data: prefix
      every fixture the suite creates with `process.env.TEST_WORKER_INDEX` and
      scope the reads to it, or give each worker its own Supabase schema. Not
      urgent — CI was always serial, so nothing that gates a merge changed.

## 7. Test data still in the database

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
  its password is in [section 7](#7-test-data-still-in-the-database) above, in a
  committed repo, so **anyone with repo access has admin on production**. If the repo is ever shared or made
  public, change that password first. To undo:
  `node scripts/make-admin.mjs demote demoaccdn02@gmail.com`
- **Cloudflare Web Analytics is allowed through the CSP** rather than switched
  off — you had no analytics at all, and this one is free and needs no consent
  banner. Two hosts in `next.config.mjs`: `static.cloudflareinsights.com` in
  `script-src`, `cloudflareinsights.com` in `connect-src`.
- **BIMI is not worth chasing yet.** The grey circle beside the sender name in
  Gmail is not a template setting; it needs DMARC at `p=quarantine` **and** a
  paid Verified Mark Certificate requiring a registered trademark.
- **Ops alerts go to `bookings@outway.club`.** Set in
  [`wrangler.jsonc`](../wrangler.jsonc), which is the only place that counts —
  `OPS_EMAIL` is read at request time on the Worker, so `.env.local` changes it
  for local dev only. `bookings@` and `hello@` are aliases onto one mailbox, so
  this decides what the alert is addressed to, not where it arrives; the value
  is that ops mail stays filterable. `EMAIL_FROM` deliberately stays
  `hello@outway.club` — that is the *sender*, it is what Resend has verified,
  and three templates ask the reader to reply to it.
- **Cloudflare's managed `robots.txt` stays enabled.** It blocks *training*
  crawlers (`GPTBot`, `ClaudeBot`, `Google-Extended`, `CCBot`, `Bytespider`,
  `Amazonbot`, `Applebot-Extended`, `meta-externalagent`) and leaves every
  crawler that sends traffic alone — `Googlebot`, `Bingbot`, `OAI-SearchBot`,
  `Claude-SearchBot`, `PerplexityBot`, `Applebot`. So AI assistants can still
  find and cite the site; only harvesting into training sets is refused, and
  nothing there was going to send a visitor. Note `Google-Extended` does **not**
  affect AI Overviews, which run off `Googlebot`.
  - The served file therefore carries two `User-agent: *` groups, Cloudflare's
    ahead of the one `src/app/robots.ts` emits. Same-agent groups are merged
    per RFC 9309, so the `/admin`, `/account` and `/booking/` disallows still
    apply — confirmed against the live file.
- **The "re-upload the hero and gallery" task was retired, not done.** It had no
  target and would have made things worse. Every image path in the database is a
  static `/images/…` file in this repo — all 16 checked on 15 Aug — and nothing
  has ever been uploaded to Supabase Storage. The admin editor uploads *to*
  Supabase Storage, so doing it would have moved files off Cloudflare's `ASSETS`
  binding onto a remote host that then needs whitelisting in the zone's Images
  sources. Its premise is also gone: Workers optimizes images now. And no file
  needed shrinking — the largest is 692KB against a 1.5MB house limit.

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
- **Baked-in config** — `NEXT_PUBLIC_SITE_URL`, `EMAIL_FROM`, Instagram, legal
  name and business city all correct in the deployed bundle, and no stray
  Razorpay test key. (`OPS_EMAIL` was verified too, then changed to `bookings@`
  — which shipped on 16 Aug and is confirmed in the Worker's bindings.)
- **Google Search Console** domain-property verification, and `https://outway.club/`
  reporting **URL is on Google / Page is indexed**.
- **DNSSEC is live.** The DS record reached the `.club` registry and Cloudflare
  reports the zone protected. This is now done, not pending.
- **Always Use HTTPS is on.** It had never actually been enabled, despite
  `infrastructure.md` saying so — port 80 was answering 200 with no redirect.
  Toggled on and re-checked on 15 Aug: `http://outway.club/` 301s to HTTPS, and
  `http://www.outway.club/…` reaches the HTTPS apex in a **single hop** rather
  than chaining through `https://www`. HSTS was already set but only ever
  protected repeat browser visitors, never a crawler's first request.
- **Cloudflare image transformations work**, measured on the live site against
  `escape-001/hero.jpg` (427KB original): `/cdn-cgi/image/width=640` returned
  37KB, and `/_next/image?…&w=828` returned **29KB of AVIF**. That is the zone
  toggle doing the work — it is a Cloudflare feature, not something this repo's
  build has to ship, which is why it started working before the deploy that was
  then still pending.

## Verified 16 August 2026

- **Workers Builds is connected and actually works.** Build `#2cc63f01` on
  commit `a2a7626` went from push to a live version in 2m 9s, ran a real
  `next build`, and produced version `5b869ca5`. Full breakdown in
  [`infrastructure.md`](infrastructure.md#first-build-verified-end-to-end).
- **The build variables reach the build.** All three `generateStaticParams`
  routes prerendered in CI, which is only possible if the Supabase URL and anon
  key arrived. Worth knowing the failure shape: a missing key builds **green**
  and simply omits those routes.
- **The four undeployed commits are live and checked on the site**, not just
  deployed — see the box at the top of this file.
- **The stray `C:\Users\divya\node_modules` is gone**, along with its npm
  2.15.12. `npm run cf:build` and `npm run cf:deploy` both run clean now, so the
  direct-node-invocation workaround in [`infrastructure.md`](infrastructure.md)
  is history rather than instruction.
- **Google can fetch the sitemap.** Live Test in URL Inspection: *URL is
  available to Google*. The `Couldn't fetch` in the Sitemaps report is stale.
- **`NODE_ENV=production` and `NODE_TLS_REJECT_UNAUTHORIZED=0` are still set**
  in the VS Code environment. Re-measured, still open, still §4.

---

## Change log

**16 Aug 2026**
- The four undeployed commits shipped, and each fix was checked against the live
  site rather than assumed from a green deploy.
- **GitHub connected to Cloudflare** via Workers Builds, verified end to end.
  The §4 housekeeping item for it is done and gone.
- Rewrote "Where these values go now": `NEXT_PUBLIC_*` now has **two** homes,
  Workers Builds build variables and `.env.local`, and they can drift.
- Sitemap "Couldn't fetch" downgraded from a task to a note — Google's own Live
  Test says the URL is available, so there is nothing to fix in code.
- Corrected: the demo-admin password was said to be in "section 8", which does
  not exist. It is in §7.
- Recorded as fixed: the stray home-folder npm 2.15.12. Recorded as still open,
  having been re-measured today: the two inherited VS Code environment
  variables.

**15 Aug 2026**
- Site moved from Vercel to Cloudflare Workers; DNS moved from Porkbun to
  Cloudflare. Replaced `production-setup.md` and `cloudflare-deploy.md` with
  [`infrastructure.md`](infrastructure.md).
- This file replaced `IMPORTANT.md` and was reordered so open items lead.
- Added: the VS Code environment variables (§4), and — later the same day — the
  undeployed-commits warning at the top and the sitemap's "Couldn't fetch"
  state (§5).
- Resolved: Cloudflare Web Analytics CSP, the demo-admin decision, the whole
  mail-delivery verification chain, DNSSEC, Always Use HTTPS, the ops-email
  question (now `bookings@`), the managed `robots.txt` decision (keep it), and
  Cloudflare image optimization.
- Retired: the "re-upload the hero and gallery" task, which had no target — see
  Settled. Sections renumbered after it and the ops-email section were removed.
- Corrected: Resend's MX region is `ap-northeast-1`, not `ap-south-1` as the old
  docs claimed. Always Use HTTPS was **off** while the docs said it was on —
  since fixed, but worth remembering that table recorded intentions rather than
  measurements.
