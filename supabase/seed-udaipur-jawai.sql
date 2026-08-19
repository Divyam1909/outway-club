-- ---------------------------------------------------------------------------
-- Escape 002: Udaipur × Jawai — 4 to 8 September 2026
--
-- Departs on the night of Janmashtami (Friday 4 September 2026), lands in
-- Udaipur on Nandotsav morning, spends two days in the lake city and the
-- Krishna temples around it, then crosses to Jawai for the leopards before the
-- overnight run home.
--
-- Run after supabase/migrations/0007_promos_blog_roles.sql. Idempotent — every
-- statement is an upsert or a delete-then-insert, so re-running replaces the
-- escape cleanly rather than duplicating it.
--
-- Photography is Udaipur's own, from the same shoot the launch escape uses.
-- There is no Jawai photography yet; rather than dress a stock leopard up as
-- ours, the gallery stays on the half of the route we have actually shot.
-- Replace it from the admin trip editor the day we come back with the files.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Udaipur, re-stated. Escape 001 paired it west with Mount Abu; 002 pairs it
-- north-west with Jawai, so the destination copy should stop naming one hill
-- station as though it were the only thing next door.
-- ---------------------------------------------------------------------------
update destinations set
  tagline = 'The city built around water, in a state built around sand',
  description = 'Udaipur is the softest city in Rajasthan: lake water instead of desert, marble instead of sandstone, and evenings that slow to a stop somewhere on a ghat. It is also the best base in the state — Nathdwara and the Shrinathji temple are ninety minutes north, Kankroli''s Dwarkadhish sits on the Rajsamand lake past it, and Jawai''s granite leopard country is three hours west. September catches the tail of the monsoon, which is when the Aravallis are green and the lakes are full.',
  best_time = 'July to March, with August and September the greenest'
where slug = 'udaipur';

-- ---------------------------------------------------------------------------
-- Escape 001 goes dark.
--
-- Not deleted — bookings, requests and the itinerary all still point at it, and
-- it comes back the day new dates open. `is_published = false` removes it from
-- the catalogue, the homepage, the sitemap and its own public URL, while
-- leaving it fully editable in the admin console.
-- ---------------------------------------------------------------------------
update trips
set is_published = false,
    spotlight_rank = 2,
    is_featured = false
where slug = 'udaipur-mount-abu';

