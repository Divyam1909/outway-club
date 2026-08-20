-- ---------------------------------------------------------------------------
-- ESCAPE 002 — JAWAI × JODHPUR — WILD. BLUE. HUMAN.
--
--   Delhi → Jawai → Jodhpur → Delhi
--   2 nights in Jawai + 1 full day in Jodhpur
--   23 to 27 October 2026
--
-- DRAFT. `is_published = false`, which means this escape does not exist on the
-- public site in any form: /trips/jawai-jodhpur 404s, it is absent from the
-- catalogue, the homepage, the sitemap and the RSS feed, and no destination
-- row points at it. It is fully visible and editable at /admin/trips.
--
-- Publishing it is one checkbox in the admin trip editor. Before flicking it,
-- two things need doing: a stay named for the Jodhpur night, and confirmed
-- pricing — the number below is carried across from Escape 001 rather than
-- costed from a Jodhpur supplier. public/images/jodhpur/ is filled in, though
-- with model-generated stand-ins rather than photographs.
--
-- Deliberately no destination row for Jodhpur. A `destinations` row renders on
-- /destinations and in the homepage grid the moment it exists, with or without
-- a published trip behind it, which would leak this escape's existence. The
-- trip hangs off Jawai, which is the half of the route that is public anyway.
--
-- Run order: after supabase/seed-jawai-udaipur.sql, which is what frees
-- edition number 2. Idempotent.
--
-- Authoring convention for the arrays, same as Escape 001:
--   "Label — the sentence that explains it"
--   activities: "Band (exact time) — What happens"
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
  '22222222-2222-2222-2222-222222222003',
  'jawai-jodhpur',
  'Jawai × Jodhpur',
  '11111111-1111-1111-1111-111111111002',
  'wildlife', 'group', 5, 4, 'easy',
  18999, null, 6, 18,
  'Delhi — we meet on the platform on the night of departure, and the exact station comes with your ticket',

  'The same two days in Jawai''s leopard country, and then two and a half hours north instead of three hours east — into the blue city, the fort above it, and one long day of Marwar.',

  'Escape 002 is Escape 001''s other half. The first three days are the same argument: leave Delhi on a night train, wake up in Jawai, and spend two unhurried days learning one piece of country properly rather than photographing six. Granite domes, Rabari shepherd families who have herded these hills for generations, around fifty leopards living on the rocks above their villages, and an open jeep out into it late in the afternoon with a naturalist who knows the ground. We do not promise the sighting. The sighting is never promised. The experience is. Where this one diverges is the third morning. Instead of turning east into lake country, you go north — two and a half hours into Marwar, where the green runs out and the light goes hard and clean, and a thousand indigo-washed houses pile up under the largest fort in Rajasthan. Jodhpur is a louder city than Udaipur and a more honest one; the old city is still a working bazaar rather than a heritage set, and the best hour of the day is spent inside it rather than looking at it. Mehrangarh from the inside, the stepwell at Toorji Ka Jhalra where the whole neighbourhood still gathers, the lanes below the fort, and Jaswant Thada in the last light with the marble going translucent. Then the whole group at one table, letters written and handed over, and the overnight train home. Into Delhi on Tuesday morning, two days of leave spent.',

  '["Two nights in Jawai — enough to stop being a visitor and start recognising the place","Meet the Land: real time with a Rabari shepherd family in the granite country they have herded for generations","An open-jeep exploration of Jawai with a local naturalist, built around understanding the landscape rather than chasing a photograph","Devgiri, the cave temple in the granite, where priests and leopards have shared a hill for longer than anyone can date","The Story Circle — a fire, a sky full of stars, and one question: tell us about a journey that changed you","Mehrangarh from the inside: five hundred years of Marwar, on a rock five hundred feet above its own city","Toorji Ka Jhalra, the eighteenth-century stepwell the neighbourhood still uses, and the blue lanes around it","Jaswant Thada at golden hour, when the marble goes translucent, then The Last Table and The Letter"]',

  '["2 nights in Jawai, in a camp in leopard country, on twin sharing","An open-jeep Jawai exploration with a local naturalist","Meet the Land: a curated, responsibly arranged experience with a Rabari host","Private air-conditioned transport across the whole ground route, including the crossing to Jodhpur","A walk through Jodhpur''s old city and bazaar with a local host who lives in it","2 breakfasts, 2 lunches and 3 dinners, including The Outway Table in Jawai and The Last Table in Jodhpur","All entry fees named in the journey, including Mehrangarh and Jaswant Thada","An Outway host with the group from the Delhi platform to the Delhi platform","All applicable taxes: the price you see is the price you pay"]',

  '["The Delhi legs. We book the overnight trains either side alongside the group, and you pay the fare at cost — nothing is marked up on it","Anything eaten on the train, and lunch on the day you leave Delhi","A second Jawai safari, if the group wants one. Quoted separately, and never added just to make this list longer","Personal expenses, shopping, tips and anything at the bar","Travel insurance, we strongly recommend arranging your own","Single-occupancy upgrade, available on request and quoted separately"]',

  '["Original government photo ID, mandatory on the train and at check-in, no exceptions","Neutral colours for the safari — no white, no bright red","One warm layer. Late October nights in Marwar drop further than the days suggest, and an open jeep at dusk drops further still","Comfortable walking shoes. Mehrangarh is a climb and the old city is cobbles","Modest clothing for Devgiri and the old-city temples: shoulders and knees covered","Sunglasses and sunscreen. October light in Jodhpur is clean, bright and unrelenting","A refillable water bottle, and anything you need for motion sickness on the hill roads","Something to write with. Day 03 ends with a letter, and a borrowed pen is a poor start to one"]',

  '/images/jodhpur/hero.jpg',
  '["/images/jawai/gallery-2.jpg","/images/jodhpur/gallery-1.jpg","/images/jawai/gallery-1.jpg","/images/jodhpur/gallery-2.jpg","/images/jawai/gallery-3.jpg","/images/jodhpur/gallery-4.jpg"]',
  0, 0, false, true, false,
  2, null,

  'Come looking for the wild. Leave with a story.',

  '["Delhi — A night train out, and a carriage of people who do not know each other yet","Jawai — Granite, shepherds, and the animal nobody will promise you","The Sunset — Chai on a warm rock, and the first silence nobody rushes to fill","The Story Circle — A fire, and the question: tell us about a journey that changed you","The Road — Two and a half hours north, and the green runs out","Jodhpur — A thousand indigo houses under the biggest fort in Rajasthan","The Bazaar — An old city that is still working, not preserved","Golden Hour — Jaswant Thada in the last light, with the marble going translucent","The Last Table — One table, one question: what are you taking home from this journey?","Home — Into Delhi on Tuesday morning, with a group thread that stays open"]',

  '["Conversations — Not a bus seat and a hotel key. The people sitting next to you are the actual product","Local stories, told locally — A Rabari family''s, a naturalist''s, a bazaar trader''s. Told by them, not repeated by us","Unhurried time — Whole hours with nothing scheduled in them, deliberately, because that is where a trip becomes a journey","One place, understood — Two days in Jawai instead of six towns photographed from a moving vehicle","A group that learns your name — Eighteen people, one table each evening, four days","The experience, not the sighting — Jawai is wild country. We will never sell you a leopard we cannot promise"]',

  '["You want to travel without knowing anyone — Most people on this book alone. You do not have to know anybody before you come. That is the point","You would rather understand one place than tick off six","You are comfortable with an afternoon that has nothing planned in it","You want a city that is still lived in rather than preserved for you","You want the wild without a national park gate, a numbered zone and a queue of jeeps"]',

  '["You want a guaranteed leopard — Jawai is open country, not an enclosure, and we will not pretend otherwise to close a booking","You want ten places in three days — This does the opposite, on purpose","You want a private trip — This one is shared, and the sharing is the product","You need five-star standards throughout — Jawai is camp country. It is comfortable and well run, and it is not a city hotel","You would rather not talk to anyone — Every evening here is built around a conversation"]',

  '["Jawai — Discover","Jodhpur — Experience","Outway — Connect"]'
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
-- Days 00 to 02 are Escape 001's, word for word where the experience is
-- genuinely identical — the Jawai half of both escapes is the same two days
-- and pretending otherwise would be writing marketing rather than an
-- itinerary. Day 03 is where the two editions become different trips.
--
-- The Jodhpur evening runs earlier than Udaipur's because the Mandore Express
-- leaves at 20:30 and it is the right train home. The Last Table is a sunset
-- dinner under a floodlit Mehrangarh rather than a late one, which is arguably
-- the better version anyway.
-- ---------------------------------------------------------------------------
delete from itinerary_days where trip_id = '22222222-2222-2222-2222-222222222003';

