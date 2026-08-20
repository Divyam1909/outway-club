# Real photography goes here

Drop files in with **exactly** these names and every page picks them up with no
code change.

**The `jawai/`, `jodhpur/` and `outway/` sets are branded placeholders, not
photography.** They are real JPEGs at the right size, so nothing 404s and no
layout moves when they are replaced — but they are generated panels. The
detailed shot list, one paragraph per image, is in **`image.md` at the repo
root**. That is the file to work from. The `udaipur/`, `escape-001/` and
`blog/` sets are real.

```
public/images/
  jawai/                                       ← PLACEHOLDER, see image.md
    hero.jpg         16:9  ≥2400px   Escape 001 hero, homepage hero, OG preview
    gallery-1.jpg     4:3  ≥1600px   Rabari shepherd country
    gallery-2.jpg    16:9  ≥2000px   open jeep, late light — first in the trip gallery
    gallery-3.jpg     4:5  ≥1400px   leopard on the granite, distant
    gallery-4.jpg     1:1  ≥1200px   chai at sunset
    gallery-5.jpg     1:1  ≥1200px   The Story Circle
    gallery-6.jpg     1:1  ≥1200px   Jawai Bandh
  jodhpur/                                     ← PLACEHOLDER, see image.md
    hero.jpg         16:9  ≥2400px   Escape 002 hero (unpublished; brochure only for now)
    gallery-1.jpg     4:3  ≥1600px   old city lanes
    gallery-2.jpg     1:1  ≥1200px   Toorji Ka Jhalra
    gallery-3.jpg     1:1  ≥1200px   on the table
    gallery-4.jpg     1:1  ≥1200px   Jaswant Thada
  outway/                                      ← PLACEHOLDER, see image.md
    the-table.jpg    16:9  ≥2000px   About page banner. Not a place — the brand argument
    story-circle.jpg  4:5  ≥1400px   About page portrait
    the-letter.jpg    1:1  ≥1200px
    the-road.jpg     16:9  ≥2000px   About page, the long-term-model section
  udaipur/
    hero.jpg         16:9  ≥2400px   destination page banner, hero fallback
    gallery-1.jpg     1:1  ≥1200px   destination grid, Escape 001 gallery
    gallery-2.jpg     1:1  ≥1200px
    gallery-3.jpg     1:1  ≥1200px   Escape 001 gallery
    gallery-4.jpg     1:1  ≥1200px
  escape-001/                    ← legacy folder name: this is the Mount Abu
    hero.jpg         16:9  ≥2400px    shoot, which belongs to Escape 003 since
    gallery-1.jpg     4:3  ≥1600px    the August 2026 renumbering. The path is
    gallery-2.jpg    16:9  ≥2000px    left alone because the Journal and an
    gallery-3.jpg     4:5  ≥1400px    unpublished trip row both point at it.
    gallery-4.jpg     1:1  ≥1200px
    gallery-5.jpg     1:1  ≥1200px
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

Season is not decoration. The Jawai, Udaipur and `outway/` sets are **early
September, the tail of the monsoon**: green Aravallis and green grass on the
granite, heavy skies, wet stone, full lakes and a full dam. That season is the
whole pitch of Escape 001 and the argument of the Journal's first article, so
don't substitute dry golden-hour desert imagery — it would misrepresent what
travellers actually get. The Jodhpur set is **late October, post-monsoon**: dry
clear light, warm dust, hard shadows. Don't mix the two.

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
`node scripts/generate-placeholders.mjs`. It skips any path that already has a
file, so it will not overwrite real photography — pass `--force` if you
genuinely want the placeholders back. Its `TARGETS` list and the shot list in
`image.md` describe the same slots at the same sizes; change one and change the
other, or a real photograph will land in a differently shaped box.

Brand assets (`public/brand/`, `src/app/icon.png`, `apple-icon.png`) are
generated, never shot — replace `assets/brand/outway-logo.png` and re-run
`node scripts/build-brand-assets.mjs assets/brand/outway-logo.png`.