-- ---------------------------------------------------------------------------
-- Escape 002
--
-- price_per_person is ₹8,999 and discounted_price is deliberately null: the
-- Janmashtami code below is what takes it to ₹7,999, which is the number we
-- actually run the trip at. Two prices on the page, one of them struck
-- through, and the discount is real rather than a second markup.
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
  '22222222-2222-2222-2222-222222222002',
  'udaipur-jawai',
  'Udaipur × Jawai',
  '11111111-1111-1111-1111-111111111001',
  'weekend', 'group', 5, 4, 'easy',
  8999, null, 6, 18,
  'Udaipur — with the overnight train or coach out of your city on the night of 4 September arranged alongside the group',

  'Out on Janmashtami night, into Udaipur for Nandotsav, two days across the lake city and the Krishna temples north of it, then three hours west to Jawai for the leopards. Five days door to door, two days of leave.',

  'Escape 002 is built around a date rather than a season. Janmashtami falls on Friday 4 September 2026, and the trip leaves that night — so the midnight aarti happens somewhere on the road, and you walk into Udaipur on Nandotsav morning, the day the celebration comes out of the temples and into the streets. That first afternoon is deliberately loose: check in, eat, and let the old city do what it does, before the Jagdish Temple at its noisiest and a boat on Lake Pichola at last light. The second day starts early and goes north — Shrinathji at Nathdwara is the most important Krishna shrine in Rajasthan and it is still dressed for the festival, and Dwarkadhish at Kankroli sits on the Rajsamand lake on the way back. Afternoon is the City Palace, evening is Sajjangarh with both lakes below you, and the night is a rooftop table facing a floodlit palace. Then the trip changes character completely. Three hours west, past where the Aravallis stop being hills and start being bare granite, is Jawai: a dam, a scatter of Rabari shepherd villages, and around fifty leopards living on the rocks directly above them — a place where, for a century, nobody has killed one and no leopard has killed anyone. We take an open jeep out through it in the late afternoon, watch the sun go down off a rock, eat, and put you on the overnight train home. You are back on Tuesday morning having spent two days of leave. Eighteen travellers, one trip captain, every stay, transfer, train and safari booked before this went on sale.',

  '["Leaves on Janmashtami night, 4 September — the midnight aarti happens on the road, and you land in Udaipur on Nandotsav morning","Shrinathji at Nathdwara, the most important Krishna shrine in Rajasthan, on the one week of the year it is fully dressed for the festival","Dwarkadhish at Kankroli, on the water at Rajsamand — the Krishna temple almost nobody outside Mewar makes the trip for","Open-jeep leopard safari through Jawai''s granite hills, where roughly fifty leopards live directly above villages that have never killed one","Sunset boat on Lake Pichola, past Jag Mandir and the Taj Lake Palace as the ghats light up","Jagdish Temple and the old-city Krishna shrines at their loudest, two minutes off the City Palace ramp","Sajjangarh, the Monsoon Palace, at golden hour with Pichola and Fateh Sagar both below you","Rooftop dinner at Ambrai Ghat, facing the floodlit City Palace across the water"]',

  '["2 nights in a boutique haveli inside Udaipur''s old city, on twin sharing","Return overnight train or coach between your city and Rajasthan, booked with the group","Private air-conditioned transport for the full route, including the Nathdwara run and the 160km crossing to Jawai","One open-jeep leopard safari at Jawai, with a local naturalist","Sunset boat ride on Lake Pichola","2 breakfasts, 1 lunch and 3 dinners, including the rooftop dinner at Ambrai Ghat","All monument, temple and safari entry fees named in the itinerary","A dedicated Outway trip captain for all five days","All applicable taxes: the price you see is the price you pay"]',

  '["Lunches on days 2 and 3, and anything eaten on the train","Personal expenses, shopping, tips and anything at the bar","Travel insurance, we strongly recommend arranging your own","A second safari at Jawai (available on request, quoted separately)","Any activity or entry not named in the inclusions list","Single-occupancy room upgrade (available on request, quoted separately)"]',

  '["Original government photo ID, mandatory at hotel check-in and on the train, no exceptions","Modest clothing for Nathdwara and Jagdish: shoulders and knees covered. Nathdwara bans phones and cameras inside the temple entirely","Neutral colours for the safari — no white, no bright red","One warm layer: an open jeep at dusk in the hills is colder than the day suggests","A light rain jacket, September still catches the end of the monsoon","Comfortable walking shoes, and something you can slip off quickly at temples","Sunscreen, a refillable water bottle, and anything you need for motion sickness on the ghat roads"]',

  '/images/udaipur/hero.jpg',
  '["/images/escape-001/hero.jpg","/images/udaipur/gallery-1.jpg","/images/escape-001/gallery-1.jpg","/images/udaipur/gallery-2.jpg","/images/udaipur/gallery-3.jpg","/images/escape-001/gallery-2.jpg"]',
  0, 0, true, true, true,
  2, 1
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
-- Itinerary: 5 days, and two of the nights are on a train.
--
-- Days 1 and 5 are the overnight journeys. They get their own rows rather than
-- being folded into "arrive" and "depart" lines, because they are half the
-- reason this trip costs two days of leave instead of four, and because a
-- traveller reading the page needs to know the trip starts at a station in
-- their own city on Friday evening, not in Udaipur on Saturday.
-- ---------------------------------------------------------------------------
delete from itinerary_days where trip_id = '22222222-2222-2222-2222-222222222002';

insert into itinerary_days (trip_id, day_number, title, description, activities, meals, accommodation) values
('22222222-2222-2222-2222-222222222002', 1,
  'Janmashtami night: out of the city while it''s still celebrating',
  'The trip starts at a platform in your own city, not in Udaipur. Friday 4 September is Janmashtami, so you leave with the temples still full — we meet at the boarding point in the evening, and the overnight train or coach out to Rajasthan is booked with the rest of the group so nobody is travelling alone on the way in. Midnight is the moment Krishna is said to have been born, and every temple on this route marks it with an aarti; you will be somewhere between two states for it, which is a stranger and better way to spend the night than most. Your trip captain travels with you from here. Sleep when you can — tomorrow is deliberately unhurried, so an imperfect night on a train costs you nothing.',
  '["Evening — Meet your trip captain and the group at the boarding point","9:00 PM — Overnight train or coach towards Udaipur, booked with the group","12:00 AM — Janmashtami midnight, somewhere on the road","Sleep. Day 2 does not start early"]',
  '{"breakfast": false, "lunch": false, "dinner": false}',
  'Overnight train or coach'),

