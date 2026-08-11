-- ---------------------------------------------------------------------------
-- 0005_booking_integrity.sql
--
-- Two races that only show up once real money is moving:
--
--   1. Two customers paying for the last seats at the same moment. The old
--      code read seats_booked, added to it in JS, and wrote it back — so both
--      requests read the same number and both wrote a value that ignored the
--      other. The departure oversells silently.
--
--   2. The browser's verify call and Razorpay's webhook arriving together for
--      the same order. Both check "does a booking exist for this order?", both
--      see nothing, both insert. The customer gets two bookings for one
--      payment.
--
-- Fixed here at the database level, because that's the only layer that sees
-- both requests at once.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. One booking per Razorpay order, enforced by the database.
--
-- Partial, because razorpay_order_id is null for bookings created by hand in
-- the admin console and those must stay insertable.
-- ---------------------------------------------------------------------------
create unique index if not exists bookings_razorpay_order_key
  on bookings (razorpay_order_id)
  where razorpay_order_id is not null;

-- ---------------------------------------------------------------------------
-- 2. Atomic seat allocation.
--
-- The increment happens inside a single UPDATE, so Postgres holds the row lock
-- across the read and the write and concurrent callers queue up instead of
-- overwriting each other.
--
-- It deliberately allocates even when that overshoots total_seats: by the time
-- this is called the customer has already paid, and refusing the seat would
-- leave money taken with nothing recorded. Instead it reports `fitted = false`
-- so the caller can raise it with ops, who can move the traveller to another
-- departure or refund them. Overselling loudly beats losing the booking.
-- ---------------------------------------------------------------------------
create or replace function book_departure_seats(
  p_departure_id uuid,
  p_seats int
)
returns table (fitted boolean, seats_booked int, total_seats int) as $$
declare
  v_row departures%rowtype;
begin
  update departures d
  set seats_booked = d.seats_booked + p_seats,
      status = case
        when d.seats_booked + p_seats >= d.total_seats
             and d.status in ('open', 'filling_fast')
          then 'sold_out'
        else d.status
      end
  where d.id = p_departure_id
  returning d.* into v_row;

  if not found then
    return;
  end if;

  return query select
    v_row.seats_booked <= v_row.total_seats,
    v_row.seats_booked,
    v_row.total_seats;
end;
$$ language plpgsql security definer set search_path = public;

-- Only the service role books seats. A signed-in user must never be able to
-- call this directly — it moves the seat count with no payment attached.
revoke all on function book_departure_seats(uuid, int) from public;
revoke all on function book_departure_seats(uuid, int) from anon;
revoke all on function book_departure_seats(uuid, int) from authenticated;
