# Outway Club

Small-group travel, one escape at a time. Currently running **Escape 001 —
Udaipur × Mount Abu, 15–17 August**.

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

Four SQL files, run in order. All are safe to re-run.

| File | What it does |
|---|---|
| `supabase/migrations/0001_init.sql` | Core schema, RLS policies, triggers |
| `supabase/migrations/0002_launch.sql` | Review moderation + video, computed ratings, cancellation/refund columns, rate-limit counters, `profiles.email`, admin role guard, image storage bucket |
| `supabase/migrations/0003_blog.sql` | Journal posts and moderated reader comments, computed post ratings, view counter, editorial image bucket |
| `supabase/seed.sql` | Escape 001 content. Deletes the pre-launch demo catalogue. **No seeded reviews and no seeded posts** — both come from real people only. |

Paste them into the Supabase SQL editor, or apply them from the command line:

```bash
npm i -g pg                 # operator-only dependency
npm run db:migrate
node scripts/db.mjs supabase/migrations/0003_blog.sql
npm run db:seed
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

## Production email

There are two separate email paths and both need wiring before real signups:

1. **Transactional email we send** — booking receipts, cancellation
   confirmations, enquiry alerts, waitlist welcomes. Handled by
   `src/lib/email.ts` through the Resend API. Set `RESEND_API_KEY` and verify
   your sending domain in Resend.

2. **Supabase Auth email** — signup confirmation and password reset. These are
   sent *by Supabase*, not by this app, and the built-in sender is rate-limited
   to a handful per hour and explicitly not meant for real users. Point
   Supabase at the same provider:

   Supabase dashboard → **Project Settings → Authentication → SMTP Settings**

   | Field | Value |
   |---|---|
   | Host | `smtp.resend.com` |
   | Port | `465` |
   | Username | `resend` |
   | Password | your Resend API key |
   | Sender email | an address on your verified domain |

   Then set the **Site URL** and add `https://yourdomain.com/auth/callback` to
   **Redirect URLs**, or password-reset and confirmation links will bounce to
   localhost.

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

Every image path the site expects is listed in
[`public/images/README.md`](public/images/README.md), with generation prompts in
[`docs/photography-prompts.md`](docs/photography-prompts.md).

Branded placeholders ship at each path so nothing is ever broken. Drop real
photos over them using the same filenames, or upload through the admin trip
editor (Admin → Trips → edit → Content), which writes to Supabase Storage and
needs no redeploy. Regenerate the placeholders with:

```bash
node scripts/generate-placeholders.mjs
```

## Admin access

The first admin has to be created directly, because there's no admin yet to
promote them:

```sql
update profiles set role = 'admin' where email = 'you@yourdomain.com';
```

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

**Payment verification.** Signatures are compared in constant time, the amount
is always recomputed server-side, and the handler is idempotent on
`razorpay_order_id` so a retried callback can't double-book a seat.

## Go-live checklist

- [ ] Run `0001` → `0002` → `0003` → `seed.sql` against the production project
- [ ] Real photography dropped into `public/images` (or uploaded via admin)
- [ ] Brand assets regenerated if the logo changed (`build-brand-assets.mjs`)
- [ ] `NEXT_PUBLIC_SITE_URL` set to the real domain, no trailing slash
- [ ] Razorpay live keys in, and one real booking made end to end
- [ ] Resend API key set, **and** Supabase SMTP pointed at it
- [ ] Supabase Auth Site URL + `/auth/callback` redirect URL configured
- [ ] `NEXT_PUBLIC_CONTACT_PHONE` and `NEXT_PUBLIC_BUSINESS_ADDRESS` filled in
      — Razorpay activation requires a published phone number and address
- [ ] First admin promoted, then `/admin/users` verified
- [ ] `/terms`, `/privacy`, `/refund-policy` read end to end and approved
- [ ] Sitemap submitted to Google Search Console
