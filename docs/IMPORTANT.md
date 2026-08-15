# Still blank

Every value below is missing from **Vercel → Production**, verified against the
live site on 15 Aug 2026. Nothing here is broken — `src/config/site.ts` omits
anything unset rather than printing a placeholder — but each one is something a
customer can't see or you can't be reached by.

**All of these are `NEXT_PUBLIC_`, so setting them in Vercel does nothing until
you redeploy.** Set them in `.env.local` too if you want them locally.

---

## 1. How people pay you — nothing is shown at all

Online checkout is off (`site.paymentsEnabled = false`), so the plan is UPI or
bank transfer arranged by hand. The site has a "Payment details" block built for
exactly that, and **it is currently hidden**, because it refuses to render on
partial data — a half-filled account number sends someone's money nowhere.

Right now a customer gets through the whole booking request and sees no way to
pay. They only find out when you email them back.

Set **either** the UPI ID **or** all four bank fields. Both is better.

| Variable | Format |
|---|---|
| `NEXT_PUBLIC_UPI_ID` | `yourname@okhdfcbank` |
| `NEXT_PUBLIC_BANK_ACCOUNT_NAME` | Exact name on the account |
| `NEXT_PUBLIC_BANK_NAME` | e.g. `HDFC Bank, Udaipur` |
| `NEXT_PUBLIC_BANK_ACCOUNT_NUMBER` | Full number |
| `NEXT_PUBLIC_BANK_IFSC` | e.g. `HDFC0001234` |

Shows on: trip page and booking page, in the payment block.
Logic: `hasPaymentDetails()` in `src/config/site.ts`.

---

## 2. Phone and WhatsApp — email is your only channel

| Variable | Format | What appears when set |
|---|---|---|
| `NEXT_PUBLIC_CONTACT_PHONE` | `+91 98765 43210` | Contact page, a `tel:` link, `telephone` in the `TravelAgency` structured data, and "or call …" in the booking acknowledgement email |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `919876543210` — digits only, country code, no `+` or spaces | WhatsApp buttons across the site |

Both blank today. The acknowledgement email currently ends "In a hurry? Write to
hello@outway.club" with no phone option, and there is no WhatsApp button
anywhere — which is the channel most Indian travellers reach for first.

**Also required for Razorpay activation** when checkout comes back on: a
reachable phone number must be published on the site.

---

## 3. Registered address and GSTIN

| Variable | Format | Notes |
|---|---|---|
| `NEXT_PUBLIC_BUSINESS_ADDRESS` | Full registered address | Blank falls back to `NEXT_PUBLIC_BUSINESS_CITY`, which **is** set (`Udaipur, Rajasthan`). So the site shows a city, not an address. |
| `NEXT_PUBLIC_GSTIN` | 15-character GSTIN | Blank means no GSTIN on the legal pages or invoices. Only needed once registered. |

Shows on: contact page, terms, privacy, footer, structured data.
**Also required for Razorpay activation.**

---

## 4. Search engine verification

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Search Console → Settings → Ownership verification → HTML tag. **Paste the bare token, not the whole `<meta>` tag.** |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | Bing Webmaster Tools → the `msvalidate.01` value |

Neither is set, so no verification tag renders. You can skip both entirely by
verifying with a **DNS TXT record at Porkbun instead** — better anyway, since it
survives redeploys and covers every subdomain. If you go the DNS route, leave
these blank on purpose.

The sitemap is live at `https://outway.club/sitemap.xml` and already includes
the Journal post. It just hasn't been submitted yet.

---

## 5. Optional

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_YOUTUBE_URL` | Blank hides the YouTube link in the footer and drops it from `sameAs` in structured data. Set it when there's a channel. |

Instagram is already set and live.

---

## Not a placeholder, but still open

- **Vercel Pro ($20/mo).** The Hobby plan is licensed for non-commercial use
  only, and Vercel can disable a project without notice. See
  [`docs/production-setup.md`](docs/production-setup.md).
- **`npm audit`** — 4 high-severity advisories in `sharp` via libvips. The fix
  is `next@16`, a breaking upgrade. Post-launch work.
- **DMARC** is at `p=none`. Move to `p=quarantine` about two weeks after launch,
  once the reports at `divyam@outway.club` come back clean.
- **Test data** left in place deliberately: the `Demo Traveller` trip request and
  the `demoaccdn02@gmail.com` account. Password `Udaipur-Monsoon-2026!`.
  `scripts/cleanup-test-data.mjs` removes them when you're done.

---

## Already done, for reference

Domain, DNS, mail and delivery are complete and verified — apex + `www` on
Vercel with valid certificates, Zoho receiving on `hello@` / `bookings@`, Resend
sending, and a real booking request delivered end to end with **SPF, DKIM and
DMARC all passing** at Gmail.