insert into itinerary_days (trip_id, day_number, title, description, activities, meals, accommodation) values
('22222222-2222-2222-2222-222222222003', 0,
  'Leave Ordinary',
  'The journey starts on a platform in Delhi, with people you have not met. Your Outway host finds you, hands you a Journey Card, and that is the last piece of admin for five days. The train pulls out late and the carriage does what carriages do — somebody has snacks, somebody has a speaker, somebody knows a card game, and at some point the question goes round that this whole thing is built on: what made you say yes to this journey? Answers vary wildly and that is the interesting part. Sleep when you feel like it. Tomorrow is deliberately unhurried, so an imperfect night on a train costs you nothing at all.',
  '["Evening (8:30 PM) — Meet your Outway host and the group on the platform in Delhi","Departure (10:25 PM) — The overnight train west, booked with the group so nobody travels in alone","On board — Journey Cards, introductions, and the first question: what made you say yes to this journey?","Late — Music, chai, a card game, and whoever is still awake","Sleep. Day 01 does not start early"]',
  '{"breakfast": false, "lunch": false, "dinner": false}',
  'Overnight train, Delhi to Jawai Bandh'),

('22222222-2222-2222-2222-222222222003', 1,
  'Enter the Wild',
  'You see Jawai before the train stops. The hills flatten out and then the granite starts — enormous smooth domes sitting straight out of the scrub, nothing like the Rajasthan on the postcards. We collect you at Jawai Bandh and take you to the camp, and then we deliberately do nothing for a while. Breakfast is slow. Nobody is rushed into a jeep. The first thing that happens here is that somebody who lives here explains the place to you, because Jawai makes no sense until you understand the arrangement it runs on: the Rabari have herded these hills for generations, around fifty leopards live on the rocks directly above the villages, and in living memory neither has killed the other. Late afternoon is when the granite gives its warmth back and the cats come out onto it, so that is when we go out — an open jeep, a naturalist who knows which family is denning where, and no promises. The sighting is never promised. The experience is. Afterwards we take chai up onto a rock for the sunset and stay past the point where anybody would normally head back to their room. Dinner is outside. If the fire is allowed, there is a fire, and around it the Story Circle: tell us about a journey that changed you.',
  '["Morning (9:50 AM) — Into Jawai Bandh, and the granite starts before the station does","Slow breakfast (10:30 AM) — At the camp. Nothing is scheduled for an hour and that is deliberate","Meet the Land (12:00 PM) — Time with a Rabari shepherd family, with a local host who can translate more than the language","Rest (2:00 PM) — The afternoon is not a thing worth fighting","Late afternoon (4:00 PM) — Open-jeep exploration of Jawai with a local naturalist","Jawai Sunset (6:15 PM) — Chai on a granite dome, and nobody in a hurry to leave","After dark (8:00 PM) — Dinner, stars, a fire where it is permitted, and The Story Circle"]',
  '{"breakfast": true, "lunch": true, "dinner": true}',
  'Jawai — camp in leopard country, twin sharing'),

