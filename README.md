# Outway Club

Small-group travel, one escape at a time. Currently running **Escape 001 —
Udaipur × Mount Abu, 15–18 August**.

Next.js 15 (App Router) · Supabase (Postgres, Auth, Storage) · Razorpay ·
Resend · Tailwind.

---

## Running it locally

```bash
npm install
cp .env.example .env.local     # then fill it in — see below
npm run dev
```

Without Supabase credentials the app boots into a setup screen rather than
crashing. Razorpay and Resend are optional locally: checkout shows "payments
aren't switched on yet" and emails log a warning instead of sending.

> **Note:** if your shell has `NODE_ENV=production` set, `npm install` silently
> skips devDependencies (including Tailwind and TypeScript) and the build fails
> with `Cannot find module 'tailwindcss'`. Use `npm install --include=dev`.

## Database

Six SQL files, run in order. All are safe to re-run.

| File | What it does |
|---|---|
| `supabase/migrations/0001_init.sql` | Core schema, RLS policies, triggers |
| `supabase/migrations/0002_launch.sql` | Review moderation + video, computed ratings, cancellation/refund columns, rate-limit counters, `profiles.email`, admin role guard, image storage bucket |
| `supabase/migrations/0003_blog.sql` | Journal posts and moderated reader comments, computed post ratings, view counter, editorial image bucket |
| `supabase/migrations/0004_catalogue.sql` | Edition numbers and spotlight ranking on trips |
| `supabase/migrations/0005_booking_integrity.sql` | One booking per Razorpay order, atomic seat allocation |
| `supabase/migrations/0006_trip_requests.sql` | `trip_requests`: the pre-booking questionnaire, one column per answer. **Required** — "Book now" writes here while payments are off |
| `supabase/seed.sql` | Escape 001 content. Deletes the pre-launch demo catalogue. **No seeded reviews** — those come from real travellers only. |
| `supabase/seed-blog.sql` | The Udaipur destination guide, the Journal's first post. Real editorial copy kept in version control rather than typed into the admin console, so a fresh environment comes up with the same article. Re-runnable: it upserts on `slug` and never overwrites the original `published_at`. |

Paste them into the Supabase SQL editor, or apply them from the command line:

```bash
npm i -g pg                 # operator-only dependency
npm run db:migrate
node scripts/db.mjs supabase/migrations/0003_blog.sql
node scripts/db.mjs supabase/migrations/0004_catalogue.sql
node scripts/db.mjs supabase/migrations/0005_booking_integrity.sql
node scripts/db.mjs supabase/migrations/0006_trip_requests.sql
npm run db:seed
node scripts/db.mjs supabase/seed-blog.sql
```

`scripts/db.mjs` probes Supabase's direct, session-pooler and
transaction-pooler endpoints and uses whichever answers, so it works from most
networks without you needing to know your project's region.

## Environment

Every variable is documented in `.env.example`. The ones that matter most:

- **Supabase** — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`. The service-role key bypasses RLS: server-only,
  never in a client component.
- **Razorpay** — `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`.
  Checkout is disabled with a clear message until these are real values, so a
  half-configured deploy can't take a payment it won't record.
- **Resend** — `RESEND_API_KEY`, `EMAIL_FROM`, `OPS_EMAIL`.
- **Business identity** — `NEXT_PUBLIC_CONTACT_PHONE`,
  `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_BUSINESS_ADDRESS` and friends.
  **Anything left blank is omitted from the site rather than rendered as a
  placeholder.** It all flows through `src/config/site.ts`.

## Deployment

The site is on **Vercel**, at **https://outway.club** (apex is canonical;
`www` 301-redirects to it). DNS is managed at **Porkbun**; mailboxes are
**Zoho Mail**; app-sent email is **Resend**.

Full step-by-step — DNS records, Zoho, Resend, Supabase, the env vars to set in
Vercel and the order to do it all in — is in
[`docs/production-setup.md`](docs/production-setup.md). Read that before
touching DNS.

## Production email

Three providers touch one domain, and they do **not** overlap:

| Path | Provider | What it carries |
|---|---|---|
| Mail *to* us | Zoho Mail | `hello@`, `bookings@` and friends — inboxes a person reads |
| Mail *from* the app | Resend | Booking receipts, cancellation confirmations, enquiry alerts, waitlist welcomes — `src/lib/email.ts` |
| Auth mail | Supabase → Resend SMTP | Signup confirmation, password reset |

> **Zoho's free plan has no SMTP access** — it can receive but it cannot send
> on the app's behalf. That is not a limitation to work around; it is the
> reason the split above exists. Resend does the sending, Zoho does the
> reading, and they coexist on one domain because Resend's MX record lands on
> `send.outway.club` rather than the root.

1. **Transactional email we send** — handled by `src/lib/email.ts` through the
   Resend API. Set `RESEND_API_KEY` and verify `outway.club` in Resend.
   `EMAIL_FROM` must stay a monitored mailbox: several templates say "reply to
   this email", so `noreply@` there would break that promise.

2. **Supabase Auth email** — signup confirmation and password reset. These are
   sent *by Supabase*, not by this app, and the built-in sender is rate-limited
   to a handful per hour and explicitly not meant for real users. Point
   Supabase at Resend:

   Supabase dashboard → **Project Settings → Authentication → SMTP Settings**

   | Field | Value |
   |---|---|
   | Host | `smtp.resend.com` |
   | Port | `465` |
   | Username | `resend` |
   | Password | your Resend API key |
   | Sender email | `noreply@outway.club` |

   Then set the **Site URL** to `https://outway.club` and add
   `https://outway.club/auth/callback` to **Redirect URLs**, or password-reset
   and confirmation links will bounce to localhost.

