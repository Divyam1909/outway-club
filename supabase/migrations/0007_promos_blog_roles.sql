-- ---------------------------------------------------------------------------
-- 0007_promos_blog_roles.sql
--
-- Three things, and they share a migration because two of them touch roles:
--
--   1. A `blogger` role. Same console as an admin, but only the Journal —
--      no bookings, no trips, no customers, no payments. Set by hand from
--      /admin/users, exactly like admin.
--
--   2. Reader-submitted articles. Anyone signed in can write one; it lands as
--      `submitted` and stays invisible until a human approves it, at which
--      point it becomes an ordinary published post on the same render path.
--      No second table, no second template, nothing to go stale.
--
--   3. Promo codes. Percentage or flat, with real limits (total uses, uses per
--      person, a date window, a minimum order, a per-trip restriction), one
--      auto-applying event code, and an atomic claim so a "100 uses" code
--      cannot be used 101 times by two people pressing send together.
--
-- Run after 0006_trip_requests.sql. Safe to re-run.
-- ---------------------------------------------------------------------------

-- ===========================================================================
-- 1. Roles
-- ===========================================================================

-- 'blogger' sits between customer and admin: full authority over the Journal,
-- zero visibility of anything commercial.
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('customer', 'blogger', 'admin'));

/**
 * Can this session manage the Journal?
 *
 * Separate from is_admin() rather than "is_admin() or role = blogger" inlined
 * at every policy, because the answer has to be identical in eleven places and
 * a typo in one of them is a silent authorisation hole.
 */
create or replace function is_blog_editor()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('admin', 'blogger')
  );
$$ language sql security definer set search_path = public stable;

-- ===========================================================================
-- 2. Reader-submitted articles
-- ===========================================================================

alter table blog_posts add column if not exists submitted_at timestamptz;
alter table blog_posts add column if not exists reviewed_at timestamptz;
alter table blog_posts add column if not exists reviewed_by uuid references auth.users(id) on delete set null;
-- Shown back to the writer when a piece is sent back or turned down. Never
-- rendered publicly.
alter table blog_posts add column if not exists review_note text;
-- The address the acceptance / rejection email goes to. Captured at submission
-- time rather than joined from auth.users, so it survives an account deletion
-- and an ops person can see who to reply to without service-role access.
alter table blog_posts add column if not exists submitter_email text;
-- 'staff' = written in the admin console. 'community' = sent in by a reader.
alter table blog_posts add column if not exists source text not null default 'staff';

alter table blog_posts drop constraint if exists blog_posts_source_check;
alter table blog_posts add constraint blog_posts_source_check
  check (source in ('staff', 'community'));

-- 'submitted' — waiting on a human. 'rejected' — turned down, kept so the
-- writer can see why and so the same piece can't be silently resubmitted.
alter table blog_posts drop constraint if exists blog_posts_status_check;
alter table blog_posts add constraint blog_posts_status_check
  check (status in ('draft', 'submitted', 'published', 'rejected'));

create index if not exists blog_posts_author_idx on blog_posts(author_id);
create index if not exists blog_posts_source_idx on blog_posts(source);
create index if not exists blog_posts_submitted_idx on blog_posts(submitted_at desc);

/**
 * Stamp the review/submission timestamps from the transition itself.
 *
 * Doing this in the API route instead would mean every future caller has to
 * remember to — and the one that forgets produces a post with no submission
 * date, which is the column the moderation queue sorts on.
 */
create or replace function touch_blog_post()
returns trigger as $$
begin
  new.updated_at := now();

  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;

  if new.status = 'submitted'
     and (tg_op = 'INSERT' or old.status is distinct from 'submitted') then
    new.submitted_at := coalesce(new.submitted_at, now());
  end if;

  if tg_op = 'UPDATE'
     and new.status is distinct from old.status
     and new.status in ('published', 'rejected')
     and old.status = 'submitted' then
    new.reviewed_at := now();
  end if;

  return new;
end;
$$ language plpgsql set search_path = public;