('22222222-2222-2222-2222-222222222003', 2,
  'Live the Wild, Slowly',
  'No packed sightseeing today, and no apology for it. Breakfast runs long, the coffee is good, and the hills are doing exactly nothing in particular. Mid-morning we go down to Jawai Bandh, where mugger crocodiles sit out on the banks and the winter birds have started arriving. From there it is a short way to Devgiri, a cave temple set into the granite where local families have come to worship for as long as anyone can date, often with a leopard asleep on the rock above them. Nobody there finds that remarkable, which is the most remarkable thing about it. Lunch is Marwari, cooked by people who live here. Then the afternoon is yours, genuinely: read, photograph, sleep, talk, walk, or nothing. An escape should not feel like work. If the group wants a second time out in the jeep and the season allows it, we go — and if we do not, this list does not get padded to look bigger. The last night in Jawai is The Outway Table: everybody, one dinner, and the question that turns a group into something else. What surprised you most about this place?',
  '["Slow morning (8:00 AM) — Breakfast, coffee, and no agenda until you have finished both","Beyond the Leopard (10:00 AM) — Jawai Bandh, the muggers on the bank, and the first of the winter birds","Devgiri (11:30 AM) — The cave temple in the granite, where the priests and the leopards share a hill","The local table (1:00 PM) — Marwari lunch, cooked by people who live here","Your Afternoon (2:30 PM) — Free. Read, photograph, sleep, talk, or nothing at all","Second Wild (3:45 PM) — An optional second time out, if the group wants it and the season allows","The Outway Table (8:00 PM) — Last dinner in Jawai: what surprised you most about this place?"]',
  '{"breakfast": true, "lunch": true, "dinner": true}',
  'Jawai — camp in leopard country, twin sharing'),