## The itinerary PDF

The customer-facing brochure is generated from the trip's own rows, not drawn
by hand:

```bash
npm run itinerary:pdf                            # the spotlight trip
npm run itinerary:pdf -- udaipur-mount-abu       # a specific slug
```

It reads `trips`, `itinerary_days` and the next `departure`, and writes
`docs/<slug>-itinerary.pdf` — cover, overview, one page per day, then
inclusions and packing list. **Re-run it after any change to a trip's dates,
price, itinerary or inclusions**, or the PDF you hand people starts quietly
contradicting the site. The only text in it that isn't from the database is the
"extending your stay" and per-day callout copy, kept at the top of
`scripts/build-itinerary-pdf.mjs`.

Printing uses Playwright's bundled Chromium, so it needs `npx playwright
install chromium` once, and a network connection the first time for the fonts.

## Brand assets

The master logo lives in `assets/brand/` — deliberately outside `public/`, so
the 1.5MB original is never served to a browser. Everything the site actually
serves is generated from it:

```bash
node scripts/build-brand-assets.mjs assets/brand/outway-logo.png
```

| Output | Used by |
|---|---|
| `public/brand/logo.png` | Navbar, footer, auth screens, `Organization` structured data |
| `public/brand/logo.jpg` | Opaque square, for anywhere alpha isn't supported |
| `public/brand/og-default.png` | 1200×630 social preview card |
| `src/app/icon.png` | Favicon (Next.js picks this up automatically) |
| `src/app/apple-icon.png` | iOS home screen, flattened because Apple can't use alpha |

The supplied artwork is a black circle on a near-white square. The script trims
that border away and bakes a circular alpha mask in, so the mark sits correctly
on cream, on pine, and on whatever background a social card puts behind it.
Replace the file in `assets/brand/` and re-run to change the logo everywhere.

## Photography

Every image path the site expects — trip, destination, Journal and brand — is
listed with a paragraph generation prompt in
[`docs/image-prompts.md`](docs/image-prompts.md), which also tracks which files
are real photos and which are still placeholders.

Branded placeholders ship at each path so nothing is ever broken. Drop real
photos over them using the same filenames, or upload through the admin trip
editor (Admin → Trips → edit → Content), which writes to Supabase Storage and
needs no redeploy. Regenerate the placeholders with:

```bash
node scripts/generate-placeholders.mjs
```

## Admin access

There is no separate admin login. An admin is an ordinary account — signed up
at `/signup` with an email and password like any customer — whose
`profiles.role` is `'admin'`. That one column is what `/admin` and every
`/api/admin/*` route check.

The first one has to be promoted from outside the app, because promoting
someone through `/admin/users` requires already being an admin:

```bash
npm run admin -- you@yourdomain.com     # promote (sign up first)
npm run admin                           # who's an admin right now
npm run admin -- demote them@you.com    # refuses to remove the last admin
```

Or do the same thing by hand in the Supabase SQL editor:

```sql
update profiles set role = 'admin' where email = 'you@yourdomain.com';
```

Sign out and back in afterwards — the role is read from the profile at request
time, but an open session's cached page won't show the admin nav until it
refetches.

After that it's all in the UI at **/admin/users** — no more SQL. The console
covers bookings (with a full per-booking detail page), trips, destinations, the
journal, users and roles, review moderation, enquiries and the waitlist.

Nothing operational requires opening the database:

| Section | What it manages |
|---|---|
| `/admin/trips` | Trips, itineraries, departures, photography |
| `/admin/destinations` | The places trips point at. Deleting one is blocked while trips still reference it, and the UI says so rather than showing a foreign-key error. |
| `/admin/blog` | Writing, publishing and unpublishing journal posts |
| `/admin/blog/comments` | Reader comments — nothing appears publicly until it's approved here |

