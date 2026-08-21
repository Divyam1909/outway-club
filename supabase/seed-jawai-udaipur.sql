-- ---------------------------------------------------------------------------
-- ESCAPE 001 — JAWAI × UDAIPUR — WILD. ROYAL. HUMAN.
--
--   Delhi → Jawai → Udaipur → Delhi
--   2 nights in Jawai + 1 full day in Udaipur
--   4 to 8 September 2026
--
-- This replaces the old Udaipur-first route on the same trip row. The row id
-- is deliberately unchanged: bookings, trip requests and the promo code all
-- point at it, and giving the new route a new row would orphan every one of
-- them. The slug changes (udaipur-jawai → jawai-udaipur), which the Next
-- config handles with a permanent redirect.
--
-- Run order:
--   1. supabase/migrations/0008_journey.sql   (adds the journey columns)
--   2. this file                              (frees edition 2)
--   3. supabase/seed-jawai-jodhpur.sql        (claims edition 2)
--
-- Idempotent — every statement is an upsert or a delete-then-insert.
--
-- AUTHORING CONVENTION, used by every array below:
--
--     "Label — the sentence that explains it"
--
-- and, in itinerary_days.activities specifically:
--
--     "Band (exact time) — What happens"
--
-- The website renders the band and drops the parenthetical; the brochure PDF
-- prints both. One row, two audiences: the traveller reads "Late afternoon",
-- ops read 4:00 PM. See splitActivity() in src/lib/utils.ts.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Escape 003 first, and this ordering is load-bearing.
--
-- `trips_edition_number_key` is a unique partial index, so Mount Abu has to
-- let go of 1 before Jawai × Udaipur can take it. It stays unpublished and
-- fully editable in the admin console; it is a real edition that ran, not a
-- deleted one.
-- ---------------------------------------------------------------------------
update trips
set edition_number = 3,
    spotlight_rank = 3,
    is_published = false,
    is_featured = false
where slug = 'udaipur-mount-abu';

-- ---------------------------------------------------------------------------
-- Destination: Jawai.
--
-- Jawai leads the title, so it leads the record. Udaipur stays a destination
-- in its own right — the Journal's first article is about it and the trip
-- spends its last day there — it just stops being the row this escape hangs
-- off.
-- ---------------------------------------------------------------------------
insert into destinations (id, slug, name, region, country, tagline, description, best_time, hero_image, gallery, is_featured) values
('11111111-1111-1111-1111-111111111002', 'jawai', 'Jawai', 'Rajasthan', 'India',
  'Granite hills, Rabari shepherds, and around fifty leopards nobody has ever hunted',
  'Three hours west of Udaipur the Aravallis stop being hills and become bare granite domes sitting straight out of flat scrub country. That is Jawai: a dam, a scatter of Rabari shepherd villages, and roughly fifty leopards living on the rocks directly above them. There is no national park boundary here and no fence. For a century the Rabari have treated the leopards as belonging to the temples in the caves, the leopards have kept to the granite, and neither has killed the other. It is one of the few places in India where big cats and people share a landscape rather than a schedule — which is why the point of coming is understanding the place, not collecting a sighting.',
  'September to March, greenest in September and coolest from November',
  '/images/jawai/hero.jpg',
  '["/images/jawai/gallery-1.jpg","/images/jawai/gallery-2.jpg","/images/jawai/gallery-3.jpg","/images/jawai/gallery-4.jpg"]',
  true)
on conflict (id) do update set
  slug = excluded.slug, name = excluded.name, region = excluded.region,
  tagline = excluded.tagline, description = excluded.description,
  best_time = excluded.best_time, hero_image = excluded.hero_image,
  gallery = excluded.gallery, is_featured = excluded.is_featured;

-- ---------------------------------------------------------------------------
-- Udaipur, re-stated for its new job.
--
-- It is no longer the base the escape runs out of. It is the second half of a
-- deliberate contrast — granite and silence, then water and colour — and the
-- copy should say that rather than list what is ninety minutes away.
-- ---------------------------------------------------------------------------
update destinations set
  tagline = 'The city built around water, in a state built around sand',
  description = 'Udaipur is the softest city in Rajasthan: lake water instead of desert, marble instead of sandstone, and evenings that slow to a stop somewhere on a ghat. Escape 001 arrives here from Jawai, which is the whole idea — you spend two days in granite, scrub and silence, then drive three hours east and walk into lakes, painted lanes and a city that has been decorative for four hundred years. The same state, and it does not feel like the same country. September catches the tail of the monsoon, which is when the Aravallis are green and the lakes are full.',
  best_time = 'July to March, with August and September the greenest'
