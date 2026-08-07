-- Outway Club — production-readiness migration
-- Run after 0001_init.sql. Safe to re-run.
--
-- Covers: review moderation + video testimonials, real (not seeded) ratings,
-- booking cancellation & refunds, server-side rate limiting, admin user
-- management, and an image storage bucket.

-- ---------------------------------------------------------------------------
-- profiles: store email so the admin console can identify people without
-- needing service-role access to auth.users on every page load.
-- ---------------------------------------------------------------------------
alter table profiles add column if not exists email text;

update profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is null;

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Keep profiles.email in sync when a user changes their address.
create or replace function handle_user_email_change()
returns trigger as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute procedure handle_user_email_change();

-- Admins can promote/demote other users. The role guard below stops a
-- customer from escalating themselves via a plain profile update.
drop policy if exists "profiles: update own" on profiles;
create policy "profiles: update own" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "profiles: admin update" on profiles;
create policy "profiles: admin update" on profiles
  for update using (is_admin()) with check (is_admin());

create or replace function guard_profile_role()
returns trigger as $$
begin
  -- Stops a signed-in customer escalating themselves: the "update own"
  -- policy lets them write their own row, so the role column needs its own
  -- guard on top of RLS.
  --
  -- auth.uid() is null means there is no end-user session — the service role,
  -- a migration, or the SQL editor. Those are already unrestricted by design
  -- (RLS doesn't apply to them), and this is how the first admin gets
  -- bootstrapped and how /api/admin/users/role does its work.
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not is_admin() then
    raise exception 'Only an admin can change a user role';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists profiles_role_guard on profiles;
create trigger profiles_role_guard
  before update on profiles
  for each row execute procedure guard_profile_role();

-- ---------------------------------------------------------------------------
-- reviews: moderated by default, support video testimonials, and tie each
-- review to the booking that earns the right to post it.
-- ---------------------------------------------------------------------------
alter table reviews add column if not exists video_url text;
alter table reviews add column if not exists booking_id uuid references bookings(id) on delete set null;
alter table reviews alter column is_approved set default false;

-- One review per traveller per trip.
create unique index if not exists reviews_one_per_user_per_trip
  on reviews(trip_id, user_id) where user_id is not null;

create index if not exists reviews_approved_idx on reviews(is_approved);

-- Reviews are written through /api/reviews (service role) after the server
-- verifies a paid booking exists, so no direct client insert path remains.
drop policy if exists "reviews: signed-in users can write" on reviews;
drop policy if exists "reviews: admin delete" on reviews;
create policy "reviews: admin delete" on reviews for delete using (is_admin());

-- ---------------------------------------------------------------------------
-- trips: ratings are derived from approved reviews, never hand-set.
-- ---------------------------------------------------------------------------
alter table trips alter column rating set default 0;
alter table trips alter column review_count set default 0;

create or replace function recompute_trip_rating()
returns trigger as $$
declare
  target_trip uuid := coalesce(new.trip_id, old.trip_id);
begin
  update trips set
    rating = coalesce(
      (select round(avg(rating)::numeric, 1) from reviews
        where trip_id = target_trip and is_approved), 0),
    review_count = (select count(*) from reviews
        where trip_id = target_trip and is_approved)
  where id = target_trip;
  return coalesce(new, old);
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists reviews_recompute_rating on reviews;
create trigger reviews_recompute_rating
  after insert or update or delete on reviews
  for each row execute procedure recompute_trip_rating();

-- ---------------------------------------------------------------------------
-- bookings: cancellation & refund tracking
-- ---------------------------------------------------------------------------
alter table bookings add column if not exists cancelled_at timestamptz;
alter table bookings add column if not exists cancellation_reason text;
alter table bookings add column if not exists refund_amount numeric(10, 2);
alter table bookings add column if not exists razorpay_refund_id text;
alter table bookings add column if not exists contact_email text;
alter table bookings add column if not exists contact_phone text;

alter table bookings drop constraint if exists bookings_payment_status_check;
alter table bookings add constraint bookings_payment_status_check
  check (payment_status in ('unpaid', 'paid', 'refund_pending', 'refunded', 'failed'));

-- ---------------------------------------------------------------------------
-- newsletter_subscribers: track where a signup came from so the "notify me
-- about Escape 002" list can be segmented from the footer list.
-- ---------------------------------------------------------------------------
alter table newsletter_subscribers add column if not exists source text not null default 'footer';
alter table newsletter_subscribers add column if not exists name text;

-- ---------------------------------------------------------------------------
-- Public writes now go through rate-limited API routes using the service
-- role. Drop the open anon-insert policies so the browser can't bypass them.
-- ---------------------------------------------------------------------------
drop policy if exists "enquiries: anyone can insert" on enquiries;
drop policy if exists "newsletter: anyone can insert" on newsletter_subscribers;

drop policy if exists "enquiries: admin update" on enquiries;
create policy "enquiries: admin update" on enquiries for update using (is_admin());
drop policy if exists "newsletter: admin delete" on newsletter_subscribers;
create policy "newsletter: admin delete" on newsletter_subscribers for delete using (is_admin());

-- ---------------------------------------------------------------------------
-- rate_limits — fixed-window counters keyed by bucket + client identifier.
-- Only ever touched by the service role, so RLS stays fully closed.
-- ---------------------------------------------------------------------------
create table if not exists rate_limits (
  key text primary key,
  count int not null default 0,
  window_start timestamptz not null default now()
);

alter table rate_limits enable row level security;

-- Atomically bump a counter and report whether the caller is over budget.
create or replace function bump_rate_limit(
  p_key text,
  p_limit int,
  p_window_seconds int
)
returns boolean as $$
declare
  current_count int;
begin
  insert into rate_limits (key, count, window_start)
  values (p_key, 1, now())
  on conflict (key) do update set
    count = case
      when rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
        then 1
      else rate_limits.count + 1
    end,
    window_start = case
      when rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
        then now()
      else rate_limits.window_start
    end
  returning count into current_count;

  return current_count <= p_limit;
end;
$$ language plpgsql security definer set search_path = public;

-- Housekeeping helper — call from a cron job if the table ever grows.
create or replace function prune_rate_limits()
returns void as $$
  delete from rate_limits where window_start < now() - interval '1 day';
$$ language sql security definer set search_path = public;

-- ---------------------------------------------------------------------------
-- Storage — real trip photography, uploaded from the admin trip editor.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('trip-images', 'trip-images', true)
on conflict (id) do update set public = true;

drop policy if exists "trip-images: public read" on storage.objects;
create policy "trip-images: public read" on storage.objects
  for select using (bucket_id = 'trip-images');

drop policy if exists "trip-images: admin upload" on storage.objects;
create policy "trip-images: admin upload" on storage.objects
  for insert with check (bucket_id = 'trip-images' and is_admin());

drop policy if exists "trip-images: admin update" on storage.objects;
create policy "trip-images: admin update" on storage.objects
  for update using (bucket_id = 'trip-images' and is_admin());

drop policy if exists "trip-images: admin delete" on storage.objects;
create policy "trip-images: admin delete" on storage.objects
  for delete using (bucket_id = 'trip-images' and is_admin());
