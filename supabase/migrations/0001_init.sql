-- Outway Club — core schema
-- Run this in the Supabase SQL editor, or via `supabase db push`.

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

-- auto-create a profile row whenever someone signs up
create function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ---------------------------------------------------------------------------
-- destinations
-- ---------------------------------------------------------------------------
create table destinations (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  region text not null,          -- e.g. "Himachal Pradesh"
  country text not null default 'India',
  tagline text,
  description text,
  best_time text,                -- e.g. "March – June, Sept – Nov"
  hero_image text not null,
  gallery jsonb not null default '[]'::jsonb,
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- trips
-- ---------------------------------------------------------------------------
create table trips (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  title text not null,
  destination_id uuid not null references destinations(id) on delete restrict,
  category text not null check (category in ('adventure', 'leisure', 'honeymoon', 'pilgrimage', 'wildlife', 'trek', 'weekend', 'family', 'culture')),
  trip_type text not null default 'group' check (trip_type in ('group', 'private', 'customizable')),
  duration_days int not null,
  duration_nights int not null,
  difficulty text not null default 'easy' check (difficulty in ('easy', 'moderate', 'challenging')),
  price_per_person numeric(10, 2) not null,
  discounted_price numeric(10, 2),
  group_size_min int not null default 1,
  group_size_max int not null default 20,
  starting_point text,
  short_description text not null,
  description text not null,
  highlights jsonb not null default '[]'::jsonb,     -- string[]
  inclusions jsonb not null default '[]'::jsonb,      -- string[]
  exclusions jsonb not null default '[]'::jsonb,      -- string[]
  things_to_carry jsonb not null default '[]'::jsonb, -- string[]
  hero_image text not null,
  gallery jsonb not null default '[]'::jsonb,         -- string[]
  rating numeric(2, 1) not null default 4.8,
  review_count int not null default 0,
  is_featured boolean not null default false,
  is_group_trip boolean not null default true,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create index trips_destination_idx on trips(destination_id);
create index trips_category_idx on trips(category);
create index trips_published_idx on trips(is_published);

-- ---------------------------------------------------------------------------
-- itinerary_days — full day-by-day plan for a trip
-- ---------------------------------------------------------------------------
create table itinerary_days (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid not null references trips(id) on delete cascade,
  day_number int not null,
  title text not null,
  description text not null,
  activities jsonb not null default '[]'::jsonb,  -- string[]
  meals jsonb not null default '{"breakfast": false, "lunch": false, "dinner": false}'::jsonb,
  accommodation text,
  unique (trip_id, day_number)
);

create index itinerary_days_trip_idx on itinerary_days(trip_id);

-- ---------------------------------------------------------------------------
-- departures — fixed group-trip batches with real dates & seat counts
-- ---------------------------------------------------------------------------
create table departures (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid not null references trips(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  total_seats int not null default 16,
  seats_booked int not null default 0,
  price_override numeric(10, 2),
  status text not null default 'open' check (status in ('open', 'filling_fast', 'sold_out', 'closed')),
  created_at timestamptz not null default now()
);

create index departures_trip_idx on departures(trip_id);
create index departures_start_date_idx on departures(start_date);

-- ---------------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------------
create table reviews (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid not null references trips(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  author_name text not null,
  rating int not null check (rating between 1 and 5),
  title text,
  body text not null,
  trip_month text,             -- e.g. "December 2025"
  is_approved boolean not null default true,
  created_at timestamptz not null default now()
);

create index reviews_trip_idx on reviews(trip_id);

-- ---------------------------------------------------------------------------
-- bookings
-- ---------------------------------------------------------------------------
create table bookings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid not null references trips(id) on delete restrict,
  departure_id uuid references departures(id) on delete set null,
  num_travelers int not null default 1,
  total_amount numeric(10, 2) not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid', 'refunded', 'failed')),
  razorpay_order_id text,
  razorpay_payment_id text,
  special_requests text,
  created_at timestamptz not null default now()
);

create index bookings_user_idx on bookings(user_id);
create index bookings_trip_idx on bookings(trip_id);

-- ---------------------------------------------------------------------------
-- travelers — per-person details attached to a booking
-- ---------------------------------------------------------------------------
create table travelers (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references bookings(id) on delete cascade,
  full_name text not null,
  age int,
  gender text,
  id_proof_type text,
  id_proof_number text,
  is_primary boolean not null default false
);

create index travelers_booking_idx on travelers(booking_id);

-- ---------------------------------------------------------------------------
-- enquiries — contact form + "customize this trip" leads
-- ---------------------------------------------------------------------------
create table enquiries (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null,
  phone text,
  trip_id uuid references trips(id) on delete set null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- newsletter_subscribers
-- ---------------------------------------------------------------------------
create table newsletter_subscribers (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
alter table destinations enable row level security;
alter table trips enable row level security;
alter table itinerary_days enable row level security;
alter table departures enable row level security;
alter table reviews enable row level security;
alter table bookings enable row level security;
alter table travelers enable row level security;
alter table enquiries enable row level security;
alter table newsletter_subscribers enable row level security;

-- helper: is the current user an admin?
create function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer set search_path = public stable;

-- profiles
create policy "profiles: read own or admin" on profiles
  for select using (auth.uid() = id or is_admin());
create policy "profiles: update own" on profiles
  for update using (auth.uid() = id);

-- public content: anyone can read
create policy "destinations: public read" on destinations for select using (true);
create policy "destinations: admin write" on destinations for insert with check (is_admin());
create policy "destinations: admin update" on destinations for update using (is_admin());
create policy "destinations: admin delete" on destinations for delete using (is_admin());

create policy "trips: public read published" on trips for select using (is_published or is_admin());
create policy "trips: admin write" on trips for insert with check (is_admin());
create policy "trips: admin update" on trips for update using (is_admin());
create policy "trips: admin delete" on trips for delete using (is_admin());

create policy "itinerary: public read" on itinerary_days for select using (true);
create policy "itinerary: admin write" on itinerary_days for insert with check (is_admin());
create policy "itinerary: admin update" on itinerary_days for update using (is_admin());
create policy "itinerary: admin delete" on itinerary_days for delete using (is_admin());

create policy "departures: public read" on departures for select using (true);
create policy "departures: admin write" on departures for insert with check (is_admin());
create policy "departures: admin update" on departures for update using (is_admin());
create policy "departures: admin delete" on departures for delete using (is_admin());

create policy "reviews: public read approved" on reviews for select using (is_approved or is_admin());
create policy "reviews: signed-in users can write" on reviews for insert with check (auth.uid() is not null);
create policy "reviews: admin moderate" on reviews for update using (is_admin());

-- bookings: users see/manage their own; admins see/manage everything
create policy "bookings: read own or admin" on bookings
  for select using (auth.uid() = user_id or is_admin());
create policy "bookings: insert own" on bookings
  for insert with check (auth.uid() = user_id);
create policy "bookings: update own or admin" on bookings
  for update using (auth.uid() = user_id or is_admin());

create policy "travelers: read via own booking or admin" on travelers
  for select using (
    is_admin() or exists (select 1 from bookings b where b.id = booking_id and b.user_id = auth.uid())
  );
create policy "travelers: insert via own booking" on travelers
  for insert with check (
    exists (select 1 from bookings b where b.id = booking_id and b.user_id = auth.uid())
  );

-- enquiries: anyone (incl. anonymous) can submit; only admins can read
create policy "enquiries: anyone can insert" on enquiries for insert with check (true);
create policy "enquiries: admin read" on enquiries for select using (is_admin());

-- newsletter: anyone can subscribe; only admins can read the list
create policy "newsletter: anyone can insert" on newsletter_subscribers for insert with check (true);
create policy "newsletter: admin read" on newsletter_subscribers for select using (is_admin());

-- ---------------------------------------------------------------------------
-- Keep departures.status roughly in sync with seats_booked
-- ---------------------------------------------------------------------------
create function sync_departure_status()
returns trigger as $$
begin
  if new.seats_booked >= new.total_seats then
    new.status := 'sold_out';
  elsif new.seats_booked >= (new.total_seats * 0.8) then
    new.status := 'filling_fast';
  elsif new.status = 'sold_out' or new.status = 'filling_fast' then
    new.status := 'open';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger departures_status_sync
  before insert or update of seats_booked on departures
  for each row execute procedure sync_departure_status();