where slug = 'udaipur';

-- ---------------------------------------------------------------------------
-- Escape 001
--
-- Pricing is land-only and says so out loud. ₹18,999 covers two nights in
-- leopard country, the safari, the naturalist, the Rabari host, every ground
-- transfer including the 150km crossing to Udaipur, and the Udaipur day. The
-- Delhi legs are booked with the group and billed at cost, which is in the
-- exclusions list in plain words rather than discovered later.
--
-- discounted_price is deliberately null: the departure code below is what
-- takes it to ₹16,999, so the struck-through number on the page is the real
-- list price rather than a second markup.
-- ---------------------------------------------------------------------------
insert into trips (
  id, slug, title, destination_id, category, trip_type,
  duration_days, duration_nights, difficulty,
  price_per_person, discounted_price, group_size_min, group_size_max, starting_point,
  short_description, description,
  highlights, inclusions, exclusions, things_to_carry,
  hero_image, gallery, rating, review_count, is_featured, is_group_trip, is_published,
  edition_number, spotlight_rank,
  promise, journey_route, really_booking, who_for, not_for, feelings
) values (
  '22222222-2222-2222-2222-222222222002',
  'jawai-udaipur',
  'Jawai × Udaipur',
  '11111111-1111-1111-1111-111111111002',
  'wildlife', 'group', 5, 4, 'easy',
  18999, null, 6, 18,
  'Delhi — we meet on the platform on the night of departure, and the exact station comes with your ticket',

  'Out of Delhi on a night train, two days in Jawai''s granite leopard country, then three hours east for one long, slow day in Udaipur. Five days, two of them spent travelling overnight, and eighteen people who arrive not knowing each other.',

  'Escape 001 runs the wrong way round on purpose. Most Rajasthan trips open with the postcard and end somewhere quieter. This one starts in the quiet. A night train out of Delhi, and you wake up at Jawai Bandh, where the hills give up and turn into huge bare granite domes. Two unhurried days: a Rabari shepherd family in country they have herded for generations, an open jeep with a naturalist who knows which leopards are denning where, the dam and its crocodiles, the cave temple at Devgiri, and one afternoon with nothing in it at all, because an escape should not feel like work. Around fifty leopards live on these rocks, above villages that have never hunted one. We will not promise you a sighting; nobody honest can. Then the last morning turns the whole trip around. Three hours east to Udaipur: the old city on foot, lunch where a local would actually eat, the lake at last light with the phones away. You get into Delhi on Tuesday having spent two days of leave.',

  '["Two nights in Jawai, which is two more than almost anybody gives it — enough to stop being a visitor and start recognising the place","Meet the Land: real time with a Rabari shepherd family, in the granite country they have herded for generations","An open-jeep exploration of Jawai with a local naturalist, built around understanding the landscape rather than chasing a photograph","Devgiri, the cave temple in the granite, where priests and leopards have shared a hill for longer than anyone can date","Jawai Bandh at first light: still water, mugger crocodiles on the bank, and whatever has flown in that week","The Story Circle — a fire, a sky full of stars, and one question: tell us about a journey that changed you","The Road Between Two Worlds: three hours that take you from bare granite to lake water without leaving the state","Udaipur at golden hour with the phones away, then The Last Table and The Letter"]',

  '["2 nights in Jawai, in a camp in leopard country, on twin sharing","An open-jeep Jawai exploration with a local naturalist","Meet the Land: a curated, responsibly arranged experience with a Rabari host","Private air-conditioned transport across the whole ground route, including the 150km crossing to Udaipur","A walk through Udaipur''s old city with a local host who lives in it","2 breakfasts, 2 lunches and 3 dinners, including The Outway Table in Jawai and The Last Table in Udaipur","All entry fees named in the journey","An Outway host with the group from the Delhi platform to the Delhi platform","All applicable taxes: the price you see is the price you pay"]',

  '["The Delhi legs. We book the overnight train out and the private overnight coach back alongside the group, and you pay the fare at cost — nothing is marked up on it","Anything eaten on the train, and lunch on the day you leave Delhi","A second Jawai safari, if the group wants one. Quoted separately, and never added just to make this list longer","Personal expenses, shopping, tips and anything at the bar","Travel insurance, we strongly recommend arranging your own","Single-occupancy upgrade, available on request and quoted separately"]',

  '["Original government photo ID, mandatory on the train and at check-in, no exceptions","Neutral colours for the safari — no white, no bright red","One warm layer. An open jeep at dusk in the hills is colder than the day suggests","A light rain jacket. Early September still catches the end of the monsoon","Comfortable walking shoes, and something you can slip off quickly at a temple","Modest clothing for Devgiri and Udaipur''s old-city temples: shoulders and knees covered","Sunscreen, a refillable water bottle, and anything you need for motion sickness on the ghat roads","Something to write with. Day 03 ends with a letter, and a borrowed pen is a poor start to one"]',

  '/images/jawai/hero.jpg',
  '["/images/jawai/gallery-2.jpg","/images/jawai/gallery-1.jpg","/images/udaipur/gallery-3.jpg","/images/jawai/gallery-3.jpg","/images/udaipur/gallery-1.jpg","/images/jawai/gallery-4.jpg"]',
  0, 0, true, true, true,
  1, 1,

  'Come looking for the wild. Leave with a story.',

  '["Delhi — A night train out, and a carriage of people who do not know each other yet","Jawai — Granite, shepherds, and the animal nobody will promise you","The Sunset — Chai on a warm rock, and the first silence nobody rushes to fill","The Story Circle — A fire, and the question: tell us about a journey that changed you","The Road — Three hours between two entirely different Rajasthans","Udaipur — Water, marble and colour, after two days of stone and scrub","Golden Hour — The last light on the lake, phones away, nobody narrating it","The Last Table — One table, one question: what are you taking home from this journey?","The Letter — A note to somebody you met four days ago, handed over before you leave","Home — Into Delhi on Tuesday morning, with a group thread that stays open"]',

  '["Conversations — Not a bus seat and a hotel key. The people sitting next to you are the actual product","Local stories, told locally — A Rabari family''s, a naturalist''s, a boatman''s. Told by them, not repeated by us","Unhurried time — Whole hours with nothing scheduled in them, deliberately, because that is where a trip becomes a journey","One place, understood — Two days in Jawai instead of six towns photographed from a moving vehicle","A group that learns your name — Eighteen people, one table each evening, four days","The experience, not the sighting — Jawai is wild country. We will never sell you a leopard we cannot promise"]',

  '["You want to travel without knowing anyone — Most people on this book alone. You do not have to know anybody before you come. That is the point","You would rather understand one place than tick off six","You are comfortable with an afternoon that has nothing planned in it","You are curious about people, not only about monuments","You want the wild without a national park gate, a numbered zone and a queue of jeeps"]',

  '["You want a guaranteed leopard — Jawai is open country, not an enclosure, and we will not pretend otherwise to close a booking","You want ten places in three days — This does the opposite, on purpose","You want a private trip — This one is shared, and the sharing is the product","You need five-star standards throughout — Jawai is camp country. It is comfortable and well run, and it is not a city hotel","You would rather not talk to anyone — Every evening here is built around a conversation"]',

  '["Jawai — Discover","Udaipur — Experience","Outway — Connect"]'
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
  edition_number = excluded.edition_number, spotlight_rank = excluded.spotlight_rank,
  promise = excluded.promise, journey_route = excluded.journey_route,
  really_booking = excluded.really_booking, who_for = excluded.who_for,
  not_for = excluded.not_for, feelings = excluded.feelings;

-- ---------------------------------------------------------------------------
-- The journey, day 00 to day 04.
--
-- It starts at zero because the trip starts on a platform in Delhi, not at a
-- camp in Jawai, and calling that "Day 1" would quietly move the meeting point
-- a night later in the reader's head. `day_number` has no positivity check and
-- the timeline renders whatever integer it is given, so 00 costs nothing.
-- ---------------------------------------------------------------------------
delete from itinerary_days where trip_id = '22222222-2222-2222-2222-222222222002';

insert into itinerary_days (trip_id, day_number, title, description, activities, meals, accommodation) values
('22222222-2222-2222-2222-222222222002', 0,
  'Leave Ordinary',
  'The journey starts on a platform in Delhi, with people you have not met. Your Outway host finds you, hands you a Journey Card, and that is the last piece of admin for five days. The train pulls out late and the carriage does what carriages do — somebody has snacks, somebody has a speaker, somebody knows a card game, and at some point the question goes round that this whole thing is built on: what made you say yes to this journey? Answers vary wildly and that is the interesting part. Sleep when you feel like it. Tomorrow is deliberately unhurried, so an imperfect night on a train costs you nothing at all.',
  '["Evening (8:30 PM) — Meet your Outway host and the group on the platform in Delhi","Departure (10:25 PM) — The overnight train west, booked with the group so nobody travels in alone","On board — Journey Cards, introductions, and the first question: what made you say yes to this journey?","Late — Music, chai, a card game, and whoever is still awake","Sleep. Day 01 does not start early"]',
  '{"breakfast": false, "lunch": false, "dinner": false}',
  'Overnight train, Delhi to Jawai Bandh'),

('22222222-2222-2222-2222-222222222002', 1,
  'Enter the Wild',
  'You see Jawai before the train stops. The hills flatten out and then the granite starts — enormous smooth domes sitting straight out of the scrub, nothing like the Rajasthan on the postcards. We collect you at Jawai Bandh and take you to the camp, and then we deliberately do nothing for a while. Breakfast is slow. Nobody is rushed into a jeep. The first thing that happens here is that somebody who lives here explains the place to you, because Jawai makes no sense until you understand the arrangement it runs on: the Rabari have herded these hills for generations, around fifty leopards live on the rocks directly above the villages, and in living memory neither has killed the other. Late afternoon is when the granite gives its warmth back and the cats come out onto it, so that is when we go out — an open jeep, a naturalist who knows which family is denning where, and no promises. The sighting is never promised. The experience is. Afterwards we take chai up onto a rock for the sunset and stay past the point where anybody would normally head back to their room. Dinner is outside. If the fire is allowed, there is a fire, and around it the Story Circle: tell us about a journey that changed you.',
  '["Morning (9:50 AM) — Into Jawai Bandh, and the granite starts before the station does","Slow breakfast (10:30 AM) — At the camp. Nothing is scheduled for an hour and that is deliberate","Meet the Land (12:00 PM) — Time with a Rabari shepherd family, with a local host who can translate more than the language","Rest (2:00 PM) — The afternoon heat is not a thing worth fighting","Late afternoon (4:00 PM) — Open-jeep exploration of Jawai with a local naturalist","Jawai Sunset (6:45 PM) — Chai on a granite dome, and nobody in a hurry to leave","After dark (8:30 PM) — Dinner, stars, a fire where it is permitted, and The Story Circle"]',
  '{"breakfast": true, "lunch": true, "dinner": true}',
  'Jawai — camp in leopard country, twin sharing'),

('22222222-2222-2222-2222-222222222002', 2,
  'Live the Wild, Slowly',
  'No packed sightseeing today, and no apology for it. Breakfast runs long, the coffee is good, and the hills are doing exactly nothing in particular. Mid-morning we go down to Jawai Bandh — the dam is full this time of year, mugger crocodiles sit out on the banks, and whatever has flown in for the season is out on the water. From there it is a short way to Devgiri, a cave temple set into the granite where local families have come to worship for as long as anyone can date, often with a leopard asleep on the rock above them. Nobody there finds that remarkable, which is the most remarkable thing about it. Lunch is Marwari, cooked by people who live here. Then the afternoon is yours, genuinely: read, photograph, sleep, talk, walk, or nothing. An escape should not feel like work. If the group wants a second time out in the jeep and the season allows it, we go — and if we do not, this list does not get padded to look bigger. The last night in Jawai is The Outway Table: everybody, one dinner, and the question that turns a group into something else. What surprised you most about this place?',
  '["Slow morning (8:00 AM) — Breakfast, coffee, and no agenda until you have finished both","Beyond the Leopard (10:00 AM) — Jawai Bandh at its fullest, the muggers on the bank, and the birds that come with the water","Devgiri (11:30 AM) — The cave temple in the granite, where the priests and the leopards share a hill","The local table (1:00 PM) — Marwari lunch, cooked by people who live here","Your Afternoon (2:30 PM) — Free. Read, photograph, sleep, talk, or nothing at all","Second Wild (4:00 PM) — An optional second time out, if the group wants it and the season allows","The Outway Table (8:30 PM) — Last dinner in Jawai: what surprised you most about this place?"]',
  '{"breakfast": true, "lunch": true, "dinner": true}',
  'Jawai — camp in leopard country, twin sharing'),

('22222222-2222-2222-2222-222222222002', 3,
  'From the Wild to the Royal',
  'Three hours east, and Rajasthan changes species. The granite gives way to green Aravalli ridges, the ridges give way to water, and you arrive in a city that has spent four hundred years being decorative. We call this stretch The Road Between Two Worlds and we treat it as part of the journey rather than a transfer — the windows are the point, there is music, there are the stories that only come out once a group has been together three days, and there is one stop along it worth making. Udaipur starts on foot. Not a monument race: a walk through the old city with somebody who lives in it and can tell you why the lanes are the shape they are, what the doors mean, and which of it is actually old. Lunch is a food experience rather than the nearest restaurant with a table free. Then an hour is yours — a café, a camera, the shops, or a wall by the water. Golden hour is the last thing we plan, and it is the one we ask you to put your phone away for: the lake, the light going, and enough quiet to notice that four days have happened. Dinner is everybody at one table, and one question. Then everybody writes a letter to somebody they met on Saturday, and hands it over. The coach out is late enough that nobody has to cut that short.',
  '["Check out (8:30 AM) — Breakfast, goodbyes to the camp, then the road","The Road Between Two Worlds (9:30 AM) — Three hours east through the Aravallis, with one stop worth making","Walk Into the Story (1:00 PM) — Udaipur''s old city on foot with a local host. Places and stories, not a monument race","The Local Table (2:30 PM) — Lunch as a food experience, not the nearest restaurant with a free table","Your Udaipur Hour (4:00 PM) — Cafés, cameras, shopping, walking, or a wall by the water","Golden Hour (6:15 PM) — The lake at last light. Phones away for this one","The Last Table (8:00 PM) — Final dinner together: what are you taking home from this journey?","The Letter (9:30 PM) — Write to someone you met here. Exchange before you leave","Departure (10:30 PM) — Private overnight coach, Udaipur to Delhi"]',
  '{"breakfast": true, "lunch": true, "dinner": true}',
  'Overnight coach, Udaipur to Delhi'),

('22222222-2222-2222-2222-222222222002', 4,
  'Return Home',
  'Into Delhi in the morning, two days of leave spent. Nobody goes home a stranger — the group thread stays open, the photographs land on it over the next week, and so does the answer to whatever you forgot to ask on Monday night. That is the part of this that does not fit in an itinerary, and it is the part people write to us about afterwards.',
  '["Morning (7:00 AM) — Into Delhi","The group thread stays open, and so does the invitation"]',
  '{"breakfast": false, "lunch": false, "dinner": false}',
  null);

-- ---------------------------------------------------------------------------
-- The 4 September departure. Friday night out, Tuesday morning back.
-- ---------------------------------------------------------------------------
delete from departures where trip_id = '22222222-2222-2222-2222-222222222002';

insert into departures (id, trip_id, start_date, end_date, total_seats, seats_booked, price_override, status) values
('33333333-3333-3333-3333-333333333003', '22222222-2222-2222-2222-222222222002',
  '2026-09-04', '2026-09-08', 18, 0, null, 'open');

-- ---------------------------------------------------------------------------
-- The departure code.
--
-- ₹2,000 a head off ₹18,999, landing on ₹16,999 — the number this actually
-- runs at. The list price is not inflated to fund it; it is what the escape
-- costs without the code, which is why the struck-through figure on the page
-- is a real one.
--
-- The trip leaves on Janmashtami night, so the code keeps its name — but the
-- copy no longer claims you land in Udaipur for Nandotsav, because on this
-- route you land in Jawai. auto_apply, so nobody has to know it exists.
-- per_user_limit stays at 3: nothing is charged on a request and people
-- genuinely re-send after a typo.
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
  'Janmashtami departure',
  '₹2,000 off every traveller on Escape 001, which leaves Delhi on Janmashtami night and wakes up in leopard country.',
  'flat', 2000, true,
  0, 1,
  null, 3,
  '2026-08-19 00:00:00+05:30', '2026-09-04 23:59:59+05:30', true, true,
  '["22222222-2222-2222-2222-222222222002"]',
  null,
  'Event code for the 4 Sept departure. Auto-applies, so it shows on the trip page as the live price without anyone typing it.'
)
on conflict (id) do update set
  code = excluded.code, label = excluded.label, description = excluded.description,
  discount_type = excluded.discount_type, discount_value = excluded.discount_value,
  per_traveler = excluded.per_traveler, min_order_amount = excluded.min_order_amount,
  min_travelers = excluded.min_travelers, usage_limit = excluded.usage_limit,
  per_user_limit = excluded.per_user_limit, starts_at = excluded.starts_at,
  ends_at = excluded.ends_at, is_active = excluded.is_active, auto_apply = excluded.auto_apply,
  trip_ids = excluded.trip_ids, notes = excluded.notes, updated_at = now();
