-- ---------------------------------------------------------------------------
-- 0006_trip_requests.sql
--
-- Booking requests, and the short questionnaire that has to be answered before
-- one can be sent.
--
-- Payments are off for now: "Book now" no longer opens Razorpay, it opens a
-- two-minute form. What comes out of it is a *request*, not a booking — nothing
-- is held, no seat moves, no money changes hands. Ops read these, group people
-- who travel the same way, and confirm by email or phone.
--
-- Every questionnaire answer gets its own column rather than living in a jsonb
-- blob, so the admin screen can group and count on them directly. The ids in
-- src/config/trip-request.ts are these column names — adding a question there
-- means adding a column here.
-- ---------------------------------------------------------------------------

create table if not exists trip_requests (
  id uuid primary key default uuid_generate_v4(),

  trip_id uuid not null references trips(id) on delete cascade,
  departure_id uuid references departures(id) on delete set null,
  -- Set only when the sender happened to be signed in. The form deliberately
  -- does not require an account.
  user_id uuid references auth.users(id) on delete set null,

  name text not null,
  email text not null,
  phone text not null,
  num_travelers int not null default 1 check (num_travelers between 1 and 40),

  -- Getting to the start point -----------------------------------------------
  origin_city text not null,
  -- Free text, only when origin_city = 'other'.
  origin_city_other text,
  -- Whether they want us to book the flight/train, or they'll arrive on their own.
  travel_help text not null,

  -- The questionnaire ---------------------------------------------------------
  travel_style text not null,
  pace text not null,
  evenings text not null,
  group_type text not null,
  social_energy text not null,
  age_band text not null,

  deal_breakers text,
  notes text,

  status text not null default 'new'
    check (status in ('new', 'contacted', 'confirmed', 'closed')),
  created_at timestamptz not null default now()
);

create index if not exists trip_requests_trip_idx on trip_requests(trip_id);
create index if not exists trip_requests_status_idx on trip_requests(status);
create index if not exists trip_requests_created_idx on trip_requests(created_at desc);

alter table trip_requests enable row level security;

-- Reads and status changes are admin-only. There is deliberately no insert
-- policy: submissions come through /api/trip-requests on the service role,
-- after rate limiting and bot filtering, exactly like enquiries.
drop policy if exists "trip_requests: admin read" on trip_requests;
create policy "trip_requests: admin read" on trip_requests
  for select using (is_admin());

drop policy if exists "trip_requests: admin update" on trip_requests;
create policy "trip_requests: admin update" on trip_requests
  for update using (is_admin());

drop policy if exists "trip_requests: admin delete" on trip_requests;
create policy "trip_requests: admin delete" on trip_requests
  for delete using (is_admin());
