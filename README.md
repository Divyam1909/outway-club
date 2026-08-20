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

Nine SQL files, run in order. All are safe to re-run.

| File | What it does |
|---|---|
| `supabase/migrations/0001_init.sql` | Core schema, RLS policies, triggers |
| `supabase/migrations/0002_launch.sql` | Review moderation + video, computed ratings, cancellation/refund columns, rate-limit counters, `profiles.email`, admin role guard, image storage bucket |
| `supabase/migrations/0003_blog.sql` | Journal posts and moderated reader comments, computed post ratings, view counter, editorial image bucket |
| `supabase/migrations/0004_catalogue.sql` | Edition numbers and spotlight ranking on trips |
| `supabase/migrations/0005_booking_integrity.sql` | One booking per Razorpay order, atomic seat allocation |
| `supabase/migrations/0006_trip_requests.sql` | `trip_requests`: the pre-booking questionnaire, one column per answer. **Required** — "Book now" writes here while payments are off |
| `supabase/migrations/0007_promos_blog_roles.sql` | The `blogger` role and `is_blog_editor()`; reader-submitted articles (`submitted` / `rejected` statuses, review notes, contributor uploads); `promo_codes`, `promo_redemptions` and the atomic `claim_promo_code` |
| `supabase/migrations/0008_journey.sql` | The journey layer on `trips`: `promise`, `journey_route`, `really_booking`, `who_for`, `not_for`, `feelings`. Every one is authored `Label — the sentence`, one per line in the admin trip editor |
| `supabase/seed.sql` | Base catalogue content and the Udaipur destination. Deletes the pre-launch demo catalogue. **No seeded reviews** — those come from real travellers only. |
| `supabase/seed-blog.sql` | The Udaipur destination guide, the Journal's first post. Real editorial copy kept in version control rather than typed into the admin console, so a fresh environment comes up with the same article. Re-runnable: it upserts on `slug` and never overwrites the original `published_at`. |
| `supabase/seed-jawai-udaipur.sql` | **Escape 001 — Jawai × Udaipur**, Delhi → Jawai → Udaipur → Delhi, 4–8 September, and the code that prices it. Adds the Jawai destination and pushes the old Mount Abu escape to edition 003. Run this before the Jodhpur seed: it is what frees edition number 2. |
| `supabase/seed-jawai-jodhpur.sql` | **Escape 002 — Jawai × Jodhpur**, 23–27 October. `is_published = false`, so it exists only in the admin console: the public URL 404s and it is absent from the catalogue, sitemap and feed. Publishing it is one checkbox in the trip editor. |

Paste them into the Supabase SQL editor, or apply them from the command line:

```bash
npm i -g pg                 # operator-only dependency
npm run db:migrate
node scripts/db.mjs supabase/migrations/0003_blog.sql
node scripts/db.mjs supabase/migrations/0004_catalogue.sql
node scripts/db.mjs supabase/migrations/0005_booking_integrity.sql
node scripts/db.mjs supabase/migrations/0006_trip_requests.sql
node scripts/db.mjs supabase/migrations/0007_promos_blog_roles.sql
node scripts/db.mjs supabase/migrations/0008_journey.sql
npm run db:seed
node scripts/db.mjs supabase/seed-blog.sql
node scripts/db.mjs supabase/seed-jawai-udaipur.sql
node scripts/db.mjs supabase/seed-jawai-jodhpur.sql
```

The two escape seeds are order-dependent: `trips_edition_number_key` is a
unique index, so 001 has to take its number back before 002 can claim its own.

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

The site is on **Cloudflare Workers**, at **https://outway.club** (apex is
canonical; `www` 301-redirects to it via a Cloudflare Redirect Rule). DNS is
managed at **Cloudflare**; Porkbun is the registrar only. Mailboxes are **Zoho
Mail**; app-sent email is **Resend**.

It ran on Vercel until 15 August 2026, when the Hobby plan's ban on commercial
use forced the move.

The DNS record set, the deploy commands and their two npm traps, the KV and D1
cache bindings, and how to roll back are all in
[`docs/infrastructure.md`](docs/infrastructure.md). Read that before touching
DNS. What is still outstanding is in
[`docs/still-to-do.md`](docs/still-to-do.md).

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

   SMTP settings change *who the mail is from*, not what it looks like — the
   bodies stay on Supabase's unbranded defaults until you paste ours in.
   Ready-to-use templates for all six auth emails, and an explanation of the
   three different things people mean by "the logo isn't showing", are in
   [`docs/supabase-auth-emails.md`](docs/supabase-auth-emails.md).

## The itinerary PDF

The customer-facing brochure is generated from the trip's own rows, not drawn
by hand:

