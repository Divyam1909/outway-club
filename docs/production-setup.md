# Production setup

Everything needed to take Outway Club from a Vercel preview URL to
**https://outway.club**, with working company mailboxes.

Domain registered at **Porkbun**. Hosting on **Vercel**. Mailboxes on **Zoho
Mail**. App-sent email through **Resend**. DNS stays at Porkbun — one place to
edit, no nameserver change, nothing to propagate twice.

---

## The shape of it

| Concern | Provider | Why it, and not the others |
|---|---|---|
| Hosting | Vercel | It's Next.js's own platform. Server Components, route handlers, `sitemap.ts`, `robots.ts`, ISR and image optimisation all work with no adapter and no config. |
| DNS | Porkbun | Free, fast, already where the domain lives. |
| Mailboxes | Zoho Mail | 5 free users on one domain. Receives mail people send us. |
| App email | Resend | Sends what the app generates. Already coded in `src/lib/email.ts`. |
| Database / auth / storage | Supabase | Unchanged. |

The email split is the part worth understanding: **Zoho receives, Resend
sends.** Zoho's free plan has no SMTP access, so it *cannot* send on the app's
behalf even if you wanted it to. They coexist on one domain because Resend puts
its MX record on `send.outway.club`, not on the root — MX records only affect
the exact name they sit on, so Zoho keeps the root and nothing collides.

---

## Read this before you start: Vercel Hobby is not licensed for this site

Vercel's Hobby plan is **non-commercial use only**. Their terms define
commercial as any deployment used "for the purpose of financial gain of anyone
involved in any part of the production of the project", and they call out
"any method of requesting or processing payment from visitors of the site" as a
prohibited example.

Outway Club sells trips. Removing the Razorpay checkout does **not** make it
non-commercial — the site exists to book paying travellers, and the booking
request form is the first step of a sale. Vercel also reserves the right to
disable a Hobby project "with or without notice".

**Budget $20/month for Vercel Pro before you point the domain at it.** A
takedown two days before a departure, with travellers holding a booking
reference, is not a risk worth $20.

Everything else below works identically on either plan.

> **Should you use Render or Cloudflare instead?** No. Render would need an
> always-on Node service ($7/mo, and the free tier sleeps — a cold start on a
> trip page is a lost booking), and you'd hand-roll what Vercel gives you.
> Cloudflare Workers needs an adapter and a different runtime, and putting
> Cloudflare's proxy *in front of* Vercel usually just adds a second cache to
> debug. Vercel Pro at $20 is the cheaper answer once your time is priced in.

---

## Order of operations

Do these in order. Steps 3 and 4 both add DNS records, and step 5 checks them
together — going out of order means verifying against records that aren't there
yet.

1. Clear Porkbun's default records
2. Add the domain in Vercel
3. Set up Zoho Mail (receiving)
4. Set up Resend (sending)
5. Add one SPF, one DMARC — the shared-record rules
6. Point Supabase at the new domain
7. Set the environment variables and **redeploy**
8. Verify

---

## 1. Clear Porkbun's defaults

A freshly registered Porkbun domain ships with parking records pointing at
`pixie.porkbun.com`. Left in place they either serve Porkbun's parking page or
block your own records — Porkbun refuses to add an A record for a host that
already has a CNAME or ALIAS on it.

Porkbun → **Domain Management** → `outway.club` → **DNS**.

Delete every default record, specifically:

- Any **ALIAS** or **CNAME** with a blank host (shows as `outway.club`)
- Any **CNAME** on `www`
- Anything pointing at `pixie.porkbun.com`

Leave the domain with an empty record list. You're building it from scratch.

---

## 2. Add the domain in Vercel

Vercel → project → **Settings → Domains** → **Add**.

Add **both**:

- `outway.club`
- `www.outway.club`

Vercel will ask which is primary. Choose **`outway.club`**, and set
`www.outway.club` to **Redirect to `outway.club` (307 → becomes 308
permanent)**. Do the redirect here rather than in `next.config.mjs`: Vercel
handles it at the edge without invoking a function, so it's faster and costs
nothing.

