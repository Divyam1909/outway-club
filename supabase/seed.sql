-- Outway Club: launch content
-- Escape 001: Udaipur x Mount Abu, 15 to 18 August.
--
-- Run AFTER 0001_init.sql and 0002_launch.sql. Idempotent, re-running
-- replaces the launch trip cleanly.
--
-- There is deliberately no seeded review data. Ratings and testimonials are
-- computed from real, moderated traveller submissions only.

-- ---------------------------------------------------------------------------
-- Remove the pre-launch demo catalogue (8 sample trips + their reviews).
-- ---------------------------------------------------------------------------
delete from reviews where trip_id in (
  select id from trips where id::text like '22222222-2222-2222-2222-2222222222%'
);
delete from travelers where booking_id in (
  select id from bookings where trip_id in (
    select id from trips where id::text like '22222222-2222-2222-2222-2222222222%'
  )
);
delete from bookings where trip_id in (
  select id from trips where id::text like '22222222-2222-2222-2222-2222222222%'
);
delete from trips where id::text like '22222222-2222-2222-2222-2222222222%';
delete from destinations where id::text like '11111111-1111-1111-1111-1111111111%';

-- ---------------------------------------------------------------------------
-- Destination: Udaipur (Escape 001 runs Udaipur to Mount Abu to Udaipur)
-- ---------------------------------------------------------------------------
insert into destinations (id, slug, name, region, country, tagline, description, best_time, hero_image, gallery, is_featured) values
('11111111-1111-1111-1111-111111111001', 'udaipur', 'Udaipur', 'Rajasthan', 'India',
  'The city built around water, in a state built around sand',
  'Udaipur is the softest city in Rajasthan: lake water instead of desert, marble instead of sandstone, and evenings that slow to a stop somewhere on a ghat. Escape 001 pairs it with Mount Abu, the one hill station in the state, four hours west through the Aravallis. In August the whole range turns green, which is the single best reason to run this route in monsoon rather than winter.',
  'July to March, with August the greenest',
  '/images/udaipur/hero.jpg',
  '["/images/udaipur/gallery-1.jpg","/images/udaipur/gallery-2.jpg","/images/udaipur/gallery-3.jpg","/images/udaipur/gallery-4.jpg"]',
  true)
on conflict (id) do update set
  slug = excluded.slug, name = excluded.name, region = excluded.region,
  tagline = excluded.tagline, description = excluded.description,
  best_time = excluded.best_time, hero_image = excluded.hero_image,
  gallery = excluded.gallery, is_featured = excluded.is_featured;

