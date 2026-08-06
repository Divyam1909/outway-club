# Outway Club

A premium-but-approachable tours & travel booking site — curated trips, group departures with real seat availability, full day-by-day itineraries, and end-to-end booking with Razorpay.

**Stack:** Next.js 15 (App Router, TypeScript) · Tailwind CSS · Supabase (Postgres + Auth + RLS) · Razorpay · deployable on Vercel or Cloudflare.

Every piece of content — trips, destinations, itineraries, departures, reviews — lives in Supabase. There's no hard-coded content in the app itself, so editing data in Supabase (or through the built-in admin panel) is all that's needed to run a different catalog.

## 1. Project structure

```
src/
  app/                    Routes (App Router)
    trips/                Listing + [slug] detail page
    destinations/         Listing + [slug] detail page
    group-trips/          Fixed-departure listing
    booking/[slug]/       Traveler details + Razorpay checkout
    booking/confirmation/ Post-payment confirmation
    account/              Signed-in user's bookings
    admin/                Admin-only: dashboard, trip CRUD, bookings
    login/, signup/       Supabase Auth
    api/razorpay/         create-order + verify route handlers
  components/             UI, layout, and feature components
  lib/
    supabase/             browser / server / admin / middleware clients
    data.ts                All read queries (Server Components only)
    auth.ts                getCurrentUser / requireAdminPage
    types.ts               Shared TypeScript types mirroring the DB schema
supabase/
  migrations/0001_init.sql Full schema, RLS policies, triggers
  seed.sql                 8 destinations, 8 fully-detailed trips, itineraries,
                            departures and reviews to launch with real content
```

## 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open the SQL Editor and run `supabase/migrations/0001_init.sql`, then `supabase/seed.sql`.
3. Go to **Project Settings → API** and copy the Project URL, `anon` key, and `service_role` key.
4. Copy `.env.example` to `.env.local` and fill in:

   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ```

Until these are set, the app renders a "Connect Supabase" setup screen instead of erroring — that's intentional (see [`src/components/setup-required.tsx`](src/components/setup-required.tsx)).

### Making yourself an admin

Sign up through the site once, then in the Supabase SQL Editor:

```sql
update profiles set role = 'admin' where id = (
  select id from auth.users where email = 'you@email.com'
);
```

You'll then see an **Admin** link in the navbar, giving access to `/admin` — trip CRUD (including full itinerary and departure editing) and a bookings list.

### Email confirmation

By default Supabase requires email confirmation on signup. For local development, you can either confirm via the email Supabase sends (configure an SMTP provider or use the built-in test inbox under Authentication → Emails), or turn off "Confirm email" under **Authentication → Providers → Email** for faster iteration.

## 3. Set up Razorpay (optional, for real payments)

1. Create an account at [razorpay.com](https://razorpay.com) and grab your **test mode** API keys from Settings → API Keys.
2. Add to `.env.local`:

   ```
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
   RAZORPAY_KEY_SECRET=
   ```

3. Group trips ("Book now") go through Razorpay Checkout end-to-end: an order is created server-side in `/api/razorpay/create-order`, and the payment signature is verified server-side in `/api/razorpay/verify` before a booking is written — the client never decides whether a payment succeeded. Private/customizable trips (e.g. the Andaman honeymoon package) route to an enquiry form instead of checkout, since those need date/price confirmation first.

Until Razorpay is configured, everything else on the site works fine — only the final "Pay" step on a booking will fail.

## 4. Run locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

## 5. Deploy

**Vercel** (recommended, zero-config for Next.js):
1. Push this repo to GitHub.
2. Import it in Vercel.
3. Add the same environment variables from `.env.local` (plus `NEXT_PUBLIC_SITE_URL` set to your production URL) in Project Settings → Environment Variables.
4. Deploy.

**Cloudflare (Pages / Workers via `@cloudflare/next-on-pages` or the OpenNext adapter):**
1. Push to GitHub and connect the repo in the Cloudflare dashboard.
2. Set the same environment variables as above.
3. Follow Cloudflare's current Next.js adapter docs for the build command — the app itself has no Vercel-specific APIs, so it's portable.

In both cases, also add your production domain to Supabase's **Authentication → URL Configuration → Redirect URLs** (needed for the email-confirmation and `/auth/callback` flow), and switch Razorpay to live keys when you're ready to take real payments.

## 6. Content model, in one paragraph

A `destination` (e.g. Ladakh) has many `trips`. A `trip` has a full `itinerary_days` day-by-day plan, `inclusions`/`exclusions`/`things_to_carry` arrays, and — if it's a group trip — a set of `departures` (real dates with seat counts, auto-flagged `filling_fast`/`sold_out` by a database trigger as seats fill). A `booking` belongs to a user and a trip (and optionally a departure), carries its own `travelers`, and is written only after Razorpay signature verification. `reviews` and `enquiries` round out the picture. Row Level Security enforces all of this at the database level — see the policies in `supabase/migrations/0001_init.sql`.

## 7. Design system

Light theme, built around a "premium but for everyone" feel — warm cream backgrounds, a deep pine green for structure/trust, a terracotta/clay accent for CTAs, and a muted gold for highlights and ratings. Display type is Fraunces (serif), body/UI type is Inter. Tune it in `tailwind.config.ts` and `src/app/globals.css`.