drop trigger if exists blog_posts_touch on blog_posts;
create trigger blog_posts_touch
  before insert or update on blog_posts
  for each row execute procedure touch_blog_post();

-- ---------------------------------------------------------------------------
-- Blog RLS, rebuilt around the editor role.
--
-- A writer can read their own work at any status. Nobody else sees anything
-- that isn't published, which is the whole promise of the review step: an
-- unapproved article is not on the internet, not "on the internet but
-- unlinked".
-- ---------------------------------------------------------------------------
drop policy if exists "blog_posts: public read published" on blog_posts;
create policy "blog_posts: public read published" on blog_posts
  for select using (
    status = 'published' or is_blog_editor() or author_id = auth.uid()
  );

drop policy if exists "blog_posts: admin write" on blog_posts;
drop policy if exists "blog_posts: editor write" on blog_posts;
create policy "blog_posts: editor write" on blog_posts
  for insert with check (is_blog_editor());

drop policy if exists "blog_posts: admin update" on blog_posts;
drop policy if exists "blog_posts: editor update" on blog_posts;
create policy "blog_posts: editor update" on blog_posts
  for update using (is_blog_editor()) with check (is_blog_editor());

drop policy if exists "blog_posts: admin delete" on blog_posts;
drop policy if exists "blog_posts: editor delete" on blog_posts;
create policy "blog_posts: editor delete" on blog_posts
  for delete using (is_blog_editor());

-- Community submissions are inserted by /api/blog/submissions on the service
-- role — deliberately no anon/authenticated insert policy, so the sanitiser
-- and the rate limiter cannot be stepped around by talking to PostgREST.

drop policy if exists "blog_comments: admin update" on blog_comments;
drop policy if exists "blog_comments: editor update" on blog_comments;
create policy "blog_comments: editor update" on blog_comments
  for update using (is_blog_editor());

drop policy if exists "blog_comments: admin delete" on blog_comments;
drop policy if exists "blog_comments: editor delete" on blog_comments;
create policy "blog_comments: editor delete" on blog_comments
  for delete using (is_blog_editor());

drop policy if exists "blog_comments: public read approved" on blog_comments;
create policy "blog_comments: public read approved" on blog_comments
  for select using (is_approved or is_blog_editor());

-- ---------------------------------------------------------------------------
-- Storage: editorial photography.
--
-- Editors upload anywhere in the bucket. A signed-in reader writing a
-- submission may only write under `submissions/`, and may not overwrite or
-- delete — so one contributor can never clobber another's cover photo, and a
-- stray upload is trivially identifiable by prefix.
-- ---------------------------------------------------------------------------
drop policy if exists "blog-images: admin upload" on storage.objects;
drop policy if exists "blog-images: editor upload" on storage.objects;
create policy "blog-images: editor upload" on storage.objects
  for insert with check (bucket_id = 'blog-images' and is_blog_editor());

drop policy if exists "blog-images: contributor upload" on storage.objects;
create policy "blog-images: contributor upload" on storage.objects
  for insert with check (
    bucket_id = 'blog-images'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = 'submissions'
  );

drop policy if exists "blog-images: admin update" on storage.objects;
drop policy if exists "blog-images: editor update" on storage.objects;
create policy "blog-images: editor update" on storage.objects
  for update using (bucket_id = 'blog-images' and is_blog_editor());

drop policy if exists "blog-images: admin delete" on storage.objects;
drop policy if exists "blog-images: editor delete" on storage.objects;
create policy "blog-images: editor delete" on storage.objects
  for delete using (bucket_id = 'blog-images' and is_blog_editor());

-- ===========================================================================
-- 3. Promo codes
-- ===========================================================================

/**
 * One row per code. Everything that decides whether a code applies lives here
 * rather than in application config, because the people creating codes are
 * collaborators and influencers being onboarded by ops, not deploys.
 *
 * `per_traveler` is the field that stops a flat code being a rounding error on
 * a group booking: "₹1,000 off" means ₹1,000 a head on an event offer and
 * ₹1,000 off the order on a partner code, and both are legitimate. The column
 * makes which one it is explicit rather than an assumption in the UI.
 */
