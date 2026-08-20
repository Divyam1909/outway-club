# Real photography goes here

Drop files in with **exactly** these names and every page picks them up with no
code change.

Every slot below holds an image. Nothing here is a placeholder panel any more.

The `jawai/`, `jodhpur/` and `outway/` sets were **generated with an image
model** on 20 Aug 2026 rather than shot on a departure. They are stand-ins good
enough to ship, not the real thing — replace them with photographs from a real
departure when there are some, starting with `outway/`, which is the set that
is meant to show actual travellers.

```
public/images/
  jawai/
    hero.jpg         16:9  ≥2400px   Escape 001 hero, homepage hero, OG preview
    gallery-1.jpg     4:3  ≥1600px   Rabari shepherd country
    gallery-2.jpg    16:9  ≥2000px   open jeep, late light — first in the trip gallery
    gallery-3.jpg     4:5  ≥1400px   leopard on the granite, distant
    gallery-4.jpg     1:1  ≥1200px   chai at sunset
    gallery-5.jpg     1:1  ≥1200px   The Story Circle
    gallery-6.jpg     1:1  ≥1200px   Jawai Bandh
  jodhpur/
    hero.jpg         16:9  ≥2400px   Escape 002 hero (unpublished; brochure only for now)
    gallery-1.jpg     4:3  ≥1600px   old city lanes
    gallery-2.jpg     1:1  ≥1200px   Toorji Ka Jhalra
    gallery-3.jpg     1:1  ≥1200px   on the table
    gallery-4.jpg     1:1  ≥1200px   Jaswant Thada
  outway/
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

Don't hand-export. Put the unprocessed original in `raw-images/` — gitignored —
named `<set>-<slot>-<subject>.png`, add a line for it to `SLOTS` in
[`scripts/import-photography.mjs`](../../scripts/import-photography.mjs) if it
is a new slot, and run:

```bash
npm run images:import           # every slot
npm run images:import jawai     # only paths matching "jawai"
```

For a frame that came out of an image model rather than a camera, run
`npm run images:clean` **first**. It inverts the generator's corner mark — a
white shape composited at a known opacity and a fixed inset, so the blend is
undone algebraically rather than painted over — and banks the untouched
original in `raw-images/_originals/`, which is where re-runs read from. See
[`scripts/clean-generated-mark.mjs`](../../scripts/clean-generated-mark.mjs)
for what it measures and where it stops being exact.

That crops to the exact ratio the layout wants, trims any white print border
the source came with, and writes a stripped sRGB JPEG at quality 82 — which
also means GPS EXIF never reaches the repo, because sharp only carries metadata
through when it's asked to. Sources are centre-cropped rather than squashed, so
frame to the ratio in the list above and nothing of yours gets cut.

If you do export by hand instead: JPEG, quality ~82, sRGB, under about 1.5MB,
EXIF stripped. Next.js re-encodes to AVIF/WebP on delivery, so anything larger
only slows the build down.

## Related

For photos you want to change without a redeploy, use the uploader in the admin
trip editor (Admin → Trips → edit → Content). That writes to Supabase Storage
and updates the database directly.

Branded pine-green fallback panels can be regenerated with
`node scripts/generate-placeholders.mjs`. It skips any path that already has a
file, so it will not overwrite real photography — pass `--force` if you
genuinely want the placeholders back. Its `TARGETS` list, the `SLOTS` list in
`scripts/import-photography.mjs` and the paths above all describe the same
slots at the same sizes. Change one and change the others, or a photograph
lands in a differently shaped box.

Brand assets (`public/brand/`, `src/app/icon.png`, `apple-icon.png`) are
generated, never shot — replace `assets/brand/outway-logo.png` and re-run
`node scripts/build-brand-assets.mjs assets/brand/outway-logo.png`.