('22222222-2222-2222-2222-222222222002', 2,
  'Into Udaipur on Nandotsav, and the lake at last light',
  'Into Udaipur around 11am and straight to a boutique haveli inside the old city, close enough to the ghats to walk everywhere that matters. The rest of the afternoon is yours on purpose — lunch on your own, a proper shower, an hour in the lanes, or nothing at all. We start again at 3.30pm, and the timing is the point: today is Nandotsav, the day after Krishna''s birth, when the celebration comes out of the temples and into the streets. The Jagdish Temple is at its loudest, the old-city Krishna shrines around it are dressed and open, and the whole thing is happening two minutes off the City Palace ramp where most visitors never turn. At 5.30pm we board a private boat on Lake Pichola for the end of the light, out past Jag Mandir and the Taj Lake Palace as the ghats start lighting up. Bagore Ki Haveli runs the 7pm Dharohar show a two-minute walk from where the boat lands — Rajasthan''s folk and classical repertoire under one roof — and we book seats for anyone who wants them. Dinner either way is a rooftop table at Ambrai Ghat, directly across the water from a floodlit City Palace.',
  '["11:00 AM — Arrive Udaipur, check in at the haveli in the old city","Free afternoon — lunch on your own, and the lanes","3:30 PM — Jagdish Temple and the old-city Krishna shrines, at their loudest for Nandotsav","5:30 PM — Sunset boat on Lake Pichola, past Jag Mandir","7:00 PM — Dharohar folk show at Bagore Ki Haveli, optional","8:30 PM — Rooftop dinner at Ambrai Ghat, facing the City Palace"]',
  '{"breakfast": false, "lunch": false, "dinner": true}',
  'Boutique haveli, Udaipur old city'),

('22222222-2222-2222-2222-222222222002', 3,
  'Shrinathji at dawn, the City Palace after, both lakes at sunset',
  'The one early start of the trip, and it buys the thing this weekend was built around. We leave at six for Nathdwara, ninety minutes north, where Shrinathji is the most important Krishna shrine in Rajasthan — the deity was carried here from Vrindavan in the 1670s and has not moved since, and the temple runs on eight darshan windows a day rather than a queue. Janmashtami week is the one stretch of the year it is fully dressed, and the early slot is the quiet one. Cameras and phones do not go past the gate, which turns out to be the best thing about it. On the way back we stop at Kankroli for the Dwarkadhish temple, sitting directly on the Rajsamand lake with steps down to the water, and almost nobody outside Mewar makes the trip for it. Back in Udaipur by half twelve with the afternoon for the City Palace: four hundred years of maharanas building courtyards on top of each other, plus the Crystal Gallery, a room of English cut crystal ordered in 1877 by a ruler who died before it arrived. Sunset is at Sajjangarh, the Monsoon Palace, up on the ridge with Pichola and Fateh Sagar both below you at once. Last dinner in Udaipur down by the ghats, and an early night — tomorrow is a long, good day.',
  '["6:00 AM — Depart for Nathdwara, 90 min north","7:45 AM — Shrinathji darshan, dressed for Janmashtami week. No phones or cameras inside","10:00 AM — Dwarkadhish Temple, Kankroli, on the Rajsamand lake","12:30 PM — Back in Udaipur, lunch on your own","2:30 PM — City Palace complex and the Crystal Gallery","5:00 PM — Sajjangarh Monsoon Palace, sunset over both lakes","8:00 PM — Dinner by the ghats"]',
  '{"breakfast": true, "lunch": false, "dinner": true}',
  'Boutique haveli, Udaipur old city'),

