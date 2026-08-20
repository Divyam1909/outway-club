-- ---------------------------------------------------------------------------
-- 0008 — the journey layer
--
-- Outway stopped being a company that sells weekend trips and became one that
-- sells a way of travelling. The trip page had columns for the itinerary and
-- nothing for the argument around it: what you are actually buying, who it is
-- for, who it is not for, and the shape of the journey itself.
--
-- Those four things are the highest-leverage copy on the site and they change
-- per escape, so they belong in the database where ops can edit them from
-- /admin/trips/[id]/edit, not in a config file that needs a deploy.
--
-- Every column here is a jsonb string array and every one of them follows the
-- same authoring convention already used by itinerary_days.activities:
--
--     "Label — the sentence that explains it"
--
-- One item per line in the admin editor, an optional em-dash splitting a bold
-- lead from its body. The renderers split on " — " and fall back to plain text
-- when there is no dash, so a one-line entry is always valid.
--
-- Idempotent. Safe to re-run.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- trips.promise
--
-- The one line the whole escape is sold on — "Come looking for the wild. Leave
-- with a story." Not short_description: that says what happens, this says what
-- you leave with. Shown under the H1 and printed on the brochure cover.
-- ---------------------------------------------------------------------------
alter table trips add column if not exists promise text;

-- ---------------------------------------------------------------------------
-- trips.journey_route
--
-- The visual journey, in order: Delhi → people → Jawai → wildlife → sunset →
-- stories → Udaipur → lake → final dinner → return. Rendered as a horizontal
-- strip on the trip page and as the map spread in the brochure.
--
-- Deliberately not derived from itinerary_days. The route strip is an emotional
-- arc with more beats than there are days, and collapsing it to one node per
-- day is exactly the "itinerary, not journey" framing this replaces.
-- ---------------------------------------------------------------------------
alter table trips add column if not exists journey_route jsonb not null default '[]'::jsonb;

-- ---------------------------------------------------------------------------
-- trips.really_booking
--
-- "What you're really booking": conversations, local stories, unhurried
-- moments. The counterweight to the inclusions list, which necessarily reads
-- as a bus seat and a hotel room. Both are on the page; this one comes first.
-- ---------------------------------------------------------------------------
alter table trips add column if not exists really_booking jsonb not null default '[]'::jsonb;

-- ---------------------------------------------------------------------------
-- trips.who_for / trips.not_for
--
-- Qualifying the audience in public. "Not for you if" is the one that does the
-- work: an escape that admits who it will disappoint is making a claim about
-- everyone else it won't, and that is what a premium identity actually is.
-- ---------------------------------------------------------------------------
alter table trips add column if not exists who_for jsonb not null default '[]'::jsonb;
alter table trips add column if not exists not_for jsonb not null default '[]'::jsonb;

-- ---------------------------------------------------------------------------
-- trips.feelings
--
-- The three-beat emotional summary — "Jawai — Discover", "Udaipur —
-- Experience", "Outway — Connect". Three items is the design; the renderer
-- lays out however many it is given, but a fourth dilutes it.
-- ---------------------------------------------------------------------------
alter table trips add column if not exists feelings jsonb not null default '[]'::jsonb;

-- ---------------------------------------------------------------------------
-- Existing rows
--
-- `default` only applies to inserts, so rows written before this migration
-- would carry NULL and every `.map()` on the page would throw. Backfill them.
-- ---------------------------------------------------------------------------
update trips
set journey_route  = coalesce(journey_route,  '[]'::jsonb),
    really_booking = coalesce(really_booking, '[]'::jsonb),
    who_for        = coalesce(who_for,        '[]'::jsonb),
    not_for        = coalesce(not_for,        '[]'::jsonb),
    feelings       = coalesce(feelings,       '[]'::jsonb)
where journey_route is null
   or really_booking is null
   or who_for is null
   or not_for is null
   or feelings is null;
