-- Outway Club — from one launch trip to a browsable catalogue
-- Run after 0003_blog.sql. Safe to re-run.
--
-- The site was built around a single hardcoded escape: the homepage looked up
-- one slug from a constant, and the words "Escape 001" were compiled into the
-- JSX. This migration moves the two things that were hardcoded — *which* trip
-- is the headline act, and *what edition number* it carries — into the trips
-- table, so adding Escape 007 is a row, not a deploy.

-- ---------------------------------------------------------------------------
-- trips.edition_number
--
-- The "001" in "Escape 001". Nullable on purpose: not every trip we run has
-- to be a numbered edition, and a one-off collaboration shouldn't be forced
-- to take a number just to exist.
-- ---------------------------------------------------------------------------
alter table trips add column if not exists edition_number integer;

create unique index if not exists trips_edition_number_key
  on trips (edition_number)
  where edition_number is not null;

-- ---------------------------------------------------------------------------
-- trips.spotlight_rank
--
-- Ordering for the homepage. The trip with the lowest non-null rank and a
-- live departure becomes the hero; the rest fill the "running now" rail in
-- rank order. Null means "catalogue only, never the headline".
--
-- is_featured already exists but means something vaguer ("show this off"), and
-- it's used by the destination pages too. Rank is explicit and total, so two
-- trips can never tie for the hero slot the way two is_featured rows would.
-- ---------------------------------------------------------------------------
alter table trips add column if not exists spotlight_rank integer;

create index if not exists trips_spotlight_rank_idx
  on trips (spotlight_rank)
  where spotlight_rank is not null and is_published = true;

-- ---------------------------------------------------------------------------
-- Destination-led slug
--
-- "escape-001-udaipur-mount-abu" ranks for a search term nobody types. The
-- edition number survives as a badge rendered from edition_number; the URL
-- becomes the thing people actually search for. next.config.mjs 301s the old
-- path, so any link already in the wild keeps working.
-- ---------------------------------------------------------------------------
update trips
set slug = 'udaipur-mount-abu',
    edition_number = 1,
    spotlight_rank = 1
where slug = 'escape-001-udaipur-mount-abu';

-- Any other trip that predates this migration is catalogue-only until an
-- admin gives it a rank, which keeps the homepage deterministic.

-- ---------------------------------------------------------------------------
-- Departure lookups
--
-- The catalogue filters by month ("anything in October"), which means range
-- scans on start_date across every published trip. Without this the filter
-- degrades into a seq scan on departures once there are a few hundred rows.
-- ---------------------------------------------------------------------------
create index if not exists departures_start_date_idx
  on departures (start_date)
  where status <> 'closed';
