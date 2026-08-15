# Real photography goes here

Drop files in with **exactly** these names and every page picks them up with no
code change. Every slot below is filled with real photography — there are no
placeholders left.

```
public/images/
  escape-001/
    hero.jpg         16:9  ≥2400px   homepage hero, trip hero, login panel, OG preview
    gallery-1.jpg     4:3  ≥1600px   homepage "what you'll remember"
    gallery-2.jpg    16:9  ≥2000px   about page banner, trip gallery, Journal season figure
    gallery-3.jpg     4:5  ≥1400px   about page portrait, trip gallery
    gallery-4.jpg     1:1  ≥1200px   trip gallery thumbnail
    gallery-5.jpg     1:1  ≥1200px   trip gallery thumbnail
  udaipur/
    hero.jpg         16:9  ≥2400px   destination page banner
    gallery-1.jpg     1:1  ≥1200px   destination grid
    gallery-2.jpg     1:1  ≥1200px
    gallery-3.jpg     1:1  ≥1200px
    gallery-4.jpg     1:1  ≥1200px
  blog/udaipur-travel-guide/
    cover.jpg        16:9  ≥2048px   article cover, OG card, featured card on /blog
    01-city-palace.jpg       4:5     "The City Palace" section
    02-pichola-dusk.jpg     16:9     "Lake Pichola at last light"
    03-old-city-lane.jpg     4:5     "The old city is the sight"
    04-thali.jpg             1:1     "What to eat in Udaipur"
```

## Sizing, and why the numbers differ

The cover is rendered into a hard `aspect-[16/9]` box with `object-cover`, so it
has to be 16:9 or it gets cropped for you. Article body images are not aspect
constrained (`.post-prose img` is `h-auto`), so portrait figures are fine there
and are used deliberately to break up a run of landscapes.

The body column is `max-w-[42rem]` — about 672px — so body images only need
roughly 1400px on the long edge to stay crisp on a 2× screen. The cover column
caps at 1024px CSS, so ~2048px is the useful ceiling. Anything beyond that is
bytes with no visible payoff.

## Journal images are not switched on by dropping the file in

The article body lives in Postgres, not in the repo. To change which file a
figure points at, edit the `<img src>` paths and `cover_image` in
`supabase/seed-blog.sql`, then re-run:

```bash
node scripts/db.mjs supabase/seed-blog.sql
```

It upserts on slug and keeps the original publish date. The HTML there is kept
inside the same tag allowlist the admin editor sanitises against
(`src/lib/sanitize-html.ts`), so re-saving the post from the admin console does
not silently strip anything.

## House style

Full-frame camera, 35mm or 50mm prime, natural light only. Warm, slightly
desaturated grade — deep green and terracotta in the palette, creamy off-white
highlights, film-like grain, gentle contrast. Editorial travel photography
rather than tour brochure: no HDR, no oversaturated skies, no lens flare, no
text or logos in frame. People appear mid-activity and unposed, never looking at
the camera.

Everything is **mid-August monsoon in Rajasthan**: green Aravallis, heavy skies,
wet stone, full lakes. That season is the whole pitch of Escape 001 and the
argument of the Journal's first article, so don't substitute dry golden-hour
desert imagery — it would misrepresent what travellers actually get.

## Before you upload

- Export as JPEG, quality ~82, sRGB. Next.js re-encodes to AVIF/WebP on
  delivery, so oversized sources only slow the build down.
- Keep each file under about 1.5MB.
- Strip GPS EXIF from anything shot on a phone.
- Keep unprocessed originals in `raw-images/` — it is gitignored, and the
  filenames there follow a `<set>-<slot>-<subject>.png` convention worth
  continuing.

## Related

For photos you want to change without a redeploy, use the uploader in the admin
trip editor (Admin → Trips → edit → Content). That writes to Supabase Storage
and updates the database directly.

Branded pine-green fallback panels can be regenerated with
`node scripts/generate-placeholders.mjs`. It now skips any path that already
has a file, so it will not overwrite the real photography — pass `--force` if
you genuinely want the placeholders back.

Brand assets (`public/brand/`, `src/app/icon.png`, `apple-icon.png`) are
generated, never shot — replace `assets/brand/outway-logo.png` and re-run
`node scripts/build-brand-assets.mjs assets/brand/outway-logo.png`.
