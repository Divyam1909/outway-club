# Image prompt pack

Every image the site expects, what it is for, whether it exists yet, and a
paragraph prompt for the ones still outstanding.

This file supersedes the earlier `photography-prompts.md`. Paths here are the
build-time defaults in `public/images/`; anything you would rather swap later
without a deploy can go through the admin trip editor instead (Admin → Trips →
edit → Content), which writes to Supabase Storage.

Everything is written for **mid-August monsoon in Rajasthan**: green Aravallis,
heavy skies, wet stone, full lakes. That season is the whole pitch of Escape
001 and the argument of the Journal's first article, so please don't substitute
dry golden-hour desert imagery — it would misrepresent what travellers get.

---

## House style — apply to every prompt below

Shot on a full-frame camera with a 35mm or 50mm prime, natural light only, no
flash. Warm, slightly desaturated colour grade with deep green and terracotta
in the palette and creamy off-white highlights, film-like grain, gentle
contrast. Editorial travel photography — the register of a good magazine
feature rather than a tour brochure. No HDR, no oversaturated skies, no lens
flares, no text or watermarks or logos anywhere in the frame. People appear
mid-activity and unposed, never looking at the camera and never arranged in a
line. Where faces appear they should read as Indian travellers in their
twenties and thirties in ordinary contemporary clothing. No readable signage in
any frame.

---

## Manifest

**Status** is `shot` (real photo in place), `placeholder` (branded pine panel
shipping at that path, needs replacing), or `missing` (nothing there yet).

### Escape 001 — trip photography

| File | Aspect | Min width | Used on | Status |
|---|---|---|---|---|
| `escape-001/hero.jpg` | 16:9 | 2400px | Homepage hero, trip hero, login panel, OG preview | shot |
| `escape-001/gallery-1.jpg` | 4:3 | 1600px | Homepage "what you'll remember" | shot |
| `escape-001/gallery-2.jpg` | 16:9 | 2000px | About banner, trip gallery | shot |
| `escape-001/gallery-3.jpg` | 4:5 | 1400px | About portrait, trip gallery | **placeholder** |
| `escape-001/gallery-4.jpg` | 1:1 | 1200px | Trip gallery thumbnail | shot |
| `escape-001/gallery-5.jpg` | 1:1 | 1200px | Trip gallery thumbnail | shot |

### Udaipur — destination photography

| File | Aspect | Min width | Used on | Status |
|---|---|---|---|---|
| `udaipur/hero.jpg` | 16:9 | 2400px | Destination page banner | shot |
| `udaipur/gallery-1.jpg` | 1:1 | 1200px | Destination grid | **placeholder** |
| `udaipur/gallery-2.jpg` | 1:1 | 1200px | Destination grid | shot |
| `udaipur/gallery-3.jpg` | 1:1 | 1200px | Destination grid | shot |
| `udaipur/gallery-4.jpg` | 1:1 | 1200px | Destination grid | shot |

### The Journal — editorial photography

None of these exist yet. The Udaipur article currently borrows from the
destination set above, which works but has two weaknesses: its longest section
(the City Palace) has no image at all, and two of its four figures are both
boats on the lake. `0003_blog.sql` deliberately keeps editorial photography in
its own storage bucket, so these get their own folder.

| File | Aspect | Min width | Used on | Status |
|---|---|---|---|---|
| `blog/udaipur-travel-guide/cover.jpg` | 16:9 | 2400px | Article cover, OG card, featured card on `/blog` | missing |
| `blog/udaipur-travel-guide/01-city-palace.jpg` | 16:9 | 2000px | "The City Palace" section | missing |
| `blog/udaipur-travel-guide/02-pichola-dusk.jpg` | 16:9 | 2000px | "Lake Pichola at last light" | missing |
| `blog/udaipur-travel-guide/03-old-city-lane.jpg` | 4:5 | 1400px | "The old city is the sight" | missing |
| `blog/udaipur-travel-guide/04-thali.jpg` | 1:1 | 1200px | "What to eat in Udaipur" | missing |

> Dropping these files in does **not** switch them on by itself — the article
> body is stored in Postgres. Update the `<img src>` paths and `cover_image` in
> `supabase/seed-blog.sql`, then re-run
> `node scripts/db.mjs supabase/seed-blog.sql`. It upserts on slug and keeps the
> original publish date.

### Trip captains — optional

`src/config/trip-captains.ts` reads portraits from `/images/team/<name>.jpg`
(1:1, ≥800px). The folder does not exist and nothing references a real file
yet, so this is only needed if you want a face on the captain block.

### Brand assets — generated, never shot

`public/brand/logo.png`, `logo.jpg`, `og-default.png`, `src/app/icon.png` and
`src/app/apple-icon.png` are all produced from the master artwork by
`node scripts/build-brand-assets.mjs assets/brand/outway-logo.png`. Don't
photograph or hand-edit these; replace the master and re-run.

---

## Prompts — outstanding placeholders

### `escape-001/gallery-3.jpg` — Dilwara marble (4:5 portrait)

A vertical interior detail of intricately carved white marble inside a
900-year-old Jain temple in the Dilwara style — a ceiling dome and one
supporting pillar covered edge to edge in extraordinarily fine floral and
figurative relief carving, the marble worked so thin in places that daylight
glows softly through it. Cool diffuse daylight entering from a single side, no
artificial light anywhere, deep soft shadows pooling in the recesses of the
carving so the relief reads three-dimensionally rather than flat. Composed
looking upward and slightly off-centre so the dome fills the upper two thirds
of the frame and the pillar anchors the lower left. Absolutely no people in
the frame and no barriers, ropes or signage. Shot at 35mm on a full-frame
camera, natural light, very high detail in the carving, restrained contrast, a
warm-neutral grade with the marble reading as soft ivory rather than clinical
white. No text, no logos.