-- ---------------------------------------------------------------------------
-- Escape 001: Udaipur x Mount Abu
-- ---------------------------------------------------------------------------
insert into trips (
  id, slug, title, destination_id, category, trip_type,
  duration_days, duration_nights, difficulty,
  price_per_person, discounted_price, group_size_min, group_size_max, starting_point,
  short_description, description,
  highlights, inclusions, exclusions, things_to_carry,
  hero_image, gallery, rating, review_count, is_featured, is_group_trip, is_published,
  edition_number, spotlight_rank
) values (
  '22222222-2222-2222-2222-222222222001',
  'udaipur-mount-abu',
  'Udaipur × Mount Abu',
  '11111111-1111-1111-1111-111111111001',
  'weekend', 'group', 4, 3, 'easy',
  8999, 7999, 6, 18,
  'Udaipur, Maharana Pratap Airport (UDR) or Udaipur City railway station',

  'Four days across the greenest month in Rajasthan, three nights, one lake city, one hill station, and eighteen people who signed up for the same long weekend.',

  'This is the first escape we are running, and we built it to be the trip we would want to be on — which meant giving it a day more than it strictly needs. It opens in Udaipur with a free afternoon, a sunset boat on Lake Pichola and a rooftop dinner facing a lit-up City Palace. The City Palace itself gets an unhurried morning before we head west into the Aravallis. August is the one month these hills are properly green, and monsoon turns the drive to Mount Abu into the best four hours of the trip. You get two full nights in the hills rather than one, which is the whole reason this works: sunrise from Guru Shikhar on a morning you actually slept before, Dilwara''s 900-year-old marble carving in the afternoon, a free morning to do nothing at all, and the bonfire on the last night instead of the night before a 5am alarm. The drive back on the last day is a slow one, through Sajjangarh and the view over both lakes, with time in Udaipur before an evening flight. Eighteen travellers, one trip captain who has run this route before, every stay and transfer booked in advance. Landing a day early or leaving a day late is easy to arrange too, Kumbhalgarh Fort and the Ranakpur Jain temple, both under two and a half hours from Udaipur, are the two side trips most people wish they had added on afterwards.',

  '["Sunset boat on Lake Pichola, past the Taj Lake Palace as the ghats light up","900-year-old marble carving at the Dilwara Temples, the finest in India, and most people have never seen it","A free afternoon in Udaipur and a free morning in Mount Abu, this is four days doing three days of sightseeing","Gangaur Ghat and the Jagdish Temple at golden hour, two minutes off the City Palace ramp and skipped by most of the boat crowd","Dharohar folk dance and puppetry at Bagore Ki Haveli, seats booked ahead so you are not standing at the back","Sunrise from Guru Shikhar, the highest point in the Aravallis at 1,722m, on a morning you slept properly before","Rooftop dinner at Ambrai Ghat, facing the floodlit City Palace across the water","Bonfire night above Nakki Lake on the last evening, capped at 18 people who booked the same weekend"]',

  '["3 nights in hand-picked stays: a boutique haveli in Udaipur and two nights at a hillside resort in Mount Abu, on twin sharing","All breakfasts and 3 dinners, including the rooftop dinner at Ambrai Ghat","Private air-conditioned transport for the full route and all sightseeing","Sunset boat ride on Lake Pichola","All monument and temple entry fees listed in the itinerary","A dedicated Outway trip captain with you for all four days","Bonfire evening in Mount Abu","All applicable taxes: the price you see is the price you pay"]',

  '["Travel to and from Udaipur (flights or trains)","Lunches on all four days","Personal expenses, shopping, tips and anything at the bar","Travel insurance, we strongly recommend arranging your own","Any activity or entry not named in the inclusions list","Single-occupancy room upgrade (available on request, quoted separately)"]',

  '["A light rain jacket or poncho, this is monsoon, and that is the point","One warm layer: Mount Abu drops to around 20°C after dark","Comfortable walking shoes you can get wet","Original government photo ID, mandatory at hotel check-in, no exceptions","Sunscreen and a refillable water bottle","Any personal medication, plus something for motion sickness on the ghat road","Modest clothing for the Dilwara temples: shoulders and knees covered, no leather items or phones allowed inside"]',

  '/images/escape-001/hero.jpg',
  '["/images/escape-001/gallery-1.jpg","/images/escape-001/gallery-2.jpg","/images/escape-001/gallery-3.jpg","/images/escape-001/gallery-4.jpg","/images/escape-001/gallery-5.jpg"]',
  0, 0, true, true, true,
  1, 1
)
on conflict (id) do update set
  slug = excluded.slug, title = excluded.title, destination_id = excluded.destination_id,
  category = excluded.category, trip_type = excluded.trip_type,
  duration_days = excluded.duration_days, duration_nights = excluded.duration_nights,
  difficulty = excluded.difficulty, price_per_person = excluded.price_per_person,
  discounted_price = excluded.discounted_price, group_size_min = excluded.group_size_min,
  group_size_max = excluded.group_size_max, starting_point = excluded.starting_point,
  short_description = excluded.short_description, description = excluded.description,
  highlights = excluded.highlights, inclusions = excluded.inclusions,
  exclusions = excluded.exclusions, things_to_carry = excluded.things_to_carry,
  hero_image = excluded.hero_image, gallery = excluded.gallery,
  is_featured = excluded.is_featured, is_group_trip = excluded.is_group_trip,
  is_published = excluded.is_published,
  edition_number = excluded.edition_number, spotlight_rank = excluded.spotlight_rank;

-- ---------------------------------------------------------------------------
-- Itinerary: 4 days
--
-- Deliberately hills-weighted: one night in Udaipur, two in Mount Abu. The
-- three-day version put Guru Shikhar's 5am start the morning after the bonfire
-- and stacked a four-hour drive on top of a full sightseeing day. Two nights in
-- the hills fixes both — the sunrise gets a slept-on night, the bonfire moves to
-- the last evening, and day four is only the drive back.
-- ---------------------------------------------------------------------------
delete from itinerary_days where trip_id = '22222222-2222-2222-2222-222222222001';

insert into itinerary_days (trip_id, day_number, title, description, activities, meals, accommodation) values
('22222222-2222-2222-2222-222222222001', 1,
  'Udaipur: a free afternoon, the ghats and the lake at last light',
  'Land in Udaipur late morning and check into a boutique haveli inside the old city. The rest of the afternoon is deliberately yours — lunch on your own, a nap if the flight was early, or an hour in the lanes around the haveli, which are the best part of the city and cost nothing. We start properly at 4.15pm with the five-minute walk down to Gangaur Ghat and the Jagdish Temple, both a step off the main tourist track and both at their best in golden-hour light. At 5.30pm we board a private boat on Lake Pichola for the last of it, out past Jag Mandir and the Taj Lake Palace as the ghats start lighting up. Back on shore, Bagore Ki Haveli runs the 7pm Dharohar show two minutes from where the boat lands — Rajasthan''s classical and folk repertoire under one roof, including the Kalbeliya and the head-balanced pot dance. We book seats for anyone who wants them, and if you would rather keep the evening slow, skip it and go straight up to the roof. Dinner either way is at Ambrai Ghat, a rooftop table directly across the water from a floodlit City Palace, the single best table in the city, booked well in advance.',
  '["11:00 AM — Arrival and check-in at the haveli","Free afternoon — lunch on your own, the old city lanes","4:15 PM — Gangaur Ghat and Jagdish Temple, a hidden gem 5 min walk away","5:30 PM — Sunset boat ride on Lake Pichola past Jag Mandir","7:00 PM — Dharohar dance show at Bagore Ki Haveli, optional","8:30 PM — Rooftop dinner at Ambrai Ghat facing the City Palace"]',
  '{"breakfast": false, "lunch": false, "dinner": true}',
  'Boutique haveli, Udaipur old city'),