```bash
npm run itinerary:pdf                        # the spotlight trip
npm run itinerary:pdf -- jawai-udaipur       # a specific slug
npm run itinerary:pdf -- jawai-jodhpur       # works for unpublished escapes too
```

It reads `trips`, `itinerary_days`, the next `departure` and any auto-applying
promo code, and writes `public/itineraries/<slug>.pdf` as a mini magazine:
cover, the brand philosophy, the visual journey, highlights, one page per day,
the community spread, inclusions and packing, who it's for, and a closing page.

The brochure is the one surface that prints the operational clock times.
Activities are authored `Band (exact time) — What happens`; the website renders
only the band, because the customer-facing journey shows the experience, and
somebody still has to run the day. Living under `public/` means
the trip page can offer it as a download; add the slug to
`src/config/itineraries.ts` and a "Download as PDF" button appears beside the
itinerary. Naming a slug outright also works for an unpublished trip, which is
the case that matters when someone asks when an escape runs again.

The price on the cover is the price after the promo, because a brochure quoting
a different number from the website is worse than no brochure. **Re-run it after any change to a trip's dates,
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

Every image path the site expects — trip, destination and Journal — is listed
with its aspect ratio and usage in
[`public/images/README.md`](public/images/README.md), alongside the house style
and the export settings. Every slot currently holds real photography.

Drop replacements in using the same filenames, or upload through the admin trip
editor (Admin → Trips → edit → Content), which writes to Supabase Storage and
needs no redeploy. Journal figures are the exception: the article body lives in
Postgres, so changing one also means editing `supabase/seed-blog.sql` and
re-running `node scripts/db.mjs supabase/seed-blog.sql`.

Branded pine-green fallback panels can be rebuilt with:

```bash
node scripts/generate-placeholders.mjs
```

It skips any path that already has a file, so it will not overwrite real
photography. Pass `--force` if you actually want the placeholders back.

## Admin access

There is no separate admin login. An admin is an ordinary account — signed up
at `/signup` with an email and password like any customer — whose
`profiles.role` is `'admin'`. That one column is what `/admin` and every
`/api/admin/*` route check.

There are three roles:

| Role | Sees |
|---|---|
| `customer` | The public site. Can send in an article at `/blog/write`, which is reviewed before it appears. |
| `blogger` | `/admin/blog` and `/admin/blog/comments` only — write, edit, publish, unpublish, moderate comments, approve or decline reader submissions. No bookings, customers, payments, trips or promo codes. |
| `admin` | Everything. |