### `udaipur/gallery-1.jpg` — the ghat steps (1:1 square)

A close, quiet detail of a stepped stone ghat descending into lake water in
Udaipur after monsoon rain, framed square and shot slightly downward from
standing height. The lowest three or four steps are submerged and the water is
still enough to hold a soft reflection; the wet stone above the waterline is
dark, worn concave in the middle from centuries of use, and textured with
lichen at the edges. A scattering of loose marigold petals floats on the
surface and a few more lie pressed against the wet stone. Soft flat overcast
light, no direct sun, no people and no boats in the frame — this is a texture
and detail shot, not a view. Shot at 50mm, muted warm grade, gentle film
grain, shallow falloff toward the corners. No text, no logos.

---

## Prompts — the Journal, Udaipur article

### `blog/udaipur-travel-guide/cover.jpg` — the city at dusk (16:9)

A wide elevated view over the old city of Udaipur at blue hour during monsoon,
photographed from a rooftop looking across a dense field of whitewashed and
pale ochre buildings toward Lake Pichola, with the floodlit City Palace complex
glowing warm amber along the far edge of the water. Small warm lights are
coming on across the rooftops in the middle distance. The sky is heavy layered
monsoon cloud in slate blue and warm grey with a thin band of fading apricot
light low on the horizon, and green Aravalli hills close the view on both
sides. The lake is full and calm. Generous unbroken sky across the upper third
so a headline can sit over it. Shot at 35mm, blue-hour natural light, warm
shadows, film grain, no people prominent in the foreground. No text, no logos.

### `blog/udaipur-travel-guide/01-city-palace.jpg` — inside the palace (16:9)

An interior courtyard or upper gallery inside the City Palace complex in
Udaipur, photographed to show the way the building stacks rather than any
single decorative object — scalloped arches receding in layers, a narrow
staircase cut awkwardly into thick wall, inlaid mirror or coloured glass
catching light in one recess. Daylight enters from one side through a carved
stone screen and falls in a hard patch across the floor, leaving the rest of
the frame in soft shade. In the middle distance a single arched window frames a
small bright rectangle of the lake beyond, deliberately rationing the view. One
or two unposed visitors, small in the frame and facing away, for scale. Shot at
35mm, natural light only, warm desaturated grade, deep but open shadows, film
grain. No flash, no text, no signage, no logos.

### `blog/udaipur-travel-guide/02-pichola-dusk.jpg` — the half-five boat (16:9)

A view across Lake Pichola from low boat-level at the very end of the light
during monsoon, water filling the bottom third of the frame and reflecting the
sky. In the middle distance a traditional wooden passenger boat with a shallow
canopy moves slowly left to right, its occupants silhouetted rather than
detailed. Beyond it the pale marble of an island palace sits low on the water,
and the far shore carries the warm amber line of the City Palace just after its
lights have come on. The sky is broken monsoon cloud in deep blue-grey with one
band of soft apricot near the horizon; the green hills behind are already going
to silhouette. Calm water, long soft reflections. Shot at 50mm, natural light,
warm film grade, gentle grain, no lens flare. No text, no logos.

### `blog/udaipur-travel-guide/03-old-city-lane.jpg` — after rain (4:5 portrait)

A vertical frame looking down a narrow lane in Udaipur's old city immediately
after monsoon rain, the flagstones underfoot wet enough to throw a dark mirror
reflection of the walls above. Whitewashed and pale ochre buildings press in
from both sides with faded blue and green painted doors, a carved wooden
balcony overhanging on the right, clay pots stacked on a step, laundry and
textiles hanging out to dry. A single figure in a bright sari walks away from
the camera at the middle distance, small in the frame and off-centre, giving
the lane depth. Overcast diffuse light with no hard shadows, so the colour of
the doors and the textiles carries the frame. Shot at 35mm, warm desaturated
grade, film grain. No readable signage, no text, no logos.

### `blog/udaipur-travel-guide/04-thali.jpg` — a working thali (1:1 square)

An overhead square-format detail of a Rajasthani thali served on a worn brass
plate on a dark wooden table — small steel bowls holding dal, a pale kadhi, a
seasonal vegetable and cumin-flecked curd, a spoonful of red chilli pickle,
plain rice, a wedge of lime, and two hot bajra rotis brushed with ghee and
blistered from the griddle. Lit by soft window light entering from one side so
the brass reads warm and the far edge of the plate falls gently into shade.
Half a forearm and hand entering the frame at the lower edge, mid-serve, with
simple everyday bangles, unposed. Shot from directly above at 50mm, natural
light only, warm rich grade, shallow falloff at the corners, film grain. No
branding on any vessel, no napkins or cutlery styled in, no text, no logos.

---

## Before you upload

- Export as JPEG, quality ~82, sRGB. Next.js re-encodes to AVIF/WebP on
  delivery, so oversized source files only slow the build down.
- Keep each file under about 1.5MB.
- Strip GPS EXIF from anything shot on a phone before publishing.
- Keep the unprocessed originals in `raw-images/` — it is gitignored, and the
  filenames there already follow a `<set>-<slot>-<subject>.png` convention
  worth continuing.
- Until a file exists the site renders a branded pine-green panel with the
  Outway mark rather than a broken image, so a partial drop still looks
  deliberate.
