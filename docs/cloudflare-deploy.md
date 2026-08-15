# Deploying to Cloudflare Workers

Why this exists: **Vercel's Hobby plan forbids commercial use.** A site taking
Razorpay payments is commercial, so on Vercel the only compliant options are Pro
at $20/month or leaving. Cloudflare's Workers free plan carries no such
restriction — commercial use is explicitly allowed — which makes it the one
genuinely free *and* legitimate host for this site until funding lands.

Running here is not free of work, though, and the work is all in one place: the
caching that Vercel provides invisibly has to be wired up by hand. Skip it and
the site still renders correctly — it just stops caching and `revalidatePath`
becomes a no-op. **That failure is silent.** Nothing errors; the site is merely
slow and the admin console appears to stop publishing. Read
[`open-next.config.ts`](../open-next.config.ts) before changing anything here.

---

## One-time setup

### 1. Create the two storage resources

Already done for the current account — the ids are committed in
[`wrangler.jsonc`](../wrangler.jsonc). They are identifiers, not credentials, so
committing them is fine. Recreate only if moving to a different Cloudflare
account:

```bash
npx wrangler login
npx wrangler kv namespace create NEXT_INC_CACHE_KV
npx wrangler d1 create outway-club-tags
```

Both prompt "would you like Wrangler to add it on your behalf?". **Say no to
the D1 one.** It appends a second `d1_databases` entry under a generated binding
name instead of filling in the existing `NEXT_TAG_CACHE_D1` entry, and the
adapter only reads the latter.

| Binding | What breaks without it | How it shows up |
|---|---|---|
| `NEXT_INC_CACHE_KV` | Nothing caches; every visit re-queries Supabase | **Silent** — the adapter treats the missing binding as ignorable. The site just gets slow. |
| `NEXT_TAG_CACHE_D1` | `revalidatePath` does nothing | **Loud** — deploy fails with `No D1 binding "NEXT_TAG_CACHE_D1" found!` |

The D1 table itself (`revalidations`) is created automatically, but only by
`opennextjs-cloudflare deploy` — see the deploy section below, because this is
the easy way to get a half-working setup.

### 2. Set the secrets

Anything not prefixed `NEXT_PUBLIC_` is a real secret and goes in with
`wrangler secret put` — never in `wrangler.jsonc`, which is committed:

```bash
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put RAZORPAY_KEY_SECRET
npx wrangler secret put RAZORPAY_WEBHOOK_SECRET
npx wrangler secret put RESEND_API_KEY
```

### 3. Set the public build-time vars

`NEXT_PUBLIC_*` values are **baked into the bundle at build time**, not read at
runtime, so they must be present when the build runs — a secret set afterwards
is invisible to code that already compiled. In Cloudflare's dashboard these go
under Workers & Pages → your worker → Settings → **Variables and Secrets**, and
they must also exist in the build environment:

Most of these are **optional**. `src/config/site.ts` reads every one through a
helper that falls back to a sensible default, and treats an empty string as
unset — so a variable left blank behaves exactly as if it were absent. Only
three genuinely have to be set.

**Required — the site is wrong or broken without them:**

| Variable | Why |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | No default. Without it the app renders the "setup required" screen. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same. |
| `NEXT_PUBLIC_SITE_URL` | Defaults to `http://localhost:3000`, which is worse than missing — it silently poisons every canonical tag, the sitemap, and every link and logo in outbound email. |

**Optional, already correct by default.** Set them only to override:

| Variable | Falls back to |
|---|---|
| `NEXT_PUBLIC_LEGAL_NAME` | `Outway Club` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | `hello@outway.club` |
| `NEXT_PUBLIC_BUSINESS_CITY` | `Udaipur, Rajasthan` |
| `NEXT_PUBLIC_INSTAGRAM_URL` | `https://instagram.com/outway.club` |
| `EMAIL_FROM` | `Outway Club <hello@outway.club>` |
| `OPS_EMAIL` | whatever `NEXT_PUBLIC_CONTACT_EMAIL` resolves to |

> Setting one of these to a *wrong* value is worse than leaving it out, because
> it overrides a correct default. `NEXT_PUBLIC_CONTACT_EMAIL=hello@outwayclub.com`
> — the wrong domain, and not one Resend has verified — is the live example.