`blogger` is enforced in three places, not one: the nav hides what it can't
open, every commercial page calls `requireAdminPage()` itself so typing the URL
in fails too, and the database's RLS grants the Journal tables to
`is_blog_editor()` rather than to `is_admin()`. Set it from **/admin/users** —
the role control is a three-way picker, and each change is confirmed by naming
what that role can actually do.

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
| `/admin/blog` | Writing, publishing and unpublishing journal posts, and the queue of pieces readers have sent in |
| `/admin/blog/comments` | Reader comments — nothing appears publicly until it's approved here |
| `/admin/promo-codes` | Discount codes: percentage or flat, capped, limited by total uses, uses per person, minimum order, date window and trip. Includes a worked example of what a customer actually pays before you save it. |

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
npx playwright test tests/admin.spec.ts tests/blog.spec.ts tests/roles-and-promos.spec.ts
node scripts/admin-test-user.mjs delete
node scripts/cleanup-test-data.mjs      # sweeps up anything a failed run left
```

`admin-test-user.mjs` creates one account per role — admin, blogger and
customer — because the roles are what several of these tests are about.

`tests/blog.spec.ts` drives the whole journal: writing a post in the rich-text
editor, publishing it, reading it, commenting on it, moderating the comment and
deleting the post — plus the same round trip for a destination. It creates and
removes everything it touches, so it leaves the database as it found it.

`tests/roles-and-promos.spec.ts` covers the three things a screenshot cannot:
that a blogger reaches the Journal and is turned away from every other admin
URL, that a reader's article goes submit → queue → approve → live with the right
byline and markup, and that promo codes actually change the price at checkout —
including a typed code losing to a larger auto-applied one, and never both
applying at once.

`tests/screenshots.spec.ts` is a visual sweep rather than an assertion suite —
run it and look at `tests/__screens__/`.

## How a few things work

**Promo codes.** One code per booking, always — not a list, not a stack. The
event code on Escape 001 applies itself, and a code someone types replaces it
*only if it saves more*; otherwise the bigger one stays and the panel says why.
The arithmetic lives in `src/lib/promo-rules.ts` (pure, no database, shared by
the browser and the server) and every figure that reaches the database is
recomputed by `src/lib/pricing.ts` from the trip's own row — the request body
carries a code, never a price, so a tampered payload cannot buy a trip for ₹1.
The use itself is spent by `claim_promo_code`, a single locked statement, so a
code capped at fifty uses cannot be used fifty-one times by two people pressing
send together; if the write that followed fails, the use is handed back.

**Not losing money on an offer.** The Janmashtami code is ₹1,000 off ₹8,999,
which lands on exactly ₹7,999 — the price the trip actually runs at. The
₹8,999 struck through on the page is the same list price the catalogue has
always carried, so the discount is real rather than a second markup, and the
page never shows more than two numbers. `tripPricing()` enforces that: the
struck-through figure is always the list price and the live one is what you pay
after everything, however many discounts are technically in play.

**Reader-submitted articles.** `/blog/write` needs an account — not to gate the
writing, but so a published piece has a real byline and a declined one has
somewhere to be explained. A submission is stored as `status = 'submitted'`,
which no public query returns and which RLS shows only to its author and the
Journal editors; there is no request body that publishes anything. Approving it
in `/admin/blog` flips the status, purges the cached Journal pages before the
response returns, and emails the writer the link. It renders through exactly
the same path as a piece we wrote ourselves, from HTML the same sanitiser
already cleaned at submission — which is what makes "approved" and "renders
correctly" the same event. A decline requires a note, because the note is the
entire email the writer gets.

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

**The journal.** Posts are written by admins and bloggers, and sent in by
readers through `/blog/write` for review. The editor is a `contentEditable` surface carrying the same
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

**Being found by more than Google.** Ranking on Google and nowhere else is
almost always the same story: everything was built for Google's discovery, and
nothing was ever told to anybody else. Four things address that here.

*Bing Webmaster Tools is the lever.* Bing's index is what DuckDuckGo, Ecosia,
Yahoo and a large share of Brave's results are built from, so verifying there
and submitting the sitemap covers most of "everywhere except Google" in one
step. Set `NEXT_PUBLIC_BING_SITE_VERIFICATION` (and `NEXT_PUBLIC_YANDEX_VERIFICATION`
if you want Yandex) and redeploy — they are baked in at build time.

*IndexNow* (`src/lib/indexnow.ts`) pushes a changed URL to Bing, Yandex, Seznam,
Naver and Yep the moment a trip or a post is published, instead of waiting weeks
for a new domain to be recrawled. It fires from `revalidateContent`, so the same
call that purges our cache tells them. It needs `INDEXNOW_KEY` and a matching
`public/<key>.txt` — both are already in the repo. Google ignores IndexNow and
discovers by crawling; the sitemap is its route in.

*robots.txt* names Bingbot, Bravebot, DuckDuckBot, Yandex, Applebot and the rest
explicitly. The wildcard rule already allowed them, but Brave Search has no
submission form at all — being crawlable and having a sitemap is the entire
lever there — and several of these crawlers behave better with an entry of their
own. `max-image-preview: large` is set on the generic robots meta as well as the
Google-specific one, because Bing and Yandex read the generic block.

*An RSS feed* at `/feed.xml`, linked from the document head. Aggregators poll it,
readers subscribe to it, and several non-Google crawlers treat it as a signal
that a site publishes regularly and is worth coming back to.

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

**How people actually pay.** `site.bank` (six `NEXT_PUBLIC_*` vars, see
`.env.example`) drives the "Payment details" block on the trip and booking
pages: UPI ID and QR, bank account, and a screenshot on WhatsApp. It renders
nothing unless a UPI ID, a QR, or a *complete* account is configured — a payment
section with half an account number is worse than none. The QR is a plain
`<img>` pointed at a `/public` path or any URL, so it needs no
`remotePatterns` entry, and the account name is printed beside it as the check
that catches a swapped code before the money moves. Because the vars are
`NEXT_PUBLIC_`, they are inlined at build time: set them in `.env.local`, then
rebuild and redeploy — changing them anywhere else has no effect. They are all
still blank, which is why the block is invisible in production
([`docs/still-to-do.md`](docs/still-to-do.md)).

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

## Go-live

Done. The site has been live at **https://outway.club** since August 2026, on
Vercel first and on Cloudflare Workers from the 15th. Migrations are run, the
mail chain is verified, the auth templates are in, and Search Console is
verified by DNS.

What is still outstanding — payment details, phone, address, GSTIN, DNSSEC and
the post-cutover housekeeping — is tracked in
[`docs/still-to-do.md`](docs/still-to-do.md). How the whole thing is wired is in
[`docs/infrastructure.md`](docs/infrastructure.md).