Vercel then shows you the exact DNS records to add. **Copy the values it
displays** — don't use values from a blog post, including this one. The apex IP
in particular is assigned per project and Vercel has more than one.

At the time of writing it shows something like:

| Type | Host | Value |
|---|---|---|
| A | *(blank)* | `216.198.79.1` — **use whatever your dashboard shows** |
| CNAME | `www` | `cname.vercel-dns.com` |

Add both at Porkbun. For the apex A record, leave Porkbun's **Host** field
**blank** — Porkbun appends the domain itself, so typing `outway.club` there
would create `outway.club.outway.club`.

SSL is automatic. Vercel issues a Let's Encrypt certificate once DNS resolves,
usually within minutes. Until then the domain shows "Invalid Configuration" —
that's normal, not an error to fix.

> **Don't skip `www`.** People type it, print it, and paste it into WhatsApp. An
> unconfigured `www` is a dead site for those visitors, and it splits your SEO
> if it ever resolves independently.

---

## 3. Zoho Mail — the mailboxes

Sign up at [zoho.com/mail](https://www.zoho.com/mail/) and pick the **Forever
Free** plan (5 users, 5GB each, one domain). Choose "Sign up with a domain I
already own" and enter `outway.club`.

> **Pick your data centre deliberately.** Zoho asks for a region at signup and
> **it cannot be changed later** without recreating the account. Based in
> Udaipur, choose **India** — you get `zoho.in` hostnames, faster access, and
> data residency in India. Every Zoho hostname below then ends in `.in` rather
> than `.com`. Copy the exact values from your Zoho console; don't assume.

### 3a. Verify the domain

Zoho gives you a TXT record, roughly:

| Type | Host | Value |
|---|---|---|
| TXT | *(blank)* | `zoho-verification=zb********.zmverify.zoho.in` |

Add it at Porkbun, then click Verify in Zoho.

### 3b. Create the mailboxes

Four of your five free seats:

| Address | Purpose |
|---|---|
| `hello@outway.club` | The public address. Shown on the site, in the footer, on legal pages, in structured data, and it's what `EMAIL_FROM` sends as. |
| `bookings@outway.club` | Where booking requests, enquiries and review alerts land (`OPS_EMAIL`). Keeping it separate from `hello@` means an operational alert never gets lost under a general question. |
| `divyam@outway.club` | Your named address — suppliers, hotels, transport partners, invoices. Things that should come from a person, not a shared inbox. |
| `noreply@outway.club` | Supabase's auth sender (password resets, signup confirmation). A real inbox rather than a black hole, so an auto-reply or a bounce has somewhere to land instead of vanishing. |

That leaves one seat spare. Use it for a second person, not for `support@` —
add that as a **free alias** on `bookings@` if you want the address, since
aliases don't consume a user seat.

### 3c. MX records

Zoho shows these under **Domains → DNS Mapping**. For the India DC they read:

| Type | Host | Priority | Value |
|---|---|---|---|
| MX | *(blank)* | 10 | `mx.zoho.in` |
| MX | *(blank)* | 20 | `mx2.zoho.in` |
| MX | *(blank)* | 50 | `mx3.zoho.in` |

Porkbun asks for priority in a separate field — don't put the number inside the
value. If Porkbun appends your domain to the value, add a trailing dot
(`mx.zoho.in.`) to mark it a fully-qualified name.

**Delete any other MX record on the root.** Multiple mail providers on one host
means mail arrives at whichever answers first, which is a coin flip you lose
half the time.

### 3d. Zoho DKIM

Zoho Mail → **Domains → DKIM**. Zoho's default selector is **`zmail`**, so the
host is `zmail._domainkey`:

| Type | Host | Value |
|---|---|---|
| TXT | `zmail._domainkey` | `v=DKIM1; k=rsa; p=MIGfMA0…` *(from Zoho)* |

This signs the mail *you* send from Zoho webmail. It's separate from Resend's
DKIM, which signs what the app sends — different selectors, so both live on the
domain without conflict.

> **The 255-character question.** DNS limits a single TXT *string* to 255
> characters, and a 2048-bit DKIM key overruns that — which is why half the
> internet tells you to split DKIM records into quoted chunks. Zoho issues a
> **1024-bit** key (the value starts `p=MIGfMA0GCSqGSIb3…`), which comes to
> about 234 characters including the `v=` and `k=` prefixes. **It fits in one
> string. Paste it whole, unquoted, exactly as Zoho gives it.** Only reach for
> chunking if a key actually exceeds 255 — Resend's DKIM, for instance.

---

## 4. Resend — what the app sends

Resend → **Domains → Add Domain** → `outway.club`.

Add the **root domain**, not `send.outway.club`. Resend places its MX record on
the `send.` subdomain automatically for bounce handling, which is exactly what
keeps it clear of Zoho, and verifying the root is what lets you send *from*
`hello@outway.club`.

Resend shows three records. Copy them exactly — the DKIM key is unique to you
and the MX region varies:

| Type | Host | Value |
|---|---|---|
| MX | `send` | `feedback-smtp.ap-south-1.amazonses.com` (priority 10) |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` |
| TXT | `resend._domainkey` | `p=MIGfMA0GCSq…` *(from Resend)* |

Note what's happening here:

- The MX on `send.outway.club` is a **different name** from the root, so Zoho's
  MX on `outway.club` is untouched. Both work.
- The SPF also sits on `send.outway.club`, so it doesn't compete with the root
  SPF that Zoho needs. **Do not** add `include:_spf.resend.com` to your root
  SPF — it's redundant and burns one of SPF's ten permitted DNS lookups.
- The DKIM sits on the **root** under the `resend` selector, which is what
  authorises `hello@outway.club` as a from-address.

Then create an API key: **API Keys → Create**, with **Sending access** only.
That's the value for `RESEND_API_KEY`.

---

## 5. One SPF, one DMARC

These two records are the ones people get wrong, because both must be **single
records on the root** and there are now two senders in play.

### SPF — exactly one TXT record on the root

Publishing two SPF records is worse than publishing none: receivers see a
`permerror` and may reject everything. Because Resend's SPF lives on the `send`
subdomain, your root SPF only has to cover Zoho:

| Type | Host | Value |
|---|---|---|
| TXT | *(blank)* | `v=spf1 include:zoho.in ~all` |

(Use `include:zoho.com` if you chose a non-India data centre.)

If you later add another sender that signs from the root — a newsletter tool,
say — **merge it into this one record** rather than adding a second:
`v=spf1 include:zoho.in include:whatever.com ~all`.

### DMARC — start permissive, then tighten

| Type | Host | Value |
|---|---|---|
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:divyam@outway.club; fo=1` |

Start at `p=none`. It changes nothing about delivery and simply asks receivers
to report what they're seeing, which is how you find a misconfiguration before
it costs you a booking confirmation.

Once you've sent real mail through both Zoho and Resend and the reports come
back clean — give it about two weeks — tighten it:

```
v=DMARC1; p=quarantine; rua=mailto:divyam@outway.club; fo=1; pct=100
```

Going to `p=quarantine` or `p=reject` on day one, before you've confirmed both
senders align, is how you end up with your own booking confirmations in
customers' spam folders.

---

## 6. Supabase

Two settings, both under **Project Settings → Authentication**:

**URL Configuration**

| Field | Value |
|---|---|
| Site URL | `https://outway.club` |
| Redirect URLs | `https://outway.club/auth/callback` |

Add `https://*-outway-club.vercel.app/auth/callback` as a second redirect URL if
you want auth to work on preview deploys too.

Without this, every password-reset and confirmation link emails the user a
`localhost:3000` URL. They will not be able to log in and they will not tell you
why — they'll just leave.

**SMTP Settings** — so auth mail comes from your domain rather than Supabase's
rate-limited shared sender (a few per hour, explicitly not for production):

| Field | Value |
|---|---|
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | your `RESEND_API_KEY` |
| Sender email | `noreply@outway.club` |
| Sender name | `Outway Club` |

---

## 7. Environment variables in Vercel

**Settings → Environment Variables**, scoped to **Production**.

| Variable | Production value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://outway.club` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | `hello@outway.club` |
| `EMAIL_FROM` | `Outway Club <hello@outway.club>` |
| `OPS_EMAIL` | `bookings@outway.club` |
| `RESEND_API_KEY` | from Resend |
| `NEXT_PUBLIC_SUPABASE_URL` | from Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | from Supabase — **never** `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_LEGAL_NAME` | `Outway Club` |
| `NEXT_PUBLIC_CONTACT_PHONE` | e.g. `+91 98765 43210` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | digits only, e.g. `919876543210` |
| `NEXT_PUBLIC_BUSINESS_ADDRESS` | full registered address |
| `NEXT_PUBLIC_BUSINESS_CITY` | `Udaipur, Rajasthan` |
| `NEXT_PUBLIC_INSTAGRAM_URL` | `https://instagram.com/outway.club` |

Anything left blank is **omitted** from the site rather than rendered as a
placeholder — that's deliberate (`src/config/site.ts`), so an unset phone number
is invisible, not "TBD".

> ### The one that catches everyone
>
> **`NEXT_PUBLIC_*` variables are baked into the JavaScript bundle at build
> time.** Editing them in Vercel changes nothing on the live site until you
> **redeploy**. If you set `NEXT_PUBLIC_SITE_URL` and your canonical tags, OG
> images, sitemap and email links all still say `localhost:3000` or
> `*.vercel.app`, this is why. Deployments → ⋯ → **Redeploy**.

---

## 8. The complete DNS record set

What Porkbun should look like when you're done:

| Type | Host | Priority | Value | Who needs it |
|---|---|---|---|---|
| A | *(blank)* | — | *(from Vercel)* | Site, apex |
| CNAME | `www` | — | `cname.vercel-dns.com` | Site, www redirect |
| MX | *(blank)* | 10 | `mx.zoho.in` | Receiving |
| MX | *(blank)* | 20 | `mx2.zoho.in` | Receiving |
| MX | *(blank)* | 50 | `mx3.zoho.in` | Receiving |
| MX | `send` | 10 | `feedback-smtp.<region>.amazonses.com` | Resend bounces |
| TXT | *(blank)* | — | `zoho-verification=zb********.zmverify.zoho.in` | Zoho ownership |
| TXT | *(blank)* | — | `v=spf1 include:zoho.in ~all` | SPF — **only one** |
| TXT | `send` | — | `v=spf1 include:amazonses.com ~all` | Resend SPF |
| TXT | `zmail._domainkey` | — | *(from Zoho)* | Zoho DKIM |
| TXT | `resend._domainkey` | — | *(from Resend)* | Resend DKIM |
| TXT | `_dmarc` | — | `v=DMARC1; p=none; rua=mailto:divyam@outway.club; fo=1` | DMARC — **only one** |

Twelve records. The two rows marked "only one" are the ones that break things
when duplicated.

---

## 9. Verify

Work down this list. Each one catches a distinct failure.

**Domain**
- [ ] `https://outway.club` loads over HTTPS with a valid padlock
- [ ] `http://outway.club` redirects to HTTPS
- [ ] `https://www.outway.club` redirects to `https://outway.club`
- [ ] `https://outway.club/sitemap.xml` lists `outway.club` URLs — **not**
      `localhost` or `.vercel.app`. If it doesn't, you didn't redeploy after
      setting `NEXT_PUBLIC_SITE_URL`
- [ ] `https://outway.club/robots.txt` points at the right sitemap
- [ ] View source on the homepage: `<link rel="canonical">` and the OG tags
      say `outway.club`

**Receiving**
- [ ] Mail sent from a personal Gmail to `hello@outway.club` arrives in Zoho
- [ ] Same for `bookings@outway.club`

**Sending — the real test**

Submit a booking request on the live site with your own Gmail address, then:

- [ ] The acknowledgement email arrives at your Gmail
- [ ] The ops alert arrives at `bookings@outway.club`
- [ ] In Gmail, open the acknowledgement → **⋮ → Show original**. You want
      **SPF: PASS**, **DKIM: PASS**, **DMARC: PASS**. Anything else means a DNS
      record is wrong, and mail will start landing in spam as volume grows
- [ ] It is **not** in the spam folder
- [ ] Reply to it — the reply lands in `hello@outway.club`

**Auth**
- [ ] Request a password reset; the mail comes from `noreply@outway.club`
- [ ] The link goes to `outway.club`, not `localhost:3000`

**Search**
- [ ] Domain property verified in Google Search Console (section 10)
- [ ] `https://outway.club/sitemap.xml` submitted and reporting Success

---

## 10. Google Search Console

Until this is done Google has no reason to look at the site, and you have no way
to tell whether it has. Everything else in this document is plumbing that works
whether or not anyone finds you; this is the part that decides whether anyone
does.

### 10a. Verify ownership

Two methods. **Use the first.**

**Domain property (DNS TXT) — recommended.** Covers the apex, `www`, every
subdomain and both http and https in one property, and it survives redeploys.

1. [search.google.com/search-console](https://search.google.com/search-console)
   → **Add property** → choose the **Domain** box (the left one, not "URL
   prefix").
2. Enter `outway.club` — no `https://`, no `www`.
3. Google shows a TXT record like
   `google-site-verification=AbC123...`.
4. Porkbun → DNS → add: **Type** TXT, **Host** blank, **Value** the whole
   string Google gave you.
5. Wait a minute or two, then click **Verify**.

You already have TXT records on the root (SPF, Zoho verification). That is
fine — unlike SPF, multiple unrelated TXT records on one host are normal and do
not conflict.

If verification fails on the first try, check the record actually published
before touching anything in the dashboard:

```bash
nslookup -type=txt outway.club 8.8.8.8
```

```powershell
Resolve-DnsName outway.club -Type TXT -Server 8.8.8.8
```

**URL-prefix property (HTML tag) — the fallback.** Only if DNS is somehow not an
option. Google gives you a `<meta name="google-site-verification" content="…">`
tag; the app renders it for you — set the **token only**, not the whole tag:

```
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=AbC123...
```

in Vercel → Settings → Environment Variables (Production), then **redeploy**.
`NEXT_PUBLIC_*` is baked in at build time, so the tag will not appear until you
do — and Google will report verification failed. Same applies to
`NEXT_PUBLIC_BING_SITE_VERIFICATION` for Bing Webmaster Tools.

Verify it landed:

```bash
curl -s https://outway.club | grep google-site-verification
```

### 10b. Submit the sitemap

Search Console → **Sitemaps** → enter `sitemap.xml` → **Submit**.

Status should read **Success** with a discovered-URL count matching what
`https://outway.club/sitemap.xml` lists. "Couldn't fetch" almost always means it
was submitted against an unverified property, or with the full URL typed into a
field that wants the path.

### 10c. Ask for the homepage to be crawled

**URL Inspection** → paste `https://outway.club/` → **Request indexing**. Do the
same for `/trips` and the live trip page. This is a nudge, not a guarantee, and
the quota is a few per day — spending it on the three pages that matter beats
spending it on `/terms`.

### 10d. What to expect

Indexing takes days to a few weeks for a brand-new domain with no inbound links.
That is normal and there is no way to buy speed here. What actually moves it:

- **Inbound links.** One real link from a site Google already crawls does more
  than any on-page change. The Instagram bio link is the obvious first one.
- **Content.** One trip and one journal post is very little surface area. Pages
  are what rank; there is no substitute.
- **Google Business Profile.** For a travel business with a physical base in
  Udaipur this is worth more than most SEO work, and it is free.

Check back in **Search Console → Pages** after a week or two. "Crawled –
currently not indexed" on a thin page is expected early on, not a bug to chase.

> Bing is a ten-minute job once Google is done: Bing Webmaster Tools can import
> the whole property straight from Search Console. It is a small share of Indian
> search traffic, but it is also nearly free to claim.

---

## Gotchas, collected

| Symptom | Cause |
|---|---|
| Canonical/OG/sitemap still show the old URL | `NEXT_PUBLIC_*` is build-time. Redeploy. |
| Mail to `hello@` bounces | MX still pointing somewhere else, or Porkbun mangled the value — add a trailing dot. |
| App email lands in spam | SPF or DKIM failing. Check **Show original** in Gmail before blaming content. |
| "Too many DNS lookups" / SPF permerror | Two SPF records on the root, or `include:_spf.resend.com` added unnecessarily. There must be exactly one, and it only needs Zoho. |
| Porkbun won't accept the apex A record | A leftover ALIAS/CNAME with a blank host. Delete it. |
| Vercel says "Invalid Configuration" | DNS hasn't propagated. Wait; it's usually minutes, up to 48h worst case. |
| Vercel shows "Failed To Generate Cert" on a domain that loads fine | A stale job status. Issuance for `www` fails if its CNAME hadn't propagated when Vercel first tried; the retry succeeds but the badge doesn't clear. Check the actual certificate (below) and hit **Refresh**. |
| `Cannot find module 'tailwindcss'` after any `npm install` | Your shell has `NODE_ENV=production`, so npm silently pruned devDependencies — and with `typescript` gone, `@/*` path aliases stop resolving too, producing a wall of "Can't resolve '@/components/…'". Fix: `NODE_ENV=development npm install --include=dev`. Never pass `NODE_ENV=development` to `next build` itself — that breaks `/404` prerendering with a misleading `<Html> should not be imported` error. |
| Zoho hostnames don't match this doc | You picked a non-India data centre. Use the values in your console, not these. |
| Zoho's DNS Mapping shows red ❗ on every row | Zoho caches its last scan and doesn't re-check on page load. Verify against DNS itself before believing it: `nslookup -type=txt zmail._domainkey.outway.club 8.8.8.8`. If the record resolves, hit Verify in Zoho and ignore the icon. |
| Zoho DKIM stays red after adding it | Nine times out of ten the record was never saved — the Porkbun dialog was filled in but **Add** was never clicked. Confirm with the `nslookup` above; `NXDOMAIN` means it isn't there. |
| Password reset links go to localhost | Supabase Site URL not updated. |
| Can't add Zoho to Outlook or the iPhone Mail app | Correct — the free plan has no IMAP/POP. Use Zoho's own webmail and mobile app, or upgrade to Mail Lite. |

### Check DNS yourself, not the dashboard

Every provider's status icon is a cached scan, and they lie in both directions.
DNS is the only source of truth. Pointing at `8.8.8.8` forces Google's resolver
so you skip your own cache:

```bash
nslookup -type=txt zmail._domainkey.outway.club 8.8.8.8   # Zoho DKIM
nslookup -type=txt outway.club 8.8.8.8                    # SPF + Zoho verification
nslookup -type=mx  outway.club 8.8.8.8                    # mail routing
nslookup -type=txt resend._domainkey.outway.club 8.8.8.8  # Resend DKIM
```

PowerShell equivalent, if you prefer structured output:

```powershell
Resolve-DnsName zmail._domainkey.outway.club -Type TXT -Server 8.8.8.8
```

A value coming back means it's published and the dashboard is simply stale.
`NXDOMAIN` means the record isn't there — go add it.

---

## Running costs

| Item | Cost |
|---|---|
| Domain (Porkbun) | ~$12/yr, whatever `.club` renews at |
| Vercel Pro | **$20/mo — required, see the note at the top** |
| Zoho Mail | Free (5 users, 1 domain) |
| Resend | Free to 3,000 emails/month, 100/day |
| Supabase | Free tier, until you outgrow it |

Roughly **$21/month**, essentially all of it Vercel.

---

## Still open

- **Payments.** Being removed separately. When checkout is switched back on,
  `site.paymentsEnabled` flips to `true` and the Razorpay webhook needs
  re-pointing at `https://outway.club/api/razorpay/webhook`, with the new
  secret in `RAZORPAY_WEBHOOK_SECRET`. Razorpay activation also requires a
  published phone number and registered address, which is why those env vars
  are worth filling in now.
- **Email volume.** Resend's free tier is 100/day. Fine now; watch it if a
  departure fills fast.
- **DMARC.** Move from `p=none` to `p=quarantine` about two weeks after launch,
  once the reports are clean.
