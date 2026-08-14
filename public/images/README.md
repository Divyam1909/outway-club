# Real photography goes here

Drop files in with **exactly** these names and every page picks them up with no
code change. Generation prompts for each one — plus current shot/placeholder
status — are in [`docs/image-prompts.md`](../../docs/image-prompts.md).

```
public/images/
  escape-001/
    hero.jpg         16:9  ≥2400px   homepage hero, trip hero, login panel, OG preview
    gallery-1.jpg     4:3  ≥1600px   homepage "what you'll remember"
    gallery-2.jpg    16:9  ≥2000px   about page banner, trip gallery
    gallery-3.jpg     4:5  ≥1400px   about page portrait, trip gallery
    gallery-4.jpg     1:1  ≥1200px   trip gallery thumbnail
    gallery-5.jpg     1:1  ≥1200px   trip gallery thumbnail
  udaipur/
    hero.jpg         16:9  ≥2400px   destination page banner
    gallery-1.jpg     1:1  ≥1200px   destination grid
    gallery-2.jpg     1:1  ≥1200px
    gallery-3.jpg     1:1  ≥1200px
    gallery-4.jpg     1:1  ≥1200px
```

Until a file exists the site renders a branded pine-green panel with the
Outway mark instead of a broken image, so a partial drop still looks
deliberate rather than unfinished.

For photos you want to change later without a redeploy, use the uploader in
the admin trip editor (Admin → Trips → edit → Content). That writes to
Supabase Storage and updates the database directly.