('22222222-2222-2222-2222-222222222003', 3,
  'From the Wild to the Blue',
  'Two and a half hours north and the country changes underneath you. The granite thins out, the green runs out with it, and the light turns hard and clean the way it only does over Marwar. Then Jodhpur arrives all at once: a thousand indigo-washed houses stacked up a hillside under the largest fort in Rajasthan. Mehrangarh is first, and it earns the whole morning — five hundred years of Rathore Marwar on a rock five hundred feet above its own city, and the ramparts give you the blue city laid out flat below. Lunch is Marwari and unapologetic about it. The afternoon belongs to the old city on foot, which is the part most visitors skip: Toorji Ka Jhalra, the eighteenth-century stepwell the neighbourhood still gathers at, the bazaar around the clock tower that is a working market rather than a heritage set, and the lanes below the fort where the blue actually lives. An hour of that is yours alone. Golden hour is Jaswant Thada, where the marble is thin enough to glow from the inside when the sun is low enough. Then everybody at one table for an early dinner facing a floodlit Mehrangarh, letters written to somebody you met on Saturday and handed over, and the overnight train home. The evening runs earlier here than in Udaipur because the good train leaves at half past eight, and eating under that fort at sunset turns out to be the better version anyway.',
  '["Check out (7:30 AM) — Breakfast, goodbyes to the camp, then the road","The Road North (8:30 AM) — Two and a half hours into Marwar, and the green runs out","Mehrangarh (11:00 AM) — The fort from the inside, and the blue city flat below the ramparts","The Local Table (1:30 PM) — Marwari lunch, and no apologies for the chilli","Walk Into the Story (3:00 PM) — Toorji Ka Jhalra, the clock tower bazaar and the blue lanes, with a local host","Your Jodhpur Hour (4:30 PM) — The market, a rooftop, a camera, or a step to sit on","Golden Hour (5:30 PM) — Jaswant Thada, when the marble goes translucent","The Last Table (6:30 PM) — Early dinner under a floodlit Mehrangarh: what are you taking home from this journey?","The Letter (7:45 PM) — Write to someone you met here. Exchange before you leave","Departure (8:30 PM) — Overnight train, Jodhpur to Delhi"]',
  '{"breakfast": true, "lunch": true, "dinner": true}',
  'Overnight train, Jodhpur to Delhi'),

('22222222-2222-2222-2222-222222222003', 4,
  'Return Home',
  'Into Delhi in the morning, two days of leave spent. Nobody goes home a stranger — the group thread stays open, the photographs land on it over the next week, and so does the answer to whatever you forgot to ask on Monday night. That is the part of this that does not fit in an itinerary, and it is the part people write to us about afterwards.',
  '["Morning (6:45 AM) — Into Delhi","The group thread stays open, and so does the invitation"]',
  '{"breakfast": false, "lunch": false, "dinner": false}',
  null);

-- ---------------------------------------------------------------------------
-- The 23 October departure. Friday night out, Tuesday morning back.
--
-- It exists so the brochure prints a real date block and ops can send this to
-- somebody asking what else is coming. Nothing is bookable while the trip is
-- unpublished — the public page 404s, so no seat can move against it.
-- ---------------------------------------------------------------------------
delete from departures where trip_id = '22222222-2222-2222-2222-222222222003';

insert into departures (id, trip_id, start_date, end_date, total_seats, seats_booked, price_override, status) values
('33333333-3333-3333-3333-333333333004', '22222222-2222-2222-2222-222222222003',
  '2026-10-23', '2026-10-27', 18, 0, null, 'open');