create table if not exists promo_codes (
  id uuid primary key default uuid_generate_v4(),

  code text not null,
  label text not null,
  description text,

  discount_type text not null check (discount_type in ('percent', 'flat')),
  discount_value numeric(10, 2) not null check (discount_value > 0),
  -- Percentage codes only: never take more than this off one order. Null =
  -- uncapped, which is fine for a 10% code and reckless for a 50% one.
  max_discount_amount numeric(10, 2),
  -- Flat codes only: is the amount per head, or off the order once?
  per_traveler boolean not null default false,

  min_order_amount numeric(10, 2) not null default 0,
  min_travelers int not null default 1 check (min_travelers >= 1),

  -- Null on either of these means unlimited.
  usage_limit int check (usage_limit is null or usage_limit > 0),
  per_user_limit int check (per_user_limit is null or per_user_limit > 0),
  times_used int not null default 0,

  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,

  -- Applied without anyone typing it, for event offers. Only one auto code can
  -- ever land on an order; when several qualify the largest discount wins.
  auto_apply boolean not null default false,

  -- Empty array = every trip. Otherwise the trip ids the code is valid on.
  trip_ids jsonb not null default '[]'::jsonb,

  -- Who the code belongs to, for paying collaborators what they're owed.
  partner_name text,
  partner_handle text,
  notes text,

  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Codes are matched case-insensitively, so uniqueness has to be too, or
-- "JANMASHTAMI" and "Janmashtami" become two codes with two counters.
create unique index if not exists promo_codes_code_key on promo_codes (upper(code));
create index if not exists promo_codes_active_idx on promo_codes (is_active, auto_apply);

/**
 * One row per successful application of a code.
 *
 * The counter on promo_codes is what enforces the limit; this is what proves
 * it — which collaborator drove which request, and what the customer actually
 * paid. `email` is lowercased on write so the per-person limit can't be
 * defeated by capitalising an address differently.
 */
create table if not exists promo_redemptions (
  id uuid primary key default uuid_generate_v4(),
  promo_code_id uuid not null references promo_codes(id) on delete cascade,
  code text not null,

  trip_request_id uuid references trip_requests(id) on delete set null,
  booking_id uuid references bookings(id) on delete set null,
  trip_id uuid references trips(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  email text,

  num_travelers int not null default 1,
  subtotal_amount numeric(10, 2) not null,
  discount_amount numeric(10, 2) not null,
  total_amount numeric(10, 2) not null,

  created_at timestamptz not null default now()
);

create index if not exists promo_redemptions_code_idx on promo_redemptions(promo_code_id);
create index if not exists promo_redemptions_email_idx on promo_redemptions(lower(email));

-- ---------------------------------------------------------------------------
-- What a promo code lands on. Nullable everywhere, so a request made before
-- codes existed still reads back cleanly.
-- ---------------------------------------------------------------------------
alter table trip_requests add column if not exists promo_code_id uuid references promo_codes(id) on delete set null;
alter table trip_requests add column if not exists promo_code text;
alter table trip_requests add column if not exists subtotal_amount numeric(10, 2);
alter table trip_requests add column if not exists discount_amount numeric(10, 2);
alter table trip_requests add column if not exists total_amount numeric(10, 2);

alter table bookings add column if not exists promo_code_id uuid references promo_codes(id) on delete set null;
alter table bookings add column if not exists promo_code text;
alter table bookings add column if not exists subtotal_amount numeric(10, 2);
alter table bookings add column if not exists discount_amount numeric(10, 2);

/**
 * Take one use of a code, or refuse.
 *
 * The check and the increment are one statement under a row lock, because the
 * alternative — read the counter, decide in JS, write it back — is how a code
 * capped at 50 uses gets used 53 times by three people who pressed send at the
 * same moment. Everything reversible about a code (its dates, its active flag)
 * is re-checked here rather than trusted from the caller, so a stale browser
 * tab holding a code that expired ten minutes ago is refused at the last
 * possible moment rather than the first.
 *
 * Returns the reason on failure so the caller can say something true to the
 * customer instead of a generic "invalid code".
 */
create or replace function claim_promo_code(
  p_promo_id uuid,
  p_email text,
  p_trip_id uuid,
  p_subtotal numeric,
  p_travelers int
)
returns table (ok boolean, reason text) as $$
declare
  v_row promo_codes%rowtype;
  v_used int;
begin
  select * into v_row from promo_codes where id = p_promo_id for update;

  if not found then
    return query select false, 'unknown'; return;
  end if;
  if not v_row.is_active then
    return query select false, 'inactive'; return;
  end if;
  if v_row.starts_at is not null and now() < v_row.starts_at then
    return query select false, 'not_started'; return;
  end if;
  if v_row.ends_at is not null and now() > v_row.ends_at then
    return query select false, 'expired'; return;
  end if;
  if jsonb_array_length(v_row.trip_ids) > 0
     and not (v_row.trip_ids ? p_trip_id::text) then
    return query select false, 'wrong_trip'; return;
  end if;
  if p_travelers < v_row.min_travelers then
    return query select false, 'min_travelers'; return;
  end if;
  if p_subtotal < v_row.min_order_amount then
    return query select false, 'min_order'; return;
  end if;
  if v_row.usage_limit is not null and v_row.times_used >= v_row.usage_limit then
    return query select false, 'used_up'; return;
  end if;

  if v_row.per_user_limit is not null and coalesce(p_email, '') <> '' then
    select count(*) into v_used
    from promo_redemptions
    where promo_code_id = p_promo_id and lower(email) = lower(p_email);

    if v_used >= v_row.per_user_limit then
      return query select false, 'per_user'; return;
    end if;
  end if;

  update promo_codes
  set times_used = times_used + 1, updated_at = now()
  where id = p_promo_id;

  return query select true, 'ok';
end;
$$ language plpgsql security definer set search_path = public;

-- Only the service role claims a code — a signed-in user calling this directly
-- would burn a use with no request attached to it.
revoke all on function claim_promo_code(uuid, text, uuid, numeric, int) from public;
revoke all on function claim_promo_code(uuid, text, uuid, numeric, int) from anon;
revoke all on function claim_promo_code(uuid, text, uuid, numeric, int) from authenticated;

/** Hand a use back when the write that consumed it failed. */
create or replace function release_promo_code(p_promo_id uuid)
returns void as $$
  update promo_codes
  set times_used = greatest(times_used - 1, 0), updated_at = now()
  where id = p_promo_id;
$$ language sql security definer set search_path = public;

revoke all on function release_promo_code(uuid) from public;
revoke all on function release_promo_code(uuid) from anon;
revoke all on function release_promo_code(uuid) from authenticated;

-- ---------------------------------------------------------------------------
-- Promo RLS.
--
-- Reads are admin-only and writes go through /api/admin/promo-codes. A code's
-- terms are not public: publishing `usage_limit` and `times_used` to the
-- browser tells anyone with the network tab exactly how many seats are left on
-- a collaborator's deal. The validate endpoint returns the discount and
-- nothing else.
-- ---------------------------------------------------------------------------
alter table promo_codes enable row level security;
alter table promo_redemptions enable row level security;

drop policy if exists "promo_codes: admin read" on promo_codes;
create policy "promo_codes: admin read" on promo_codes for select using (is_admin());
drop policy if exists "promo_codes: admin write" on promo_codes;
create policy "promo_codes: admin write" on promo_codes for insert with check (is_admin());
drop policy if exists "promo_codes: admin update" on promo_codes;
create policy "promo_codes: admin update" on promo_codes for update using (is_admin());
drop policy if exists "promo_codes: admin delete" on promo_codes;
create policy "promo_codes: admin delete" on promo_codes for delete using (is_admin());

drop policy if exists "promo_redemptions: admin read" on promo_redemptions;
create policy "promo_redemptions: admin read" on promo_redemptions for select using (is_admin());