Role changes are guarded at the database level: a signed-in customer cannot
escalate themselves even though RLS lets them update their own profile row, and
the API refuses to demote the last remaining admin.

## Testing

```bash
npx playwright install chromium         # once
npx playwright test tests/site.spec.ts  # public suite, desktop + mobile
```

The suite runs against a production build in Desktop Chrome and Pixel 7
viewports. It covers page rendering, console and network errors, horizontal
overflow, navigation, forms, rate limiting, honeypot filtering, access control,
structured data, redirects and accessibility basics.

For the admin console, which needs a real session:

```bash
node scripts/admin-test-user.mjs create
npx playwright test tests/admin.spec.ts tests/blog.spec.ts
node scripts/admin-test-user.mjs delete
node scripts/cleanup-test-data.mjs      # sweeps up anything a failed run left
```

`tests/blog.spec.ts` drives the whole journal: writing a post in the rich-text
editor, publishing it, reading it, commenting on it, moderating the comment and
deleting the post — plus the same round trip for a destination. It creates and
removes everything it touches, so it leaves the database as it found it.

`tests/screenshots.spec.ts` is a visual sweep rather than an assertion suite —
run it and look at `tests/__screens__/`.

## How a few things work

**Reviews.** There is no seeded review data anywhere in this project. The
review API only accepts a submission from an account with a paid, non-cancelled
booking on a departure that has already ended, and reviews land unapproved.
Trip ratings are recomputed by a database trigger from approved reviews — no
code path can type a rating in.

Two ways in, one rule: the link emailed after a trip
(`/trips/[slug]/review`), and the **Write a review** button on `/testimonials`,
which opens a dialog, asks `/api/reviews/eligible` which of your trips you can
review, and posts to the same endpoint. `eligible` is a convenience, not a
gate — `POST /api/reviews` re-derives eligibility from the booking table on
every submission, so nothing can be unlocked from the browser.

**Places we haven't launched.** `src/config/upcoming-destinations.ts` holds
somewhere-we-intend-to-run entries with no price, no dates and no booking path.
They fill the destination grid on `/` and the first row of `/trips` while the
catalogue is small, always marked "coming soon", always linking to
`/coming-soon?place=…` rather than a fake listing. They're config rather than
`destinations` rows on purpose: a row implies a real page, real photography and
a real trip behind it. The filler is suppressed the moment someone filters the
catalogue, because a placeholder can't honestly claim to match a month or a
budget. Delete the array and the sections just render fewer cards.

**Preloading.** Once a page has finished loading, `AssetPreloader` asks
`/api/preload-manifest` for the routes and photographs worth warming, prefetches
the routes and pulls each image through `next/image` with the same `sizes`
string the destination page uses — a different `sizes` warms a different width
and caches nothing useful. It waits for `load` and then an idle callback, skips
entirely on Save-Data or a 2g connection, skips the admin and checkout
sections, and the manifest is capped at 24 images server-side.

**The journal.** Posts are written by admins only; readers can only read and
comment. The editor is a `contentEditable` surface carrying the same
`.post-prose` styles the article page uses, so what a writer sees while typing
is what a reader gets — there is no separate preview to drift out of sync. Its
output is browser HTML, so it is rebuilt from a tag/attribute/class allowlist
server-side (`src/lib/sanitize-html.ts`) before it is stored, which is why posts
save through `/api/admin/blog/posts` instead of straight from the browser like
trips do: the sanitiser has to run somewhere the author can't skip.

**Comments.** No account needed — gating a comment on a blog post behind signup
just means nobody leaves one. Spam is handled the same way the contact form
handles it: a Postgres-backed rate limit, a CSS-hidden honeypot, a minimum fill
time, and moderation. Comments land unapproved and a post's star rating is
recomputed by a database trigger from approved comments only.

**Refunds.** `REFUND_TIERS` in `src/config/site.ts` is the single source of
truth. The table on `/refund-policy`, the figure shown in the cancellation
dialog, and the amount the API actually refunds all read from it, so they
cannot drift apart.

**Rate limiting.** Counters live in Postgres (`bump_rate_limit`), not in
memory, because serverless instances don't share memory. Public forms also
carry a CSS-hidden honeypot field and a minimum fill time. The limiter fails
open — a counter outage must never block a paying customer.

