# Two decisions that aren't ours to make

These came out of the design pass. Both are real problems with evidence behind
them, and both change the business, not just the CSS — so they're written up
rather than shipped. Each section says what's wrong now, what the options are,
exactly what would have to change, and what it costs.

## Status, 15 August 2026

| | Decision | State |
|---|---|---|
| 1 | The signup wall in front of checkout | **Overtaken by events** — read the caveat below before acting on it |
| 2 | Rebuilding `/trips` and the homepage around one product | **Still fully open.** Nothing has been done. |

**On decision 1.** The seven-step funnel described below no longer exists.
`src/app/booking/[slug]/page.tsx` has no `if (!currentUser)` redirect any more —
it reads the current user only to prefill name, email and phone, and a signed-out
stranger can complete a booking request without an account. The
`trip_requests` questionnaire (migration `0006`) replaced the checkout path
while payments are off, which dissolved the problem rather than solving it.

So there is nothing to do **today**. But the wall comes back the moment
`site.paymentsEnabled` flips to `true`, because real checkout needs an
identity to attach a booking to. Re-read section 1 then, not now — the
recommendation there, option (a), is still the right one.

**On decision 2**, verified today: `CatalogueFilters` at
`src/app/trips/page.tsx:106` still renders unconditionally, with one bookable
escape. Five filters over one result. The cheap 20% at the end of section 2 —
gate the filter bar, move the booking band up — is still the best value here.

---

## 1. The signup wall in front of checkout

### What happens today

A stranger who wants to buy a seat has to do this, in this order:

1. `/trips/[slug]` → **Book now**
2. `/booking/[slug]` immediately redirects to `/login?redirect=…`
   (`src/app/booking/[slug]/page.tsx`, the `if (!currentUser)` branch)
3. They don't have an account, so → `/signup`
4. `supabase.auth.signUp()` with `emailRedirectTo` pointing at
   `/auth/callback` (`src/components/auth/signup-form.tsx`)
5. **They leave the site.** Open the mail app. Find the message, possibly in
   spam. Click the link.
6. Land back on `/account`, not on the checkout they were trying to reach.
7. Navigate back to the trip, press **Book now** again.

Seven steps, one mandatory context switch into a different application, and the
return link drops them somewhere other than where they were going. That's the
single largest hole in the funnel on this site — larger than anything the
design pass touched.

### The three ways out, cheapest first

**(a) Turn off email confirmation. Keep accounts.**

In the Supabase dashboard, Authentication → Providers → Email → **Confirm
email: off**. `signUp()` then returns a session immediately, so step 5 and 6
disappear and the user lands in checkout signed in.

- Code: `src/components/auth/signup-form.tsx` currently always renders the
  "check your inbox" panel on success. It would need to check whether a session
  came back and, if it did, `router.push(redirect)` instead. It also needs to
  read the `redirect` query param, which it doesn't today — that's why step 6
  lands on `/account`.
- Also: `src/app/signup/page.tsx` should pass `redirect` through, the same way
  `login-form.tsx` already does with its `safeRedirect()` helper.
- Cost: about half a day. No schema change, no new vendor.
- What you give up: unverified addresses in `profiles.email`, which matters
  because that's where the booking confirmation goes. Mitigation: send the
  confirmation email anyway, post-purchase, and mark the profile unverified
  until they click. Nobody is blocked; the verification just stops being a gate.
- Risk: signup spam gets cheaper. The honeypot and rate limiting in
  `src/lib/rate-limit.ts` already cover the obvious cases.

**(b) Guest checkout — no account at all.**

Bigger, and it fights the schema.

- `bookings.user_id` is `uuid not null references auth.users(id)`
  (`supabase/migrations/0001_init.sql`). Every RLS policy on `bookings` and
  `travelers` is written against `auth.uid()`. So guest checkout means either:
  - a migration making `user_id` nullable plus new columns for a guest
    identity (`contact_email` already exists), and rewriting four RLS policies
    to cope with rows that have no owner; **or**
  - creating a real `auth.users` row server-side with a random password and
    never telling the customer — which is guest checkout in appearance only,
    and leaves an account they can't sign into.
- `/account` is the only place a customer can see or cancel a booking, and it
  is entirely `auth.uid()`-scoped. A guest booking needs a magic-link lookup
  ("email me my booking") or the booking effectively disappears after payment.
- `/api/razorpay/verify` asserts `expectedUserId: user.id` before recording the
  booking. That check is load-bearing — it's what stops one account's payment
  being attached to another's booking. A guest path needs an equivalent, most
  likely signing the order id.
- Cost: a week, plus a migration on a table that holds money, plus a new
  "find my booking" surface. Do not do this the week before a departure.

