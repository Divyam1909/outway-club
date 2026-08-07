-- Outway Club: launch content
-- Escape 001: Udaipur x Mount Abu, 15 to 17 August.
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
  'weekend', 'group', 3, 2, 'easy',
  14999, 12499, 6, 18,
  'Udaipur, Maharana Pratap Airport (UDR) or Udaipur City railway station',

  'Three days across the greenest month in Rajasthan, two nights, one lake city, one hill station, and eighteen people who signed up for the same weekend.',

  'This is the first escape we are running, and we built it to be the trip we would want to be on. It opens in Udaipur on the morning of 15 August with a sunset boat on Lake Pichola and a rooftop dinner facing a lit-up City Palace, then heads west into the Aravallis. August is the one month these hills are properly green, monsoon turns the drive to Mount Abu into the best four hours of the weekend. You get Dilwara''s 900-year-old marble carving, a bonfire above Nakki Lake, sunrise from the highest point in the range, and the drive back through Sajjangarh before flying out on the evening of the 17th. Eighteen travellers, one trip captain who has run this route before, every stay and transfer booked in advance. Nothing about the weekend is left for you to arrange.',

  '["Sunset boat on Lake Pichola, past the Taj Lake Palace as the ghats light up","900-year-old marble carving at the Dilwara Temples, the finest in India, and most people have never seen it","Sunrise from Guru Shikhar, the highest point in the Aravallis at 1,722m","Rooftop dinner at Ambrai Ghat, facing the floodlit City Palace across the water","The monsoon Aravalli drive, August is the one month this range is green","Bonfire night above Nakki Lake, capped at 18 people who booked the same weekend"]',

  '["2 nights in hand-picked stays: a boutique haveli in Udaipur and a hillside resort in Mount Abu, on twin sharing","All breakfasts and 2 dinners, including the rooftop dinner at Ambrai Ghat","Private air-conditioned transport for the full route and all sightseeing","Sunset boat ride on Lake Pichola","All monument and temple entry fees listed in the itinerary","A dedicated Outway trip captain with you for all three days","Bonfire evening in Mount Abu","All applicable taxes: the price you see is the price you pay"]',

  '["Travel to and from Udaipur (flights or trains)","Lunches on all three days","Personal expenses, shopping, tips and anything at the bar","Travel insurance, we strongly recommend arranging your own","Any activity or entry not named in the inclusions list","Single-occupancy room upgrade (available on request, quoted separately)"]',

  '["A light rain jacket or poncho, this is monsoon, and that is the point","One warm layer: Mount Abu drops to around 20°C after dark","Comfortable walking shoes you can get wet","Original government photo ID, mandatory at hotel check-in, no exceptions","Sunscreen and a refillable water bottle","Any personal medication, plus something for motion sickness on the ghat road"]',

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
-- Itinerary: 3 days
-- ---------------------------------------------------------------------------
delete from itinerary_days where trip_id = '22222222-2222-2222-2222-222222222001';

insert into itinerary_days (trip_id, day_number, title, description, activities, meals, accommodation) values
('22222222-2222-2222-2222-222222222001', 1,
  'Udaipur: City Palace, Lake Pichola, Ambrai Ghat',
  'Land in Udaipur and drop your bag at a boutique haveli inside the old city. The afternoon is the City Palace, the largest palace complex in Rajasthan, and worth the two hours it takes properly. At golden hour we board a private boat on Lake Pichola and go out past Jag Mandir and the Taj Lake Palace as the ghats start lighting up. Dinner is on a rooftop at Ambrai Ghat, directly across the water from a floodlit City Palace. It is the single best table in the city and we book it in advance.',
  '["Arrival, welcome and check-in at the haveli","City Palace complex and the Crystal Gallery","Sunset boat ride on Lake Pichola past Jag Mandir","Bagore Ki Haveli, evening Dharohar folk performance","Rooftop dinner at Ambrai Ghat facing the City Palace"]',
  '{"breakfast": false, "lunch": false, "dinner": true}',
  'Boutique haveli, Udaipur old city'),

('22222222-2222-2222-2222-222222222001', 2,
  'Into the Aravallis: Dilwara, Nakki Lake, bonfire night',
  'Out early, west into the hills. The drive to Mount Abu takes about four hours and in August it is the best part of the day, the Aravallis are green exactly once a year and this is the month. First stop is Dilwara: five Jain temples built between the 11th and 13th centuries, carved from marble so thin the light comes through it. No photography inside, which is fine, because you would not have captured it anyway. Afternoon around Nakki Lake, sunset from Honeymoon Point, and a bonfire back at the resort once it gets dark.',
  '["Scenic monsoon drive through the Aravalli range","Dilwara Jain Temples: 11th to 13th century marble carving","Nakki Lake and the Toad Rock walk","Sunset from Honeymoon Point","Bonfire evening and dinner at the resort"]',
  '{"breakfast": true, "lunch": false, "dinner": true}',
  'Hillside resort, Mount Abu'),

('22222222-2222-2222-2222-222222222001', 3,
  'Guru Shikhar sunrise, Sajjangarh, and out',
  'A genuinely early start for Guru Shikhar, at 1,722m it is the highest point in the Aravallis, and on a clear monsoon morning you are looking down at cloud sitting in the valleys. Breakfast after, then the drive back to Udaipur with a stop at the Sajjangarh Monsoon Palace on the ridge above the city. We get you to the airport or the station by early evening, so an 8pm flight out is comfortable.',
  '["Sunrise at Guru Shikhar (1,722m), highest point in the Aravallis","Breakfast and check-out","Return drive to Udaipur through the hills","Sajjangarh Monsoon Palace on the ridge above the lakes","Airport / railway station drop by 6pm"]',
  '{"breakfast": true, "lunch": false, "dinner": false}',
  null);

-- ---------------------------------------------------------------------------
-- Departure: the 15 August launch batch
-- ---------------------------------------------------------------------------
delete from departures where trip_id = '22222222-2222-2222-2222-222222222001';

insert into departures (id, trip_id, start_date, end_date, total_seats, seats_booked, price_override, status) values
('33333333-3333-3333-3333-333333333001', '22222222-2222-2222-2222-222222222001',
  '2026-08-15', '2026-08-17', 18, 0, null, 'open');