('22222222-2222-2222-2222-222222222002', 4,
  'Jawai: granite, shepherds, leopards, and the train home',
  'Check out at six and drive west. It takes about three hours, and somewhere along it the Aravallis stop being green hills and turn into bare granite domes sitting straight out of the ground — that is Jawai, and it looks like nowhere else in the state. Breakfast at the camp near the dam, then the morning is the country itself: Jawai Bandh, the crocodiles that live in it, flamingos if the water is right, and the Rabari shepherd villages that make this place what it is. Around fifty leopards live on these rocks, directly above those villages, and in living memory neither has killed the other — the Rabari treat them as the temples'' own, and the leopards keep to the granite. It is one of the few places in India you can watch big cats without a national park around them. We eat, then sit out the heat, because the safari is late afternoon when the rocks give their warmth back and the cats come out onto them. An open jeep, a local naturalist who knows which family is denning where, and roughly three hours. Sunset off a rock afterwards, dinner, and then we drive you to the railhead for the overnight train home. It is the right way to end this one: you leave Jawai in the dark, still talking about it.',
  '["6:00 AM — Check out and depart for Jawai, roughly 3 hr","9:00 AM — Breakfast at the camp near Jawai Bandh","10:00 AM — Jawai Dam, the crocodile point, and Rabari shepherd country","12:30 PM — Lunch, then rest through the heat of the day","3:30 PM — Open-jeep leopard safari through the granite hills, with a naturalist","6:45 PM — Sunset from the rocks, then dinner","9:00 PM — Transfer to the railhead for the overnight train home"]',
  '{"breakfast": true, "lunch": true, "dinner": true}',
  'Overnight train or coach'),

('22222222-2222-2222-2222-222222222002', 5,
  'Home by Tuesday morning',
  'In to your own city in the morning, with two days of leave spent and five days of trip behind you. Your trip captain stays on the group thread for a few days after — for the photographs, for the name of the place we ate on Saturday, and for whatever you decide you want to go back for.',
  '["Morning — Arrive back in your city","Photographs and the group thread stay open for a few days"]',
  '{"breakfast": false, "lunch": false, "dinner": false}',
  null);

-- ---------------------------------------------------------------------------
-- The 4 September departure.
--
-- Friday night out, Tuesday morning back. 4 September 2026 is Janmashtami and
-- a Friday, which is the whole reason these are the dates.
-- ---------------------------------------------------------------------------
delete from departures where trip_id = '22222222-2222-2222-2222-222222222002';

insert into departures (id, trip_id, start_date, end_date, total_seats, seats_booked, price_override, status) values
('33333333-3333-3333-3333-333333333003', '22222222-2222-2222-2222-222222222002',
  '2026-09-04', '2026-09-08', 18, 0, null, 'open');

-- ---------------------------------------------------------------------------
-- The Janmashtami code.
--
-- Flat ₹1,000 a head off ₹8,999, which lands on exactly ₹7,999 — the price we
-- actually run this trip at. Nothing is marked up to fund it: ₹8,999 is the
-- same list price the launch escape has carried since the beginning, so the
-- struck-through number on the page is a real one.
--
-- auto_apply, so nobody has to know the code exists to get the offer, and
-- trip_ids pins it to this escape alone. It stops itself at the end of
-- Janmashtami day — no cron job, no deploy, the window is in the row.
--
-- per_user_limit is 3 rather than 1. Nothing is charged on a request and people
-- genuinely re-send after a typo; a limit of one would quietly take the
-- discount away from the corrected version, which is the last thing that should
-- happen. Seats are what actually caps this, and ops confirm every one by hand.
-- ---------------------------------------------------------------------------
insert into promo_codes (
  id, code, label, description,
  discount_type, discount_value, per_traveler,
  min_order_amount, min_travelers,
  usage_limit, per_user_limit,
  starts_at, ends_at, is_active, auto_apply,
  trip_ids, partner_name, notes
) values (
  '55555555-5555-5555-5555-555555555001',
  'JANMASHTAMI',
  'Janmashtami special',
  '₹1,000 off every traveller on Escape 002, which leaves on Janmashtami night and lands in Udaipur for Nandotsav.',
  'flat', 1000, true,
  0, 1,
  null, 3,
  '2026-08-19 00:00:00+05:30', '2026-09-04 23:59:59+05:30', true, true,
  '["22222222-2222-2222-2222-222222222002"]',
  null,
  'Event code for the 4 Sept departure. Auto-applies, so it appears on the trip page as the live price without anyone typing it.'
)
on conflict (id) do update set
  code = excluded.code, label = excluded.label, description = excluded.description,
  discount_type = excluded.discount_type, discount_value = excluded.discount_value,
  per_traveler = excluded.per_traveler, min_order_amount = excluded.min_order_amount,
  min_travelers = excluded.min_travelers, usage_limit = excluded.usage_limit,
  per_user_limit = excluded.per_user_limit, starts_at = excluded.starts_at,
  ends_at = excluded.ends_at, is_active = excluded.is_active, auto_apply = excluded.auto_apply,
  trip_ids = excluded.trip_ids, notes = excluded.notes, updated_at = now();