**Booking, while payments are off.** `site.paymentsEnabled` is `false`, and
that is the switch. "Book now" goes to `/booking/[slug]`, which renders the
compulsory pre-booking questionnaire
(`src/components/booking/trip-request-form.tsx`) instead of checkout: five short
steps covering the date, the headcount, which city they're travelling in from,
whether we should book their flight or train, and six questions about how they
travel. It writes a `trip_requests` row and emails ops — it does **not** create
a booking or move a seat count, because confirming one is a human step. No login
is required: there is no money involved, and a signup wall in front of an
enquiry only loses the enquiry. Ops read them at `/admin/requests`, grouped by
departure with the mix of answers summarised above each group.

The questions live in `src/config/trip-request.ts`, and every question id there
is a column in `trip_requests` — add one without adding the column and
submissions fail. The Razorpay checkout is parked, not deleted: render
`BookingPanel` from the booking page again and the old flow returns.

**How people actually pay.** `site.bank` (five `NEXT_PUBLIC_*` vars, see
`.env.example`) drives the "Payment details" block on the trip and booking
pages: UPI ID, bank account, and a screenshot on WhatsApp. It renders nothing
unless a UPI ID or a *complete* account is configured — a payment section with
half an account number is worse than none. Because the vars are
`NEXT_PUBLIC_`, they are inlined at build time: set them in Vercel as well as
locally, and redeploy after changing them.

**Trust points.** The three lines under the price come from `TRUST_POINTS` in
`src/config/site.ts`. The rule there is the same one the trust band follows:
only claims we can evidence. "1,000 travellers" is a fine badge the day the
thousandth traveller comes home and a lie the day before.

**Payment verification.** *(Dormant while `paymentsEnabled` is false.)* A
Razorpay signature is an HMAC over
`order_id|payment_id` — it proves a payment belongs to an order and nothing
more. It says nothing about *what was bought*, so nothing that determines price
is taken from the browser. `create-order` stamps the trip, departure, headcount
and buyer into the order's `notes`, and `recordPaidBooking`
(`src/lib/bookings.ts`) reads the sale back out of the order it fetches from
Razorpay, re-prices it from the database, and refuses to write the booking
unless that total matches the paise actually collected. Signatures are compared
in constant time.

**Paying without a browser.** `/api/razorpay/webhook` records the same booking
from Razorpay's `payment.captured` event, so a customer who pays and then loses
their connection still gets a booking. Both paths run the same function, and a
partial unique index on `razorpay_order_id` means that if they race, one insert
wins and the other returns the existing booking instead of duplicating it.

**Seat counts.** `book_departure_seats` increments inside a single UPDATE, so
two people paying for the last seat can't both read the same count. If a
departure does overshoot, the seat is still allocated — the money is already
taken — and the overshoot is logged loudly for ops rather than silently
dropped.

## Go-live checklist

- [ ] Run `0001` → `0002` → `0003` → `0004` → `0005` → `0006` → `seed.sql`
      → `seed-blog.sql` against the production project
- [ ] Real photography dropped into `public/images` (or uploaded via admin)
- [ ] Brand assets regenerated if the logo changed (`build-brand-assets.mjs`)
- [ ] `NEXT_PUBLIC_SITE_URL=https://outway.club`, no trailing slash — then
      **redeploy**, because `NEXT_PUBLIC_` vars are baked in at build time
- [ ] `outway.club` + `www.outway.club` added in Vercel, www redirecting to the
      apex, and the DNS records in [`docs/production-setup.md`](docs/production-setup.md)
      live at Porkbun
- [ ] Zoho mailboxes reachable — send a mail to `hello@` from an outside
      address and confirm it lands
- [ ] `outway.club` verified in Resend, and SPF/DKIM/DMARC checked with a mail
      to a Gmail address (Show original → all three `PASS`)
- [ ] One booking request sent end to end, and the ops alert email received
- [ ] Razorpay items below only apply when `site.paymentsEnabled` is flipped
      back to `true`:
  - [ ] Razorpay live keys in, and one real booking made end to end
  - [ ] Razorpay webhook created for `payment.captured` pointing at
        `/api/razorpay/webhook`, with its secret in `RAZORPAY_WEBHOOK_SECRET`
        — without it, a customer who closes the tab mid-payment pays and gets
        no booking
- [ ] Resend API key set, **and** Supabase SMTP pointed at it
- [ ] Supabase Auth Site URL + `/auth/callback` redirect URL configured
- [ ] `NEXT_PUBLIC_CONTACT_PHONE` and `NEXT_PUBLIC_BUSINESS_ADDRESS` filled in
      — Razorpay activation requires a published phone number and address
- [ ] First admin promoted, then `/admin/users` verified
- [ ] `/terms`, `/privacy`, `/refund-policy` read end to end and approved
- [ ] Sitemap submitted to Google Search Console