('22222222-2222-2222-2222-222222222001', 2,
  'The City Palace in the morning, the Aravallis in the afternoon',
  'The City Palace opens at 9.30am and the first hour is the quiet one, before the tour groups are funnelled through the same three courtyards. Give it two hours with the Crystal Gallery — the largest palace complex in Rajasthan, four hundred years of maharanas adding courtyards on top of each other, and a room of English cut crystal ordered in 1877 by a ruler who died before it arrived. Back to the haveli, check out, and we are on the road west by half twelve with lunch somewhere on the way. The drive is four hours and in August it is not a transfer, it is the best scenery of the trip: the Aravallis turn green exactly once a year and this is the month, with cloud sitting in the valleys and the ghat road wet and dark from the last shower. Into the hillside resort around five, with enough light left for a first walk down to Nakki Lake if you want it. Dinner at the resort and an early night, because tomorrow starts before sunrise and we would rather you were awake for it.',
  '["9:30 AM — City Palace complex and the Crystal Gallery","12:30 PM — Depart for Mount Abu, 4 hr scenic drive, lunch en route","5:00 PM — Check-in at the hillside resort","Evening — Nakki Lake on your own if there is light left","7:30 PM — Dinner at the resort, early night before the sunrise"]',
  '{"breakfast": true, "lunch": false, "dinner": true}',
  'Hillside resort, Mount Abu'),

('22222222-2222-2222-2222-222222222001', 3,
  'Guru Shikhar at sunrise, Dilwara, and the bonfire',
  'A 5.30am start for Guru Shikhar, the highest point in the Aravallis at 1,722m — a short drive plus a climb of around 300 steps to the Datta temple at the top. On a clear monsoon morning you are standing above the cloud and looking down at it sitting in the valleys. This is the one early start on the trip and it is deliberately placed here, after a full night, rather than after the bonfire. Back to the resort for breakfast by eight, and then the morning is yours to do nothing with. Dilwara opens to sightseers only from midday, worship hours run earlier for Jain devotees, so we go at half twelve: five Jain temples built between the 11th and 13th centuries, carved from marble so thin the light comes through it. No phones, cameras or leather inside, shoulders and knees covered. Mid-afternoon is Nakki Lake for the Toad Rock walk and the valley sunset, boating on your own if you feel like it. The bonfire is tonight, the last night, with dinner around it and nothing at all to be up for in the morning.',
  '["5:30 AM — Depart for Guru Shikhar","6:15 AM — Sunrise at Guru Shikhar (1,722m), highest point in the Aravallis","8:00 AM — Breakfast at the resort","Free morning — rest, or the resort, or nothing","12:30 PM — Dilwara Jain Temples, tourist entry opens at noon","3:00 PM — Nakki Lake, the Toad Rock walk and sunset over the valley","7:30 PM — Bonfire evening and dinner at the resort"]',
  '{"breakfast": true, "lunch": false, "dinner": true}',
  'Hillside resort, Mount Abu'),

('22222222-2222-2222-2222-222222222001', 4,
  'The slow way back: Sajjangarh, and out',
  'No alarm. Breakfast properly, check out at half nine, and take the ghat road back down through the hills — the same four hours in reverse, and just as green. We come into Udaipur over the ridge rather than through the traffic, stopping at Sajjangarh, the Monsoon Palace, which was built in 1884 for exactly this weather and looks out over both lakes at once. An hour there is plenty. That still leaves the late afternoon free in the city for a last lunch, anything you missed on the first day, or simply sitting somewhere with a view of the water. We get you to the airport or the station by 6pm, so an 8pm flight out is comfortable.',
  '["9:30 AM — Relaxed breakfast and check-out","10:00 AM — Return drive to Udaipur through the Aravallis","2:00 PM — Sajjangarh Monsoon Palace, views over both lakes","3:30 PM — Free time in Udaipur, late lunch on your own","6:00 PM — Airport / railway station drop"]',
  '{"breakfast": true, "lunch": false, "dinner": false}',
  null);

-- ---------------------------------------------------------------------------
-- Departure: the 15 August launch batch
--
-- Saturday 15th to Tuesday 18th. 15 August 2026 falls on a Saturday, so this
-- costs two days of leave rather than one — the trade for not spending the
-- whole trip in a vehicle.
-- ---------------------------------------------------------------------------
delete from departures where trip_id = '22222222-2222-2222-2222-222222222001';

insert into departures (id, trip_id, start_date, end_date, total_seats, seats_booked, price_override, status) values
('33333333-3333-3333-3333-333333333001', '22222222-2222-2222-2222-222222222001',
  '2026-08-15', '2026-08-18', 18, 0, null, 'open'),
('33333333-3333-3333-3333-333333333002', '22222222-2222-2222-2222-222222222001',
  '2026-08-27', '2026-08-30', 18, 0, null, 'open');