**Optional, blank hides the feature.** No default and none wanted; the UI omits
them rather than printing a placeholder: `NEXT_PUBLIC_CONTACT_PHONE`,
`NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_BUSINESS_ADDRESS`,
`NEXT_PUBLIC_GSTIN`, `NEXT_PUBLIC_YOUTUBE_URL`,
`NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, `NEXT_PUBLIC_BING_SITE_VERIFICATION`.

**Deliberately unset while payments are off.** `NEXT_PUBLIC_RAZORPAY_KEY_ID`,
`NEXT_PUBLIC_UPI_ID`, `NEXT_PUBLIC_BANK_*`. Leaving `RAZORPAY_KEY_ID` unset is
what keeps `isRazorpayConfigured()` false, which is the intended state — adding
a placeholder value here does not enable anything, it just makes the intent
harder to read.

---

## Building and previewing

```bash
npm run cf:build     # builds Next, then bundles the Worker
npm run cf:preview   # runs it locally in workerd, not Node
npm run cf:deploy    # pushes to Cloudflare
```

`cf:preview` is the one that matters before any cutover. `npm run dev` runs in
Node and will happily use APIs that do not exist in the Workers runtime; the
preview is the first place a difference shows up.

> **`--include=dev` is not optional on this machine.** `NODE_ENV=production` is
> set globally here, which makes npm silently skip every devDependency —
> including the adapter, wrangler, typescript and tailwind. `npm install`
> reports "up to date" and installs nothing. Always `npm install --include=dev`.

---

## Deploy from GitHub

Workers Builds (Cloudflare dashboard → Workers & Pages → Create → Connect to
Git) is the equivalent of Vercel's git integration.

- **Build command:** `npm install --include=dev && npm run cf:build`
- **Deploy command:** `npx opennextjs-cloudflare deploy`

> **Do not use plain `npx wrangler deploy` as the deploy command.** It uploads
> the worker perfectly happily, and skips the populate-cache step that creates
> the D1 `revalidations` table and seeds KV with the prerendered pages. The
> result is a site that deploys green, serves correctly, never caches, and whose
> admin console appears to have stopped publishing. `opennextjs-cloudflare
> deploy` wraps `wrangler deploy` and does both.

---

## Things that differ from Vercel

**Image optimization is gone.** `next/image` optimization is a Vercel platform
feature; there is no free equivalent on Workers. `CF_BUILD=1` sets
`images.unoptimized`, so images are served at their stored size. The
compensating change is that uploads are now downscaled in the browser before
they reach Supabase Storage (`src/lib/resize-image.ts`) — but that only applies
going forward. **Photos uploaded before this change are still full size and are
now served full size.** Re-upload the homepage hero and the live trip's gallery
through the admin editor and they get shrunk on the way in.

**Cold starts replace warm lambdas.** Workers start faster than Node lambdas,
but `routePreloadingBehavior` is left at `"none"` because preloading trades cold
start CPU for it, and the free plan meters CPU.

**Razorpay is not configured yet, and that is fine.** No Razorpay account
exists as of August 2026, so `RAZORPAY_KEY_SECRET` and
`RAZORPAY_WEBHOOK_SECRET` are deliberately unset on Cloudflare. The app already
guards for this — `isRazorpayConfigured()` gates every path, checkout answers
503 with "Payments aren't switched on yet, please email us", and the webhook and
refund routes log and bail. Nothing crashes and nothing needs stubbing.

> **When Razorpay is switched on, the webhook must be re-tested on Workers
> before it is trusted.** Signature verification reads the raw request body, and
> body handling is exactly the sort of thing that differs between Node and
> workerd. A webhook that fails signature checks does not look broken from the
> outside: the customer pays, Razorpay reports success, and the booking is never
> marked confirmed. Send a test event from the Razorpay dashboard at the
> deployed URL and confirm the booking row actually flips.

---

## Cutover, in order

Nothing here is irreversible until the last step.

1. `npm run cf:preview` — click through trips, blog, a destination page.
2. `npm run cf:deploy` — live on `*.workers.dev`, DNS untouched, Vercel still serving.
3. On the workers.dev URL: sign up, confirm the email, reset a password. This
   exercises Supabase auth *and* Resend, the two secrets that are set.
4. Submit a trip request, and confirm the ops notification email arrives. With
   payments off this is the actual conversion path, so it is the one that
   matters most.
5. Publish a trip in the admin console and confirm it appears on `/trips` within
   seconds, not minutes. This is the check that proves the D1 tag cache works —
   and the one most likely to fail quietly, so do not skip it.
6. Only now: add `outway.club` as a custom domain on the Worker, and update DNS.
7. Leave the Vercel project deployed but undomained for a week. Rolling back is
   then a DNS change rather than a redeploy.

## Rolling back

Point DNS at Vercel again. Nothing in this repo needs reverting — the Cloudflare
config is inert on Vercel, and `CF_BUILD` is only set by the `cf:*` scripts.