**(c) Phone OTP.**

`supabase.auth.signInWithOtp({ phone })` is a small code change and a large
operational one. For transactional SMS to Indian numbers you need a provider
(MSG91, Twilio) **and** DLT registration with the TRAI portal — entity
registration, header registration, template approval. That is weeks of
paperwork before the first message sends, and a per-message cost forever.

It is genuinely the right answer for an India-first travel product where the
customer is on a phone and already gives us a number at checkout
(`contact-phone` in `src/components/booking/booking-form.tsx`). It is not the
right answer this month.

### The recommendation

Do **(a)** now. It removes five of the seven steps for the cost of an
afternoon, changes no schema, and adds no vendor. Revisit **(c)** once there
is enough volume to justify the DLT paperwork. **(b)** only if you decide
accounts are wrong in principle, which the `/account` page suggests you don't.

---

## 2. Rebuilding /trips and the homepage around one product

### What's wrong

The catalogue is built for a catalogue. There is one escape on sale.

**`/trips`** (`src/app/trips/page.tsx`) renders, in this order:

- an H1 and a paragraph,
- `CatalogueFilters` — five `<select>`s: month, region, theme, length, budget,
- a result count ("1 escape"),
- a `sm:grid-cols-2 lg:grid-cols-3` grid **containing one card**, padded out
  with dashed "coming soon" tiles,
- a "between dates" section,
- a notify band,
- a three-card "what's in the works" section.

Five filters over one result is a form asking a question that has one answer.
At 1440px the single real card occupies a third of a row and the eye reads the
dashed placeholders as the content. On mobile (see
`tests/__screens__/360-trips.png`) the filter bar is the first thing below the
fold and the one bookable trip is the fifth block down.

**`/` ** (`src/app/page.tsx`) renders nine bands: hero, explore, also-open,
other-destinations, why-us, booking, testimonials, CTA — plus the no-trip
fallback. They are all the same weight: same `section-lg` rhythm, same
`SectionHeading`, same card grids. Three of them are variations on "here are
some places" and two of the three are places you cannot book. The one band
that sells the one thing on sale is seventh.

### What the rebuild involves

**`/trips`:**

1. A `FeatureTripCard` — full content width, image left / detail right at `lg`,
   stacked below. It shows what the current `TripCard` hides for want of room:
   the departure board (the component exists,
   `src/components/trips/departure-board.tsx`), the named stays
   (`stay-cards.tsx`), seats left per date, and the money button. Roughly a new
   150-line component; every part it needs already exists.
2. Render `bookable[0]` as the feature card when `bookable.length === 1`, and
   fall back to the existing grid above that.
3. Gate the filters: `{trips.length > 6 && <CatalogueFilters …/>}`. The
   component is already URL-driven, so hiding it changes no state; a
   deep-linked `?month=` still filters, it just has no visible control. Decide
   whether that's acceptable or whether the gate should also strip the params.
4. Decide what happens to the dashed "coming soon" tiles. With a feature card
   they have nowhere to sit, and they are currently doing the work of making
   the grid look full. `fillWithUpcoming()` in
   `src/config/upcoming-destinations.ts` is where that's controlled.

**`/`:**

Cut to five bands. The proposed set, in order:

1. **Hero** — unchanged, already reads from the spotlight trip.
2. **The escape on sale** — promote the booking band (currently seventh) to
   second, and give it the feature card rather than a price and a button.
3. **Why Outway** — `WhyUs`, unchanged.
4. **Where we go** — merge `DestinationExplorer` and the destination grid into
   one band. They currently answer the same question twice, thirteen tiles
   apart, and only the first is interactive.
5. **Ask us anything** — `CtaBanner`, unchanged.

That drops: the "also open" rail (fold it into band 2 or delete while there is
one trip), the second destination grid (merged), and `Testimonials` — which
currently renders "This page is empty on purpose" because there are no reviews
yet. It's an honest band, and it is also 700px of the homepage explaining that
there's nothing here. Reinstate it after Escape 001 returns.

### Cost and risk

Two to three days. The risk isn't technical, it's that it's a one-way door
against the catalogue: the moment there are six escapes, most of this has to be
unwound. The gates (`trips.length > 6`, `bookable.length === 1`) are what keep
it reversible — write them as conditions, not as deletions, and the catalogue
comes back on its own when it's earned.

### The recommendation

Worth doing, and worth doing *only* with the gates in place. If you'd rather
not carry both layouts, the cheap 20% is: hide the filter bar below six trips,
and move the booking band from seventh to second. That's an hour, it's not a
one-way door, and it fixes the two things a first-time visitor actually trips
over.
