# Infrastructure

Where **https://outway.club** actually runs. **Last updated 16 August 2026** —
see the [change log](#change-log) at the bottom. This file replaces the old
`production-setup.md` and `cloudflare-deploy.md`, both of which described setups
that no longer exist.

> ## Open on the infrastructure itself
>
> Everything else here is done and verified. This one is not:
>
> 1. **The Vercel project still exists**, undomained, as the rollback path.
>    Delete after 22 Aug 2026. [Details](#rolling-back-to-vercel).
>
> DNSSEC and Always Use HTTPS came off this list on 15 Aug; GitHub → Cloudflare
> on 16 Aug.
>
> Product-level gaps — payment details, phone, address — are in
> [`still-to-do.md`](still-to-do.md).

| Concern | Provider | Notes |
|---|---|---|
| Hosting | **Cloudflare Workers** | via `@opennextjs/cloudflare`. Was Vercel until 15 Aug 2026. |
| DNS | **Cloudflare** | Nameservers moved off Porkbun on 15 Aug 2026. |
| Registrar | Porkbun | Domain only. DNS records are **not** edited here any more. |
| Mailboxes | Zoho Mail (India DC) | Receives. `hello@`, `bookings@`, `divyam@`, `noreply@`. |
| App email | Resend | Sends. `src/lib/email.ts`. |
| Auth email | Supabase → Resend SMTP | Signup, reset, magic link. |
| Database / auth / storage | Supabase | Unchanged throughout. |

**Why not Vercel.** Vercel's Hobby plan forbids commercial use, and a site that
sells trips is commercial regardless of whether checkout is switched on. The
compliant options were Pro at $20/month or leaving. Cloudflare's Workers free
plan explicitly permits commercial use, which makes it the one genuinely free
*and* legitimate host until funding lands.

**Why the nameservers had to move.** A Worker custom domain requires the zone to
live inside Cloudflare. There is no CNAME-only option on the free plan. That is
the whole reason DNS left Porkbun — it was not a preference.

Running cost is now **~$12/year**, the domain renewal, and nothing else.

---

## The DNS record set

Managed at **Cloudflare → DNS → Records**. Thirteen records.

| Type | Name | Value | Proxy |
|---|---|---|---|
| A/AAAA | `@` | *managed by Cloudflare* — created by the Worker custom domain | Proxied |
| AAAA | `www` | `100::` | **Proxied** |
| MX 10 | `@` | `mx.zoho.in` | — |
| MX 20 | `@` | `mx2.zoho.in` | — |
| MX 50 | `@` | `mx3.zoho.in` | — |
| MX 10 | `send` | `feedback-smtp.ap-northeast-1.amazonses.com` | — |
| TXT | `@` | `v=spf1 include:zoho.in ~all` | — |
| TXT | `@` | `zoho-verification=zb43079232.zmverify.zoho.in` | — |
| TXT | `@` | `google-site-verification=K0vi31qJi2SO3tDJOh_cpPUqIk-U4Smk4YtELZwDxnM` | — |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | — |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:divyam@outway.club; fo=1` | — |
| TXT | `zmail._domainkey` | Zoho DKIM (1024-bit RSA) | — |
| TXT | `resend._domainkey` | Resend DKIM | — |

Rules that break things when violated:

- **Exactly one SPF record on the root.** Two produces a `permerror` and
  receivers may reject everything. The root SPF only needs Zoho — Resend's SPF
  lives on `send.outway.club`, a different name, so they never compete. Do
  **not** add `include:_spf.resend.com` to the root; it is redundant and burns
  one of SPF's ten permitted lookups.
- **Exactly one DMARC record.** Multiple unrelated TXT records on the root are
  fine (SPF, Zoho, Google all coexist) — SPF and DMARC are the two exceptions.
- **The MX split is deliberate.** Zoho's MX sits on the root, Resend's on
  `send.`. MX records only affect the exact name they sit on, so both work.
- **Never enable Cloudflare Email Routing.** Cloudflare offers it prominently
  and it overwrites the Zoho MX records. This is the single most likely way to
  break inbound mail on this domain.
- **Never proxy the mail records.** MX and TXT are DNS-only by nature; if a
  future A record for a mail host appears, it must stay grey-cloud.

### `www`

`www.outway.club` is **not** a Worker custom domain — adding it as one would
serve the site on both hostnames and split the SEO. Instead:

- a proxied `AAAA` on `www` pointing at `100::`, Cloudflare's documented
  placeholder for a redirect-only hostname. Nothing is ever sent there.
- a **Redirect Rule** (Rules → Redirect Rules): when `http.host eq
  "www.outway.club"`, dynamic redirect to
  `concat("https://outway.club", http.request.uri.path)`, **301**, preserve
  query string on.

Redirect Rules run at the edge *before* Workers, so this costs no Worker
request.

### SSL

SSL/TLS mode is **Full (strict)**, Always Use HTTPS on. Universal SSL covers the
apex and `www`. There is no origin server behind Cloudflare — the Worker *is*
the origin — so the origin-certificate and post-quantum settings underneath the
encryption mode are inert here.

### DNSSEC — live

Done as of 15 Aug 2026. Cloudflare has signed the zone, the DS record is entered
at Porkbun (Domain Management → `outway.club` → DNSSEC), and it has reached the
`.club` registry — `a.nic.club` returns the `DS` row for key tag 2371 when asked
directly. Values, for reference if it ever needs re-entering:

```
Key Tag 2371 · Algorithm 13 (ECDSA/SHA-256) · Digest Type 2 (SHA-256)
Digest A864D8399EE39EE99495FC7CBBA329AA80CD6524BC0A1E1E8DF929DC86267786
```

Porkbun rejects the submission if the **keyData** block (Flags, Protocol, Key
Data Algorithm, Public Key) is filled in — `.club` runs on a registry that takes
**dsData only**. Leave keyData empty, and leave *Max Sig Life* empty too.

To re-check it at any time, ask the registry directly — no cache can fool this:

```powershell
Resolve-DnsName outway.club -Type DS -Server 37.209.192.10 -DnsOnly   # a.nic.club
```

A `DS` row with key tag `2371` means live. An `SOA` row means it has gone.

---

## Deploying

Since 16 Aug 2026 the normal path is **push to `main`** and let Workers Builds
do it — see [below](#deploying-from-github--connected-16-aug-2026). The local
commands remain for previewing and for deploying when CI is not an option.

```bash
npm run cf:build     # builds Next, then bundles the Worker
npm run cf:preview   # runs it locally in workerd, not Node
npm run cf:deploy    # uploads the LAST BUILD — see below
```

> ### `cf:deploy` does not build. Always build first.
>
> `opennextjs-cloudflare deploy` uploads whatever is already sitting in
> `.open-next/`. It does **not** run `next build` first, and it gives no
> indication that it hasn't — the log jumps straight to "Populating remote KV
> incremental cache" and ends with a green "Deployed outway-club triggers".
>
> Deploy on its own after a source change therefore **re-ships the previous
> build**, successfully and silently. This was hit for real on 15 Aug 2026: a
> CSP change deployed clean and the old header was still being served.
>
> Always run both, in order:
>
> ```bash
> CF_BUILD=1 node node_modules/@opennextjs/cloudflare/dist/cli/index.js build
> CF_BUILD=1 node node_modules/@opennextjs/cloudflare/dist/cli/index.js deploy
> ```
>
> And verify the thing you changed actually shipped, rather than trusting the
> exit code — for a header, `curl -sI https://outway.club`.

`cf:preview` matters more than it looks: `npm run dev` runs in Node and will
happily use APIs that do not exist in the Workers runtime. The preview is the
first place a difference shows up.

The adapter prints `WARN OpenNext is not fully compatible with Windows` on every
build. It has worked on every deploy so far; treat it as noise unless something
actually fails.

### Two npm traps on this machine

**`--include=dev` is not optional here.** `NODE_ENV=production` is set globally
on this machine, which makes npm silently skip every devDependency — including
the adapter, wrangler, typescript and tailwind. `npm install` reports "up to
date" and installs nothing. Always `npm install --include=dev`. The symptom is
`Cannot find module 'tailwindcss'`, followed by a wall of "Can't resolve
'@/components/…'" once typescript is gone too.

Never pass `NODE_ENV=development` to `next build` itself — that breaks `/404`
prerendering with a misleading `<Html> should not be imported` error.

**`npm run cf:deploy` fails here with `Wrangler kv bulk put command failed`,**
preceded by npm usage text and `npm@2.15.12 C:\Users\divya\node_modules\npm`.

Nothing is wrong with the adapter. `npm run` prepends `node_modules/.bin` from
the project **and every ancestor directory** to `PATH`. There is a stray
`C:\Users\divya\node_modules` — left over from an accidental `npm install
concurrently` in the home folder — containing **npm 2.15.12**, and because the
project lives under `C:\Users\divya\`, that decade-old npm shadows the real 11.x
inside every npm script. The adapter shells out to `npm exec wrangler`, npm 2
has no `exec`, and it prints usage and exits.

Workaround — invoke the CLI directly so npm never rewrites `PATH`:

```bash
CF_BUILD=1 node node_modules/@opennextjs/cloudflare/dist/cli/index.js preview
CF_BUILD=1 node node_modules/@opennextjs/cloudflare/dist/cli/index.js deploy
```

Real fix — delete `C:\Users\divya\node_modules`, `C:\Users\divya\package.json`
and `C:\Users\divya\package-lock.json`. Nothing depends on them; they only
declare `irm` and `concurrently`. Doing so also makes `outputFileTracingRoot` in
`next.config.mjs` unnecessary. Cloudflare's own builders have no such folder.

### Deploying from GitHub — connected 16 Aug 2026

Workers Builds (Workers & Pages → `outway-club` → Settings → Builds) is the
equivalent of Vercel's git integration. A push to `main` now builds and deploys.

| Setting | Value |
|---|---|
| Git account | `Divyam1909` — a **different** Google account from the Cloudflare one, which is fine: the GitHub App has its own sign-in and does not care who is logged into Cloudflare. No collaborator invite was needed. |
| Repository / branch | `outway-club` / `main` |
| Build command | `npm install --include=dev && npm run cf:build` |
| Deploy command | `npx opennextjs-cloudflare deploy` |
| Non-production branch deploy | `npx opennextjs-cloudflare upload` |
| Path | `/` |
| Build caching | on |

All 20 `NEXT_PUBLIC_*` are set as **build** variables, checked value-for-value
against `.env.local` before connecting. `EMAIL_FROM` and `OPS_EMAIL` are also
there but do nothing: they are read at request time from the `vars` block in
`wrangler.jsonc`, which stays authoritative.

> **Do not use plain `wrangler` for either command.** `npx wrangler deploy` and
> the `npx wrangler versions upload` that Cloudflare pre-fills for non-production
> branches both skip the populate-cache step that creates the D1 `revalidations`
> table and seeds KV with the prerendered pages. The result is a site that
> deploys green, serves correctly, never caches, and whose admin console appears
> to have stopped publishing. The `opennextjs-cloudflare` commands wrap wrangler
> and do both.

Because CI runs `cf:build` before `cf:deploy`, the stale-deploy trap
[above](#cfdeploy-does-not-build-always-build-first) cannot happen on a pushed
commit. It still can when deploying by hand from this laptop.

#### First build, verified end to end

Build `#2cc63f01`, commit `a2a7626`, 16 Aug 2026 — 2m 9s from push to live.
Checked against the live site rather than trusted from the log:

| | |
|---|---|
| `next build` genuinely ran | "Creating an optimized production build", 48/48 static pages. This is the check that distinguishes a real deploy from the stale-deploy trap. |
| Build variables reached the build | All three SSG routes prerendered — `/blog/udaipur-travel-guide`, `/destinations/udaipur`, `/trips/udaipur-mount-abu`. They come from `generateStaticParams` hitting Supabase, so their presence proves the Supabase pair arrived. **A missing key would still build green, with those rows simply absent** — that is the failure to watch for, not a red build. |
| Adapter deploy, not bare wrangler | "Successfully populated cache with 38 entries" and "Successfully created D1 table". |
| Version | `5b869ca5-9d02-499b-b043-5d2b91ba28b8`, 100%. |
| Live | `/`, `/trips`, the article, the destination, `sitemap.xml`, `robots.txt` all 200; sitemap carries 7 `lastmod` entries and none on `/about`, `/terms`, `/privacy`. |

Two log details that look wrong and are not:

- **38 KV entries, where a local deploy inserts 68.** CI checks out clean; this
  laptop's `.open-next/cache` still holds directories from earlier build IDs and
  ships them too. 38 is the honest count.
- **`npm install --include=dev` reports "up to date" and installs nothing.**
  Cloudflare runs its own `npm clean-install` first, which already pulled all
  453 packages including devDependencies. The `--include=dev` flag exists for
  the `NODE_ENV=production` trap [above](#two-npm-traps-on-this-machine), which
  is specific to this laptop — CI does not have it. Costs a second; keep it, so
  the same command works in both places.

Cloudflare's builder runs Node 24.18.0 and npm 10.9.2 out of `/opt/buildhome/repo`,
against Node 22 and npm 11.x locally. No difference has shown up so far, but the
build that matters is now the one you cannot see.

### `NEXT_PUBLIC_*` is baked in at build time

Not read at runtime, so whichever machine runs `next build` supplies them.

- **CI builds** read the build variables in Workers Builds. This is now the
  path a pushed commit takes.
- **Local builds** read `.env.local`, which is gitignored.

Until 16 Aug 2026 that second file was the only copy of production's build
configuration anywhere — the same failure mode as
[`supabase-auth-emails.md`](supabase-auth-emails.md): no export, no history, one
laptop. Cloudflare now holds a second copy, but the two can drift silently,
because a local build and a CI build of the same commit will happily produce
different bundles. Change one, change the other.

The exception is `NEXT_PUBLIC_SITE_URL`, which is also declared in
`wrangler.jsonc` because a wrong value there is the most damaging single
misconfiguration in the app — it poisons every canonical tag, the sitemap, and
every link and logo in outbound email.

---

## Storage bindings and the cache

`wrangler.jsonc` holds two bindings whose names are **not** ours to choose —
they are exactly what the OpenNext adapter looks up.

| Binding | What breaks without it | How it shows up |
|---|---|---|
| `NEXT_INC_CACHE_KV` | Nothing caches; every visit re-queries Supabase | **Silent.** The adapter treats the missing binding as ignorable. The site just gets slow. |
| `NEXT_TAG_CACHE_D1` | `revalidatePath` does nothing | **Loud.** Deploy fails with `No D1 binding "NEXT_TAG_CACHE_D1" found!` |

Read [`open-next.config.ts`](../open-next.config.ts) before changing anything
here. The short version: on Vercel these were provided invisibly by the
platform; on Workers they are hand-wired, and skipping them does not error, it
just makes the site slow and the admin console appear to stop publishing.

`wrangler d1 create` offers to add the binding for you and appends a *second*
entry under its own generated name rather than filling in the one already there.
Decline it.

**Verified working 15 Aug 2026:** unpublishing the live trip removed it from
`/`, `/trips`, `/destinations` and `/sitemap.xml` in under five seconds, and
republishing restored it just as fast. That is the D1 tag cache doing its job.
Re-run that check after any change to the adapter, the bindings, or
`src/lib/revalidate.ts` — it is the one regression that hides.

### The variables block is authoritative

A deploy replaces the Worker's entire variable set with exactly what is listed
in `wrangler.jsonc`, **silently deleting anything added through the dashboard**.
Add runtime variables there, not in the UI.

Secrets are stored separately and survive a deploy. Anything not prefixed
`NEXT_PUBLIC_` goes in with `wrangler secret put`:

```bash
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put RESEND_API_KEY
```

`RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` are **deliberately unset** —
see below.

---

## Supabase

**Authentication → URL Configuration**

| Field | Value |
|---|---|
| Site URL | `https://outway.club` |
| Redirect URLs | `https://outway.club/auth/callback` |

Without this, every password-reset and confirmation link emails the user a
`localhost:3000` URL. They will not be able to log in and they will not tell you
why — they will just leave.

**Authentication → SMTP Settings** — so auth mail comes from the domain rather
than Supabase's shared sender, which is rate-limited to a handful an hour and is
explicitly not for production:

| Field | Value |
|---|---|
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | the `RESEND_API_KEY` |
| Sender email | `noreply@outway.club` |
| Sender name | `Outway Club` |

The six email bodies live in
[`supabase-auth-emails.md`](supabase-auth-emails.md), which is their **only**
copy.

---

## Things that differ from Vercel

**Image optimization runs on the Images binding, not on Vercel.** This entry
used to read "image optimization is gone", on the premise that `next/image`
optimization was a Vercel platform feature with no free equivalent on Workers.
That premise was wrong. Cloudflare Image Transformations includes **5,000 unique
transformations per month on the Free plan**, and this site needs roughly 112 —
16 images across 7 `deviceSizes`. A unique transformation is one image at one
set of options for one month, so traffic does not move that number; only adding
images or device sizes does.

`wrangler.jsonc` therefore declares an `images` binding, the OpenNext adapter
routes `/_next/image` through it, and `images.unoptimized` is gone from
`next.config.mjs` — both platforms optimize now.

> **Enable Images for the zone in the Cloudflare dashboard before deploying
> this.** The binding resolves at deploy time regardless, but transformations
> fail at request time when the zone toggle is off, and that takes out every
> image on the site simultaneously.

Uploads are still downscaled in the browser first (`src/lib/resize-image.ts`).
That is not made redundant by the above: resizing once at upload is less work
than resizing on every request and it keeps the storage bill down.

Note that the old advice here — re-upload the homepage hero and the live trip
gallery through the admin editor — had no target. Every image the site
references is a static file in `public/images`; nothing has ever been uploaded
to Supabase Storage.

**Cold starts replace warm lambdas.** Workers start faster than Node lambdas,
but `routePreloadingBehavior` is left at `"none"` because preloading trades cold
start CPU for it, and the free plan meters CPU.

**Cloudflare injects things into responses.** Two known cases, both new since
the move:

- `robots.txt` now carries a Cloudflare "Managed content" block that disallows
  `GPTBot`, `ClaudeBot`, `CCBot`, `Google-Extended`, `Bytespider`, `Amazonbot`
  and others, plus a `Content-Signal` header. Googlebot is untouched, so search
  indexing is unaffected. Turn it off under AI Crawl Control if the file should
  be only what `src/app/robots.ts` emits.
- The Web Analytics beacon (`static.cloudflareinsights.com/beacon.min.js`) is
  injected at the edge, so it arrives whether the CSP allows it or not.
  `next.config.mjs` allows it as of 15 Aug — the script host in `script-src`
  and `cloudflareinsights.com` in `connect-src`, which are two different hosts
  and both are required. Remove either and the beacon loads but reports
  nothing, or is blocked and logs a CSP violation on every page load.

**Razorpay is not configured, and that is intended.** No Razorpay account exists
yet, so both Razorpay secrets are unset on Cloudflare and
`NEXT_PUBLIC_RAZORPAY_KEY_ID` is left empty — that emptiness is what keeps
`isRazorpayConfigured()` false. `site.paymentsEnabled` is `false` besides.
Checkout answers 503 with "Payments aren't switched on yet, please email us";
the webhook and refund routes log and bail. Nothing crashes and nothing needs
stubbing.

> **When Razorpay is switched on, re-test the webhook on Workers before trusting
> it.** Signature verification reads the raw request body, and body handling is
> exactly the sort of thing that differs between Node and workerd. A webhook
> that fails signature checks does not look broken from the outside: the
> customer pays, Razorpay reports success, and the booking is never marked
> confirmed. Send a test event from the Razorpay dashboard at the deployed URL
> and confirm the booking row actually flips.

---

## Rolling back to Vercel

The Vercel project is still deployed and still has the domain attached — it just
shows "Invalid Configuration" because DNS no longer points at it. Keep it until
about **22 August 2026**, then it can be deleted.

To roll back:

1. Cloudflare → Workers & Pages → `outway-club` → Settings → Domains & Routes →
   remove the `outway.club` custom domain.
2. Cloudflare → DNS: add `A @ 216.198.79.1` **grey-cloud (DNS only)** and
   `CNAME www → 311ef17e3ad17a5a.vercel-dns-017.com`, grey-cloud.
3. Disable the www Redirect Rule.

Cloudflare TTLs are short, so this takes seconds. Nothing in the repo needs
reverting — the Cloudflare config is inert on Vercel and `CF_BUILD` is only set
by the `cf:*` scripts.

---

## Checking things yourself

Every provider's status icon is a cached scan and they lie in both directions.
DNS is the only source of truth. Pointing at `8.8.8.8` skips your own cache; on
this machine, **use fully-qualified names or PowerShell**, because the router
appends its own search domain and `nslookup outway.club` silently resolves
`outway.club.iballbatonwifi.com` instead.

```powershell
Resolve-DnsName outway.club -Type NS  -Server 8.8.8.8
Resolve-DnsName outway.club -Type MX  -Server 8.8.8.8
Resolve-DnsName outway.club -Type TXT -Server 8.8.8.8
Resolve-DnsName zmail._domainkey.outway.club  -Type TXT -Server 8.8.8.8
Resolve-DnsName resend._domainkey.outway.club -Type TXT -Server 8.8.8.8
```

```bash
curl -sI https://outway.club | grep -iE "^server|^cf-ray"      # cloudflare
curl -sI https://www.outway.club | grep -iE "^HTTP|^location"  # 301 to apex
curl -s https://outway.club/sitemap.xml | grep -c "<loc>"      # apex URLs only
```

A value coming back means it is published and the dashboard is simply stale.
`NXDOMAIN` means the record is not there.

---

## Gotchas, collected

| Symptom | Cause |
|---|---|
| A source change deployed green but the old behaviour is still live | `deploy` doesn't build. Run `build` first — see [above](#deploying). |
| Canonical/OG/sitemap show the wrong URL | `NEXT_PUBLIC_*` is build-time. Rebuild and redeploy. |
| Site deploys green but never caches; admin appears to stop publishing | `wrangler deploy` was used instead of `opennextjs-cloudflare deploy`, or the KV binding is missing. |
| `No D1 binding "NEXT_TAG_CACHE_D1" found!` | The binding was renamed, or `wrangler d1 create` added a duplicate under a generated name. |
| A variable set in the Cloudflare dashboard vanished | `wrangler.jsonc` `vars` is authoritative and a deploy overwrote it. |
| Mail to `hello@` bounces | An MX record was changed — most likely Cloudflare Email Routing got enabled. |
| App email lands in spam | SPF or DKIM failing. Check **Show original** in Gmail before blaming content. |
| SPF permerror / "too many DNS lookups" | Two SPF records on the root, or `include:_spf.resend.com` added unnecessarily. |
| Zoho's DNS Mapping shows red on every row | Zoho caches its last scan. Verify against DNS itself, then hit Verify and ignore the icon. |
| Zoho DKIM stays red | Nine times in ten the record was never saved. Confirm with `Resolve-DnsName`; `NXDOMAIN` means it isn't there. |
| Password reset links go to localhost | Supabase Site URL not updated. |
| Can't add Zoho to Outlook or iPhone Mail | Correct — the free plan has no IMAP/POP. Use Zoho's webmail or app. |
| `nslookup` returns a bogus SPF record for everything | The router's search domain got appended. Use a trailing dot or `Resolve-DnsName`. |
| Console error about `cloudflareinsights.com` being blocked | The CSP in `next.config.mjs` lost one of the two Cloudflare hosts, or the build predates 15 Aug 2026. |
| Web Analytics dashboard stays empty though the beacon loads | `cloudflareinsights.com` is missing from `connect-src`. The script runs and its POST is blocked. |
| Booking alert didn't arrive in `bookings@` | Check `OPS_EMAIL` in `wrangler.jsonc` — the `vars` block there is what production reads, not `.env.local`. Both addresses are aliases onto one mailbox, so also check whether a filter moved it. |

---

## Change log

**16 August 2026 — deploys moved to CI.**

| | |
|---|---|
| Workers Builds | **Connected** to `Divyam1909/outway-club`, branch `main`, and verified end to end on commit `a2a7626` — 2m 9s from push to a live version. Deploys no longer depend on this laptop. |
| Cross-account | The GitHub account and the Cloudflare account are different Google identities. This needed no collaborator invite: the Cloudflare GitHub App prompts for its own GitHub sign-in. |
| Build variables | All 20 `NEXT_PUBLIC_*` copied into Workers Builds and diffed against `.env.local` — no drift. |
| Non-production branches | Deploy command changed off Cloudflare's pre-filled `npx wrangler versions upload` to `npx opennextjs-cloudflare upload`, for the populate-cache reason already documented for `deploy`. |

Also on 16 Aug: the stale-deploy trap **recurred**, exactly as written up on 15
Aug. `cf:deploy` was run on its own and re-shipped the 15 Aug bundle — green
log, new version ID, old code. Caught only by reading the live sitemap and
noticing `/about` still carried a `lastmod`. Writing the trap down had not been
enough to avoid it; CI running both steps in order is what actually fixes it.

Google Search Console reported the sitemap as `Couldn't fetch`. The URL itself
was fine throughout — 200, valid XML, `application/xml`, no redirect, and
allowed by `robots.txt` — so the status was a stale record of one failed read at
submission time, not a live error. Nothing to fix in code; resubmit and let
Google re-read. Which Google account owns the Search Console property has no
bearing on crawling, indexing or sitemap fetching.

---

**15 August 2026 — the Cloudflare cutover.** Everything below happened on one
day; nothing here predates it.

| | |
|---|---|
| Hosting | Vercel → **Cloudflare Workers**, via `@opennextjs/cloudflare`. Driven by Hobby's ban on commercial use. |
| DNS | Porkbun → **Cloudflare**. Forced, not chosen: a Worker custom domain requires the zone to live in Cloudflare. All thirteen records moved intact. |
| `www` | Vercel redirect → Cloudflare **Redirect Rule** + proxied `AAAA 100::`. |
| SSL | **Full (strict)**, Always Use HTTPS **on**, Universal SSL covering apex and `www`. Port 80 301s to HTTPS; `http://www` reaches `https://` apex in a single hop, not a chain. |
| DNSSEC | Zone signed at Cloudflare, DS entered at Porkbun, **live at the registry**. Done. |
| CSP | Added `static.cloudflareinsights.com` to `script-src` and `cloudflareinsights.com` to `connect-src` so Cloudflare Web Analytics works instead of being blocked. |
| Docs | `production-setup.md` and `cloudflare-deploy.md` merged into this file; `IMPORTANT.md` became [`still-to-do.md`](still-to-do.md). |

Corrected on the same day, having been wrong in the old docs:

- Resend's MX region is **`ap-northeast-1`**, not `ap-south-1`.
- **Always Use HTTPS had never actually been on**, though this table claimed it
  was: port 80 answered 200 with no redirect, leaving every page reachable on
  both schemes. Toggled on the same day and re-checked — now a 301. The lesson
  is that the table recorded an intention, not a measurement.
- `OPS_EMAIL` was left as `hello@outway.club` by the migration, an unintended
  side-effect. Now deliberately `bookings@outway.club` in `wrangler.jsonc`.
  Setting it in `.env.local` does nothing in production: it is read at request
  time on the Worker, from the `vars` block.
- `opennextjs-cloudflare deploy` **does not build**. The old docs implied it
  did.

Learned the same day and written up above: the stale-deploy trap, the two
Cloudflare hosts the CSP needs, Cloudflare's managed `robots.txt` injection, and
the router search-domain problem that makes bare `nslookup` lie on this machine.
