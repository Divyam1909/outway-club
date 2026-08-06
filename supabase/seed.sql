-- Outway Club — sample content
-- Safe to run multiple times against a fresh database (uses fixed UUIDs).
-- Swap hero_image / gallery URLs for real photography (e.g. Supabase Storage) before launch.

-- ---------------------------------------------------------------------------
-- Destinations
-- ---------------------------------------------------------------------------
insert into destinations (id, slug, name, region, country, tagline, description, best_time, hero_image, gallery, is_featured) values
('11111111-1111-1111-1111-111111111101', 'ladakh', 'Ladakh', 'Ladakh (UT)', 'India',
  'Where the mountains touch the sky',
  'A high-altitude desert of stark, otherworldly beauty — turquoise lakes, thousand-year-old monasteries clinging to cliffs, and roads that cross some of the highest motorable passes on Earth.',
  'May – September',
  'https://picsum.photos/seed/ladakh-hero/1600/900',
  '["https://picsum.photos/seed/ladakh-1/1200/800","https://picsum.photos/seed/ladakh-2/1200/800","https://picsum.photos/seed/ladakh-3/1200/800","https://picsum.photos/seed/ladakh-4/1200/800"]', true),

('11111111-1111-1111-1111-111111111102', 'kerala', 'Kerala', 'Kerala', 'India',
  'God''s Own Country',
  'Palm-fringed backwaters, misty tea plantations, and a slower, gentler pace of travel — Kerala is India''s most complete leisure escape.',
  'September – March',
  'https://picsum.photos/seed/kerala-hero/1600/900',
  '["https://picsum.photos/seed/kerala-1/1200/800","https://picsum.photos/seed/kerala-2/1200/800","https://picsum.photos/seed/kerala-3/1200/800","https://picsum.photos/seed/kerala-4/1200/800"]', true),

('11111111-1111-1111-1111-111111111103', 'rajasthan', 'Rajasthan', 'Rajasthan', 'India',
  'Land of Kings',
  'Sandstone forts, mirrored palaces, and desert dunes that turn gold at sunset — Rajasthan is India''s grandest, most cinematic state.',
  'October – March',
  'https://picsum.photos/seed/rajasthan-hero/1600/900',
  '["https://picsum.photos/seed/rajasthan-1/1200/800","https://picsum.photos/seed/rajasthan-2/1200/800","https://picsum.photos/seed/rajasthan-3/1200/800","https://picsum.photos/seed/rajasthan-4/1200/800"]', true),

('11111111-1111-1111-1111-111111111104', 'goa', 'Goa', 'Goa', 'India',
  'Sun, sand and siesta',
  'Golden beaches, Portuguese-era lanes, and unhurried sunsets — Goa is the easiest short break in the country.',
  'November – February',
  'https://picsum.photos/seed/goa-hero/1600/900',
  '["https://picsum.photos/seed/goa-1/1200/800","https://picsum.photos/seed/goa-2/1200/800","https://picsum.photos/seed/goa-3/1200/800","https://picsum.photos/seed/goa-4/1200/800"]', true),

('11111111-1111-1111-1111-111111111105', 'spiti-valley', 'Spiti Valley', 'Himachal Pradesh', 'India',
  'The middle land',
  'A cold desert wedged between India and Tibet — barren mountains, whitewashed monasteries, and villages that feel like they belong to another century.',
  'June – October',
  'https://picsum.photos/seed/spiti-hero/1600/900',
  '["https://picsum.photos/seed/spiti-1/1200/800","https://picsum.photos/seed/spiti-2/1200/800","https://picsum.photos/seed/spiti-3/1200/800","https://picsum.photos/seed/spiti-4/1200/800"]', false),

('11111111-1111-1111-1111-111111111106', 'meghalaya', 'Meghalaya', 'Meghalaya', 'India',
  'Abode of clouds',
  'The wettest place on Earth, and one of the greenest — living root bridges, crystal-clear rivers, and villages that clean up after themselves.',
  'October – April',
  'https://picsum.photos/seed/meghalaya-hero/1600/900',
  '["https://picsum.photos/seed/meghalaya-1/1200/800","https://picsum.photos/seed/meghalaya-2/1200/800","https://picsum.photos/seed/meghalaya-3/1200/800","https://picsum.photos/seed/meghalaya-4/1200/800"]', true),

('11111111-1111-1111-1111-111111111107', 'rishikesh', 'Rishikesh', 'Uttarakhand', 'India',
  'Yoga capital of the world',
  'The Ganga rushes down from the Himalayas here, and the town has built itself around that energy — rafting by day, aarti by the river at dusk.',
  'September – June',
  'https://picsum.photos/seed/rishikesh-hero/1600/900',
  '["https://picsum.photos/seed/rishikesh-1/1200/800","https://picsum.photos/seed/rishikesh-2/1200/800","https://picsum.photos/seed/rishikesh-3/1200/800","https://picsum.photos/seed/rishikesh-4/1200/800"]', false),

('11111111-1111-1111-1111-111111111108', 'andaman-islands', 'Andaman Islands', 'Andaman & Nicobar Islands', 'India',
  'Turquoise water, tropical calm',
  'White sand, coral reefs, and water so clear it looks manufactured — the Andamans are India''s answer to the Maldives, without leaving the country.',
  'October – May',
  'https://picsum.photos/seed/andaman-hero/1600/900',
  '["https://picsum.photos/seed/andaman-1/1200/800","https://picsum.photos/seed/andaman-2/1200/800","https://picsum.photos/seed/andaman-3/1200/800","https://picsum.photos/seed/andaman-4/1200/800"]', false);

-- ---------------------------------------------------------------------------
-- Trips
-- ---------------------------------------------------------------------------
insert into trips (id, slug, title, destination_id, category, trip_type, duration_days, duration_nights, difficulty,
  price_per_person, discounted_price, group_size_min, group_size_max, starting_point, short_description, description,
  highlights, inclusions, exclusions, things_to_carry, hero_image, gallery, rating, review_count, is_featured, is_group_trip) values

('22222222-2222-2222-2222-222222222201', 'leh-ladakh-high-passes-monasteries', 'Leh-Ladakh: High Passes & Monasteries',
  '11111111-1111-1111-1111-111111111101', 'adventure', 'group', 7, 6, 'moderate',
  32999, 28999, 2, 14, 'Leh Airport (IXL)',
  'Cross the world''s highest passes, camp beside Pangong Tso, and explore centuries-old monasteries on this classic Ladakh loop.',
  'This is the trip that put Ladakh on every traveller''s list — and for good reason. Over seven days you''ll acclimatise in Leh, cross the legendary Khardung La, drive through the dune-like Nubra Valley on double-humped camels, and watch the colour of Pangong Tso shift through every shade of blue at sunset. We keep the pace deliberately unrushed: enough time to breathe (literally, at this altitude) and enough structure that you never have to think about logistics. Small groups, an experienced high-altitude trip leader, and an oxygen cylinder on board at all times.',
  '["Cross Khardung La, one of the world''s highest motorable passes","Camp beside the surreal blue of Pangong Tso at sunset","Ride a double-humped Bactrian camel in the Nubra dunes","Visit 1,000-year-old monasteries at Thiksey, Hemis and Lamayuru","Sleep under one of the clearest, darkest night skies in India"]',
  '["6 nights accommodation (hotels in Leh, camps in Nubra & Pangong)","All meals — breakfast, lunch and dinner","Private oxygen cylinder carried in vehicle","Inner line permits for restricted areas","Airport pickup & drop in Leh","Experienced high-altitude trip leader and local driver throughout","All sightseeing and entry fees as per itinerary"]',
  '["Flights to/from Leh","Personal expenses, shopping and tips","Travel & medical insurance (strongly recommended)","Optional activities not listed (river rafting, mountain biking)","Anything not explicitly mentioned in inclusions"]',
  '["Warm layered clothing — nights drop below freezing even in summer","Sunglasses and SPF 50+ sunscreen","Personal medication, and consult your doctor about Diamox","A power bank (charging points are limited outside Leh)","A reusable water bottle","Broken-in, comfortable trekking shoes"]',
  'https://picsum.photos/seed/ladakh-hero/1600/900',
  '["https://picsum.photos/seed/ladakh-trip-1/1200/800","https://picsum.photos/seed/ladakh-trip-2/1200/800","https://picsum.photos/seed/ladakh-trip-3/1200/800","https://picsum.photos/seed/ladakh-trip-4/1200/800","https://picsum.photos/seed/ladakh-trip-5/1200/800"]',
  4.9, 128, true, true),

('22222222-2222-2222-2222-222222222202', 'kerala-backwaters-hill-escape', 'Kerala Backwaters & Hill Escape',
  '11111111-1111-1111-1111-111111111102', 'leisure', 'group', 6, 5, 'easy',
  24999, 21999, 2, 16, 'Kochi (COK)',
  'Fort Kochi''s lanes, Munnar''s tea gardens, a spice-plantation walk in Thekkady, and a houseboat night on the Alleppey backwaters.',
  'A leisurely loop through Kerala''s three signature landscapes — colonial coast, misty hills and quiet backwaters — with just enough movement to keep things interesting and enough downtime to actually relax. The trip closes with an overnight stay aboard a traditional Kettuvallam houseboat, drifting past coconut groves as the sun sets over the water.',
  '["Overnight stay aboard a traditional Kettuvallam houseboat in Alleppey","Walk through working tea gardens in Munnar at golden hour","Guided spice-plantation tour in Thekkady","Sunset at Fort Kochi''s Chinese fishing nets","Optional evening Kathakali dance performance"]',
  '["5 nights accommodation, including 1 night on a private houseboat","Daily breakfast; lunch & dinner on houseboat night","All inter-city transfers in a private AC vehicle","Spice plantation guided walk & tea museum entry","Experienced local trip leader"]',
  '["Flights/train to/from Kochi","Meals not mentioned above","Kathakali show tickets (optional, bookable on request)","Personal expenses and tips","Travel insurance"]',
  '["Light cotton clothing plus one light jacket for Munnar evenings","Comfortable walking sandals","Mosquito repellent","Sunglasses and a hat","Binoculars if you''re into birdwatching"]',
  'https://picsum.photos/seed/kerala-hero/1600/900',
  '["https://picsum.photos/seed/kerala-trip-1/1200/800","https://picsum.photos/seed/kerala-trip-2/1200/800","https://picsum.photos/seed/kerala-trip-3/1200/800","https://picsum.photos/seed/kerala-trip-4/1200/800"]',
  4.8, 96, true, true),

('22222222-2222-2222-2222-222222222203', 'royal-rajasthan-heritage-trail', 'Royal Rajasthan Heritage Trail',
  '11111111-1111-1111-1111-111111111103', 'culture', 'group', 8, 7, 'easy',
  39999, 35999, 2, 18, 'Jaipur (JAI)',
  'Four cities, four forts, one desert camp — Jaipur, Jodhpur, Jaisalmer and Udaipur in a single, unhurried loop.',
  'Rajasthan rewards a slow trail, and this is our most complete one — the pink of Jaipur, the blue of Jodhpur, the gold of Jaisalmer and the lakes of Udaipur, connected by comfortable drives with stops built in. Expect elephant-shaped hills, sandstone forts you could spend a whole day inside, and a night under canvas in the Thar Desert with folk music around a fire.',
  '["Amber Fort at sunrise, before the crowds arrive","Mehrangarh Fort towering over Jodhpur''s Blue City","Camel safari and overnight desert camp at Sam Dunes, Jaisalmer","Sunset boat ride on Lake Pichola, Udaipur","Local guide at every fort and palace"]',
  '["7 nights accommodation in heritage-style hotels","Daily breakfast, plus dinner on desert camp night","All inter-city transfers in a private AC vehicle","Camel safari and desert camp with folk performance","Monument entry fees as per itinerary","Local guide at each major fort/palace"]',
  '["Flights/train between cities (Jaisalmer–Udaipur leg)","Lunches and non-included dinners","Personal expenses and shopping","Camera fees at some monuments (paid on-site)","Travel insurance"]',
  '["Breathable cotton clothing plus a light shawl for desert evenings","Comfortable closed shoes for fort walks","Sunglasses, sunscreen and a scarf for dust","A basic day bag for the camel safari","Portable charger — plug points are limited at the desert camp"]',
  'https://picsum.photos/seed/rajasthan-hero/1600/900',
  '["https://picsum.photos/seed/rajasthan-trip-1/1200/800","https://picsum.photos/seed/rajasthan-trip-2/1200/800","https://picsum.photos/seed/rajasthan-trip-3/1200/800","https://picsum.photos/seed/rajasthan-trip-4/1200/800"]',
  4.9, 154, true, true),

('22222222-2222-2222-2222-222222222204', 'goa-beach-sunset-getaway', 'Goa Beach & Sunset Getaway',
  '11111111-1111-1111-1111-111111111104', 'weekend', 'group', 4, 3, 'easy',
  14999, 12999, 2, 20, 'Goa Airport, Dabolim (GOI)',
  'A quick North Goa reset — beach hopping, a river sunset cruise, and just enough sightseeing to not feel lazy.',
  'Built for a long weekend: North Goa''s best beaches, a spice plantation lunch, the UNESCO churches of Old Goa, and a live-music sunset cruise on the Mandovi. Easy pace, good food, minimal planning required on your end.',
  '["Beach hop through Baga, Calangute and Vagator","Sunset cruise on the Mandovi River with live music","Spice plantation tour with a traditional Goan lunch","Old Goa''s UNESCO World Heritage churches","Free time built in every day for the beach"]',
  '["3 nights accommodation near Calangute/Candolim","Daily breakfast","Mandovi sunset cruise ticket","Spice plantation entry and lunch","Airport transfers and all sightseeing transport"]',
  '["Flights to/from Goa","Lunches and dinners (except spice plantation day)","Water sports (jet-ski, parasailing — bookable on-site)","Personal expenses and alcohol","Travel insurance"]',
  '["Light, breathable clothing and swimwear","Reef-safe sunscreen","Flip-flops and one pair of walking shoes","Sunglasses and a hat","A dry bag if you plan on water sports"]',
  'https://picsum.photos/seed/goa-hero/1600/900',
  '["https://picsum.photos/seed/goa-trip-1/1200/800","https://picsum.photos/seed/goa-trip-2/1200/800","https://picsum.photos/seed/goa-trip-3/1200/800","https://picsum.photos/seed/goa-trip-4/1200/800"]',
  4.7, 211, true, true),

('22222222-2222-2222-2222-222222222205', 'spiti-valley-overland-expedition', 'Spiti Valley Overland Expedition',
  '11111111-1111-1111-1111-111111111105', 'adventure', 'group', 8, 7, 'challenging',
  27999, 24999, 4, 12, 'Shimla (SLV)',
  'An overland crossing through the Hindustan-Tibet highway — Chitkul, Nako, Tabo and Kaza, over Kunzum Pass to Manali.',
  'Not a resort holiday — this is a proper overland expedition through one of the most remote, beautiful stretches of the Himalayas. Long days on the road are the point, not a downside: every bend brings a new, starker landscape. Expect basic homestays in the higher villages, thin air, and some of the most dramatic scenery in the country.',
  '["Drive the Hindustan-Tibet highway through Kinnaur into Spiti","Visit Tabo Monastery, over 1,000 years old","Explore Key Monastery and Kibber, among the world''s highest villages","Cross the dramatic Kunzum Pass (4,590m)","See Chandratal Lake, weather permitting"]',
  '["7 nights accommodation — hotels, guesthouses and homestays","All meals through the Spiti stretch (Kalpa to Manali)","Private vehicle suited for mountain terrain, throughout","Inner line permits where required","Experienced high-altitude trip leader"]',
  '["Flights/transfers to/from Shimla and from Manali","Meals in Shimla before departure","Personal expenses and tips","Travel & medical insurance (strongly recommended)","Anything not mentioned in inclusions"]',
  '["Heavy warm layers — expect sub-zero nights even in summer","Personal medication and Diamox (consult your doctor)","A basic first-aid kit","Motion sickness tablets for mountain roads","Cash — ATMs are scarce beyond Reckong Peo"]',
  'https://picsum.photos/seed/spiti-hero/1600/900',
  '["https://picsum.photos/seed/spiti-trip-1/1200/800","https://picsum.photos/seed/spiti-trip-2/1200/800","https://picsum.photos/seed/spiti-trip-3/1200/800","https://picsum.photos/seed/spiti-trip-4/1200/800"]',
  4.8, 67, false, true),

('22222222-2222-2222-2222-222222222206', 'meghalaya-living-root-bridges-trek', 'Meghalaya Living Root Bridges Trek',
  '11111111-1111-1111-1111-111111111106', 'trek', 'group', 6, 5, 'moderate',
  26999, 23999, 4, 12, 'Guwahati (GAU)',
  'Trek down 3,500 steps to the double-decker living root bridge, swim in Cherrapunji''s pools, and float on Asia''s cleanest river.',
  'Meghalaya rewards travellers willing to walk for it. This trip centres on the trek into Nongriat village to see the famous double-decker living root bridge — a structure grown, not built, over generations — followed by a swim in the pools below. Add Cherrapunji''s waterfalls, Dawki''s glass-clear river, and Mawlynnong, routinely called Asia''s cleanest village, and you get a side of Northeast India most itineraries skip entirely.',
  '["Trek to the double-decker living root bridge in Nongriat","Swim in Cherrapunji''s crystal pools beneath Nohkalikai Falls","Boat on the impossibly clear Umngot River at Dawki","Walk through Mawlynnong, Asia''s cleanest village","One night in a village homestay"]',
  '["5 nights accommodation, including 1 village homestay","Daily breakfast; lunch & dinner on trek days","Local trekking guide for the Nongriat descent","Private vehicle for all transfers","Boat ride at Dawki"]',
  '["Flights/train to/from Guwahati","Meals not mentioned above","Personal trekking gear rental (if needed)","Personal expenses and tips","Travel insurance"]',
  '["Sturdy trekking shoes with good grip — the steps get slippery","A rain jacket, even outside monsoon","A swimsuit for the Cherrapunji pools","A dry bag for electronics","Trekking poles if you have knee concerns (3,500+ steps down and up)"]',
  'https://picsum.photos/seed/meghalaya-hero/1600/900',
  '["https://picsum.photos/seed/meghalaya-trip-1/1200/800","https://picsum.photos/seed/meghalaya-trip-2/1200/800","https://picsum.photos/seed/meghalaya-trip-3/1200/800","https://picsum.photos/seed/meghalaya-trip-4/1200/800"]',
  4.9, 54, true, true),

('22222222-2222-2222-2222-222222222207', 'rishikesh-yoga-rafting-weekend', 'Rishikesh Yoga & Rafting Weekend',
  '11111111-1111-1111-1111-111111111107', 'weekend', 'group', 3, 2, 'easy',
  8999, 7499, 2, 24, 'Rishikesh / Dehradun (DED)',
  'White-water rafting by day, sunrise yoga by the Ganga, and the Triveni Ghat aarti at dusk — a full reset in one short weekend.',
  'The most accessible adventure weekend out of Delhi. Grade II–III rapids on the Ganga, a guided sunrise yoga and meditation session on the riverbank, and the nightly Ganga Aarti ceremony — Rishikesh packs a genuinely different pace into just three days.',
  '["16km white-water rafting stretch through Grade II–III rapids","Guided sunrise yoga & meditation session by the Ganga","Evening Ganga Aarti at Triveni Ghat","Riverside bonfire evening","Optional cliff jumping at Shivpuri"]',
  '["2 nights riverside camp/hotel accommodation","Daily breakfast and 1 bonfire dinner","Rafting equipment, safety gear and certified rafting guide","Yoga session with a certified instructor","All local transfers"]',
  '["Transport to/from Rishikesh (Delhi pickup available on request)","Lunches and 1 dinner","Personal expenses","Cliff jumping (optional, paid on-site)","Travel insurance"]',
  '["Quick-dry clothing for rafting","A change of clothes and a dry bag","Comfortable footwear that can get wet","Sunscreen","A light jacket for the evening bonfire"]',
  'https://picsum.photos/seed/rishikesh-hero/1600/900',
  '["https://picsum.photos/seed/rishikesh-trip-1/1200/800","https://picsum.photos/seed/rishikesh-trip-2/1200/800","https://picsum.photos/seed/rishikesh-trip-3/1200/800","https://picsum.photos/seed/rishikesh-trip-4/1200/800"]',
  4.7, 183, false, true),

('22222222-2222-2222-2222-222222222208', 'andaman-islands-honeymoon-escape', 'Andaman Islands Honeymoon Escape',
  '11111111-1111-1111-1111-111111111108', 'honeymoon', 'customizable', 5, 4, 'easy',
  45999, 41999, 1, 6, 'Port Blair (IXZ)',
  'Havelock and Neil Island, privately paced — beach dinners, snorkelling over coral, and sunsets built around the two of you.',
  'A fully customisable island escape rather than a fixed group departure — we build the pace, room categories and add-ons around you. Expect Radhanagar Beach at sunset, snorkelling over coral reefs at North Bay, and the quieter, less-visited Neil Island for your final days. Dates and hotel tiers are confirmed with you directly after enquiry.',
  '["Private sunset dinner on Radhanagar Beach, Asia''s finest","Snorkelling and glass-bottom boat at North Bay coral reef","Optional scuba diving at Havelock for certified/trial divers","Quiet, uncrowded Neil Island for your final two days","Fully customisable room categories and add-ons"]',
  '["4 nights accommodation (category selected at booking)","Daily breakfast","Ferry transfers between Port Blair, Havelock and Neil Island","One private sunset beach dinner","Airport pickup and drop"]',
  '["Flights to/from Port Blair","Scuba diving (optional, quoted separately)","Lunches and dinners other than the beach dinner","Personal expenses","Travel insurance"]',
  '["Reef-safe sunscreen (mandatory at protected beaches)","Light tropical clothing","A rash guard if snorkelling often","Waterproof phone pouch","Comfortable sandals for boat transfers"]',
  'https://picsum.photos/seed/andaman-hero/1600/900',
  '["https://picsum.photos/seed/andaman-trip-1/1200/800","https://picsum.photos/seed/andaman-trip-2/1200/800","https://picsum.photos/seed/andaman-trip-3/1200/800","https://picsum.photos/seed/andaman-trip-4/1200/800"]',
  4.9, 41, false, false);

-- ---------------------------------------------------------------------------
-- Itinerary — Leh-Ladakh (7 days)
-- ---------------------------------------------------------------------------
insert into itinerary_days (trip_id, day_number, title, description, activities, meals, accommodation) values
('22222222-2222-2222-2222-222222222201', 1, 'Arrive in Leh — acclimatisation', 'Fly into Leh (3,500m) and take it slow — the altitude is the real itinerary today. Short walk in the evening once you''ve settled in, followed by a briefing with your trip leader.', '["Airport pickup and hotel check-in","Complete rest until at least 2pm","Short evening walk near the market","Trip briefing and Diamox check-in with your leader"]', '{"breakfast": false, "lunch": false, "dinner": true}', 'Hotel in Leh'),
('22222222-2222-2222-2222-222222222201', 2, 'Leh local sightseeing', 'A gentle day of sightseeing to continue acclimatising — Shanti Stupa for panoramic views, the 17th-century Leh Palace, and the Hall of Fame museum dedicated to the Indian Army.', '["Shanti Stupa at sunrise or sunset","Leh Palace walkthrough","Hall of Fame war museum","Free time in Leh market"]', '{"breakfast": true, "lunch": true, "dinner": true}', 'Hotel in Leh'),
('22222222-2222-2222-2222-222222222201', 3, 'Leh to Nubra Valley via Khardung La', 'Cross Khardung La — one of the highest motorable passes in the world — and descend into the sandy expanse of Nubra Valley.', '["Photo stop atop Khardung La (5,359m)","Double-humped Bactrian camel ride at Hunder dunes","Diskit Monastery visit","Riverside camp check-in"]', '{"breakfast": true, "lunch": true, "dinner": true}', 'Camp in Nubra Valley'),
('22222222-2222-2222-2222-222222222201', 4, 'Nubra to Pangong Tso', 'A long, spectacular drive over Shyok route to Pangong Tso, arriving in time to watch the lake shift colour at sunset.', '["Scenic drive via Shyok river route","Arrival and lakeside check-in","Sunset at Pangong Tso","Stargazing (weather permitting)"]', '{"breakfast": true, "lunch": true, "dinner": true}', 'Camp at Pangong Tso'),
('22222222-2222-2222-2222-222222222201', 5, 'Pangong to Leh via Chang La', 'Sunrise at Pangong before the return drive to Leh over Chang La, the third-highest motorable pass in the world.', '["Sunrise at Pangong Tso","Return drive via Chang La (5,360m)","Evening at leisure in Leh"]', '{"breakfast": true, "lunch": true, "dinner": true}', 'Hotel in Leh'),
('22222222-2222-2222-2222-222222222201', 6, 'Monastery circuit — Thiksey, Hemis, Lamayuru', 'A full day exploring Ladakh''s most iconic monasteries, each perched dramatically on cliffs and ridgelines.', '["Thiksey Monastery — often compared to Lhasa''s Potala Palace","Hemis Monastery, Ladakh''s largest and wealthiest","Lamayuru''s striking moonscape terrain","Magnetic Hill photo stop"]', '{"breakfast": true, "lunch": true, "dinner": true}', 'Hotel in Leh'),
('22222222-2222-2222-2222-222222222201', 7, 'Departure', 'Transfer to Leh Airport in time for your onward flight. Trip ends after breakfast.', '["Breakfast at hotel","Airport drop"]', '{"breakfast": true, "lunch": false, "dinner": false}', null);

-- ---------------------------------------------------------------------------
-- Itinerary — Kerala Backwaters & Hill Escape (6 days)
-- ---------------------------------------------------------------------------
insert into itinerary_days (trip_id, day_number, title, description, activities, meals, accommodation) values
('22222222-2222-2222-2222-222222222202', 1, 'Arrive in Kochi — Fort Kochi walk', 'Settle in and spend the evening wandering Fort Kochi''s colonial lanes, ending at the iconic Chinese fishing nets for sunset.', '["Airport pickup and hotel check-in","Fort Kochi heritage walk","Chinese fishing nets at sunset","Optional Kathakali performance"]', '{"breakfast": false, "lunch": false, "dinner": true}', 'Hotel in Kochi'),
('22222222-2222-2222-2222-222222222202', 2, 'Kochi to Munnar', 'Drive up into the Western Ghats, climbing through increasingly green, tea-covered hills.', '["Scenic drive to Munnar (~4hrs)","Cheeyappara & Valara waterfall stops","Check-in and evening at leisure"]', '{"breakfast": true, "lunch": false, "dinner": true}', 'Hotel in Munnar'),
('22222222-2222-2222-2222-222222222202', 3, 'Munnar sightseeing', 'A full day among the tea gardens, with a stop at Eravikulam National Park, home to the endangered Nilgiri Tahr.', '["Tea garden walk at golden hour","Eravikulam National Park","Tea Museum visit","Mattupetty Dam viewpoint"]', '{"breakfast": true, "lunch": true, "dinner": true}', 'Hotel in Munnar'),
('22222222-2222-2222-2222-222222222202', 4, 'Munnar to Thekkady', 'Drive to Thekkady for a spice plantation walk and an evening boat safari in Periyar Wildlife Sanctuary.', '["Guided spice plantation tour","Traditional Keralan lunch","Periyar Lake boat safari"]', '{"breakfast": true, "lunch": true, "dinner": true}', 'Hotel in Thekkady'),
('22222222-2222-2222-2222-222222222202', 5, 'Thekkady to Alleppey — houseboat overnight', 'Board a traditional Kettuvallam houseboat and drift through the backwaters as the sun sets over the coconut groves.', '["Drive to Alleppey","Houseboat check-in by noon","Backwater cruise through village canals","Onboard dinner and overnight stay"]', '{"breakfast": true, "lunch": true, "dinner": true}', 'Private houseboat, Alleppey'),
('22222222-2222-2222-2222-222222222202', 6, 'Alleppey to Kochi — departure', 'Disembark after breakfast and transfer to Kochi for your onward journey.', '["Breakfast aboard the houseboat","Drive back to Kochi","Airport/station drop"]', '{"breakfast": true, "lunch": false, "dinner": false}', null);

-- ---------------------------------------------------------------------------
-- Itinerary — Royal Rajasthan Heritage Trail (8 days)
-- ---------------------------------------------------------------------------
insert into itinerary_days (trip_id, day_number, title, description, activities, meals, accommodation) values
('22222222-2222-2222-2222-222222222203', 1, 'Arrive in Jaipur — Amber Fort', 'Check in and head straight to Amber Fort for the evening light and sound show, recounting Rajput history against the fort''s ramparts.', '["Airport/station pickup and check-in","Amber Fort visit","Evening light & sound show"]', '{"breakfast": false, "lunch": false, "dinner": true}', 'Heritage hotel, Jaipur'),
('22222222-2222-2222-2222-222222222203', 2, 'Jaipur city tour', 'A full day through the Pink City''s landmarks, from the City Palace to the honeycomb facade of Hawa Mahal.', '["City Palace and museum","Hawa Mahal photo stop","Jantar Mantar observatory","Johari Bazaar for local shopping"]', '{"breakfast": true, "lunch": true, "dinner": false}', 'Heritage hotel, Jaipur'),
('22222222-2222-2222-2222-222222222203', 3, 'Jaipur to Jodhpur', 'A scenic drive west to the Blue City, with an optional stop in Ajmer or Pushkar en route.', '["Drive to Jodhpur (~6-7hrs)","Optional Pushkar stop","Evening at leisure"]', '{"breakfast": true, "lunch": false, "dinner": true}', 'Heritage hotel, Jodhpur'),
('22222222-2222-2222-2222-222222222203', 4, 'Jodhpur — Mehrangarh Fort', 'Explore one of India''s largest forts, towering 120m above the city, followed by a walk through the Blue City''s old quarter.', '["Mehrangarh Fort and museum","Jaswant Thada cenotaph","Blue City walking tour"]', '{"breakfast": true, "lunch": true, "dinner": false}', 'Heritage hotel, Jodhpur'),
('22222222-2222-2222-2222-222222222203', 5, 'Jodhpur to Jaisalmer', 'Drive deeper into the Thar Desert to the golden sandstone city of Jaisalmer.', '["Drive to Jaisalmer (~5-6hrs)","Check-in and evening at leisure","Sunset at Gadisar Lake"]', '{"breakfast": true, "lunch": false, "dinner": true}', 'Hotel in Jaisalmer'),
('22222222-2222-2222-2222-222222222203', 6, 'Jaisalmer Fort & desert camp', 'Explore the living fort and its carved havelis by day, then head into the dunes for a camel safari and a night under canvas.', '["Jaisalmer Fort and Patwon ki Haveli","Camel safari at Sam Sand Dunes","Desert camp check-in with folk music and dance"]', '{"breakfast": true, "lunch": true, "dinner": true}', 'Desert camp, Sam Dunes'),
('22222222-2222-2222-2222-222222222203', 7, 'Jaisalmer to Udaipur — Lake Pichola', 'Travel to Udaipur (flight/train recommended) and close the day with a sunset boat ride on Lake Pichola.', '["Transfer to Udaipur","City Palace visit","Sunset boat ride on Lake Pichola"]', '{"breakfast": true, "lunch": false, "dinner": true}', 'Lakeside hotel, Udaipur'),
('22222222-2222-2222-2222-222222222203', 8, 'Departure', 'Free morning to explore Udaipur''s old city lanes before your airport/station transfer.', '["Breakfast at hotel","Free time in old city","Airport/station drop"]', '{"breakfast": true, "lunch": false, "dinner": false}', null);

-- ---------------------------------------------------------------------------
-- Itinerary — Goa Beach & Sunset Getaway (4 days)
-- ---------------------------------------------------------------------------
insert into itinerary_days (trip_id, day_number, title, description, activities, meals, accommodation) values
('22222222-2222-2222-2222-222222222204', 1, 'Arrive — Baga & Calangute', 'Check in near Calangute and ease into the trip with an evening on North Goa''s liveliest beaches.', '["Airport pickup and check-in","Baga and Calangute beach walk","Sunset at Fort Aguada"]', '{"breakfast": false, "lunch": false, "dinner": false}', 'Hotel near Calangute'),
('22222222-2222-2222-2222-222222222204', 2, 'North Goa exploration', 'A full day through North Goa''s beach towns, with time set aside for water sports for anyone who wants them.', '["Anjuna and Vagator beaches","Chapora Fort viewpoint","Optional water sports at Calangute"]', '{"breakfast": true, "lunch": false, "dinner": false}', 'Hotel near Calangute'),
('22222222-2222-2222-2222-222222222204', 3, 'Old Goa & Mandovi sunset cruise', 'Visit the UNESCO-listed churches of Old Goa, followed by a spice plantation lunch and a live-music sunset cruise.', '["Basilica of Bom Jesus and Se Cathedral","Spice plantation tour and lunch","Mandovi River sunset cruise with live music"]', '{"breakfast": true, "lunch": true, "dinner": false}', 'Hotel near Calangute'),
('22222222-2222-2222-2222-222222222204', 4, 'Leisure morning & departure', 'A free morning at the beach before your airport transfer.', '["Free time at the beach","Airport drop"]', '{"breakfast": true, "lunch": false, "dinner": false}', null);

-- ---------------------------------------------------------------------------
-- Itinerary — Spiti Valley Overland Expedition (8 days)
-- ---------------------------------------------------------------------------
insert into itinerary_days (trip_id, day_number, title, description, activities, meals, accommodation) values
('22222222-2222-2222-2222-222222222205', 1, 'Shimla arrival — drive to Sarahan', 'Meet the group in Shimla and begin heading east toward Kinnaur, with an overnight stop in the temple town of Sarahan.', '["Group meet-up in Shimla","Drive to Sarahan via Narkanda","Bhimakali Temple visit"]', '{"breakfast": false, "lunch": true, "dinner": true}', 'Guesthouse in Sarahan'),
('22222222-2222-2222-2222-222222222205', 2, 'Sarahan to Chitkul via Sangla', 'Drive into the Sangla Valley and reach Chitkul, the last inhabited village before the Tibet border.', '["Sangla Valley drive","Kamru Fort stop","Chitkul — last village on the old Hindustan-Tibet trade route"]', '{"breakfast": true, "lunch": true, "dinner": true}', 'Homestay in Chitkul'),
('22222222-2222-2222-2222-222222222205', 3, 'Chitkul to Kalpa via Reckong Peo', 'Head to Kalpa, with sweeping views of the Kinnaur Kailash range right from your room.', '["Drive via Reckong Peo","Kalpa village walk","Sunset over Kinnaur Kailash"]', '{"breakfast": true, "lunch": true, "dinner": true}', 'Guesthouse in Kalpa'),
('22222222-2222-2222-2222-222222222205', 4, 'Kalpa to Nako', 'Cross into the drier, higher-altitude terrain of Spiti proper, arriving at the ancient village of Nako beside its sacred lake.', '["Drive along the Hindustan-Tibet highway","Nako Lake and monastery","Village walk at sunset"]', '{"breakfast": true, "lunch": true, "dinner": true}', 'Guesthouse in Nako'),
('22222222-2222-2222-2222-222222222205', 5, 'Nako to Kaza via Tabo', 'Visit Tabo Monastery — over 1,000 years old and often called the "Ajanta of the Himalayas" — before continuing to Kaza, Spiti''s largest town.', '["Tabo Monastery and its ancient murals","Drive to Kaza","Evening at leisure"]', '{"breakfast": true, "lunch": true, "dinner": true}', 'Guesthouse in Kaza'),
('22222222-2222-2222-2222-222222222205', 6, 'Kaza — Key Monastery & Kibber', 'A day exploring the villages around Kaza, including Key Monastery and Kibber, among the highest motorable villages in the world.', '["Key Monastery","Kibber village and Chicham bridge","Wildlife spotting (ibex, blue sheep — seasonal)"]', '{"breakfast": true, "lunch": true, "dinner": true}', 'Guesthouse in Kaza'),
('22222222-2222-2222-2222-222222222205', 7, 'Kaza to Manali via Kunzum Pass', 'Cross the dramatic Kunzum Pass and, conditions permitting, stop at the turquoise Chandratal Lake before descending to Manali.', '["Kunzum Pass crossing (4,590m)","Chandratal Lake, weather permitting","Descent to Manali via Rohtang"]', '{"breakfast": true, "lunch": true, "dinner": true}', 'Hotel in Manali'),
('22222222-2222-2222-2222-222222222205', 8, 'Departure', 'Trip ends after breakfast in Manali.', '["Breakfast at hotel","Onward travel from Manali"]', '{"breakfast": true, "lunch": false, "dinner": false}', null);

-- ---------------------------------------------------------------------------
-- Itinerary — Meghalaya Living Root Bridges Trek (6 days)
-- ---------------------------------------------------------------------------
insert into itinerary_days (trip_id, day_number, title, description, activities, meals, accommodation) values
('22222222-2222-2222-2222-222222222206', 1, 'Guwahati to Shillong', 'Drive up into the hills to Shillong, with a stop at Umiam Lake along the way.', '["Airport pickup","Umiam Lake stop","Check-in and evening market walk"]', '{"breakfast": false, "lunch": false, "dinner": true}', 'Hotel in Shillong'),
('22222222-2222-2222-2222-222222222206', 2, 'Shillong local sightseeing', 'Explore Shillong''s waterfalls, viewpoints and markets — often called the "Scotland of the East."', '["Elephant Falls","Shillong Peak viewpoint","Ward''s Lake and local market"]', '{"breakfast": true, "lunch": true, "dinner": true}', 'Hotel in Shillong'),
('22222222-2222-2222-2222-222222222206', 3, 'Shillong to Cherrapunji', 'Head to Cherrapunji, one of the wettest places on Earth, to see its dramatic waterfalls and limestone caves.', '["Nohkalikai Falls, India''s tallest plunge waterfall","Mawsmai limestone caves","Seven Sisters Falls viewpoint"]', '{"breakfast": true, "lunch": true, "dinner": true}', 'Homestay in Cherrapunji'),
('22222222-2222-2222-2222-222222222206', 4, 'Trek to Nongriat root bridge', 'Descend roughly 3,500 steps to Nongriat village to see — and cross — the famous double-decker living root bridge, grown over generations.', '["Guided trek down to Nongriat","Double-decker living root bridge crossing","Swim in the village''s natural pools"]', '{"breakfast": true, "lunch": true, "dinner": true}', 'Village homestay in Nongriat'),
('22222222-2222-2222-2222-222222222206', 5, 'Trek back — drive to Dawki', 'Trek back up to the road, then continue to Dawki for a boat ride on one of the clearest rivers in Asia.', '["Trek back to Cherrapunji","Umngot River boating at Dawki","Mawlynnong village — Asia''s cleanest village"]', '{"breakfast": true, "lunch": true, "dinner": true}', 'Hotel in Shillong'),
('22222222-2222-2222-2222-222222222206', 6, 'Departure', 'Transfer back to Guwahati for your onward flight.', '["Breakfast at hotel","Drive to Guwahati airport"]', '{"breakfast": true, "lunch": false, "dinner": false}', null);

-- ---------------------------------------------------------------------------
-- Itinerary — Rishikesh Yoga & Rafting Weekend (3 days)
-- ---------------------------------------------------------------------------
insert into itinerary_days (trip_id, day_number, title, description, activities, meals, accommodation) values
('22222222-2222-2222-2222-222222222207', 1, 'Arrive — Ganga Aarti', 'Check into your riverside camp and spend the evening at the Ganga Aarti ceremony, one of the most atmospheric rituals in India.', '["Pickup and camp check-in","Free time by the river","Evening Ganga Aarti at Triveni Ghat"]', '{"breakfast": false, "lunch": false, "dinner": true}', 'Riverside camp, Rishikesh'),
('22222222-2222-2222-2222-222222222207', 2, 'Yoga & white-water rafting', 'Start with a guided sunrise yoga session by the river, then spend the afternoon rafting a 16km stretch of Grade II–III rapids.', '["Sunrise yoga and meditation session","16km white-water rafting stretch","Evening bonfire with music"]', '{"breakfast": true, "lunch": true, "dinner": true}', 'Riverside camp, Rishikesh'),
('22222222-2222-2222-2222-222222222207', 3, 'Waterfall visit & departure', 'A short trek to Neer Garh Waterfall before wrapping up and heading home.', '["Neer Garh Waterfall trek","Breakfast at camp","Drop-off / onward travel"]', '{"breakfast": true, "lunch": false, "dinner": false}', null);

-- ---------------------------------------------------------------------------
-- Itinerary — Andaman Islands Honeymoon Escape (5 days)
-- ---------------------------------------------------------------------------
insert into itinerary_days (trip_id, day_number, title, description, activities, meals, accommodation) values
('22222222-2222-2222-2222-222222222208', 1, 'Arrive in Port Blair', 'Settle in and spend the evening at the Cellular Jail''s light and sound show, tracing the islands'' history.', '["Airport pickup and check-in","Corbyn''s Cove Beach","Cellular Jail light & sound show"]', '{"breakfast": false, "lunch": false, "dinner": true}', 'Hotel in Port Blair'),
('22222222-2222-2222-2222-222222222208', 2, 'Port Blair to Havelock — Radhanagar sunset', 'Take the morning ferry to Havelock (Swaraj Dweep) and close the day at Radhanagar Beach, regularly ranked among Asia''s best.', '["Ferry to Havelock Island","Check-in at beachfront resort","Sunset at Radhanagar Beach"]', '{"breakfast": true, "lunch": false, "dinner": true}', 'Beachfront resort, Havelock'),
('22222222-2222-2222-2222-222222222208', 3, 'Havelock — snorkelling & Elephant Beach', 'A full day in the water — snorkelling over coral at Elephant Beach, with optional scuba diving for certified or trial divers.', '["Boat to Elephant Beach","Snorkelling over coral reef","Optional scuba diving session"]', '{"breakfast": true, "lunch": false, "dinner": true}', 'Beachfront resort, Havelock'),
('22222222-2222-2222-2222-222222222208', 4, 'Havelock to Neil Island', 'Ferry to the quieter Neil Island (Shaheed Dweep) for a slower final stretch, with two of the prettiest beaches in the archipelago.', '["Ferry to Neil Island","Bharatpur Beach","Sunset at Laxmanpur Beach — plus your private beach dinner"]', '{"breakfast": true, "lunch": false, "dinner": true}', 'Resort on Neil Island'),
('22222222-2222-2222-2222-222222222208', 5, 'Return to Port Blair — departure', 'Ferry back to Port Blair in time for your flight home.', '["Morning at leisure","Ferry to Port Blair","Airport drop"]', '{"breakfast": true, "lunch": false, "dinner": false}', null);

-- ---------------------------------------------------------------------------
-- Departures (fixed batches for group trips — trigger auto-computes status)
-- ---------------------------------------------------------------------------
insert into departures (trip_id, start_date, end_date, total_seats, seats_booked, price_override) values
-- Leh-Ladakh
('22222222-2222-2222-2222-222222222201', '2026-09-05', '2026-09-11', 14, 11, null),
('22222222-2222-2222-2222-222222222201', '2026-09-19', '2026-09-25', 14, 6, null),
('22222222-2222-2222-2222-222222222201', '2027-06-12', '2027-06-18', 14, 2, null),
-- Kerala
('22222222-2222-2222-2222-222222222202', '2026-09-20', '2026-09-25', 16, 5, null),
('22222222-2222-2222-2222-222222222202', '2026-11-15', '2026-11-20', 16, 13, null),
('22222222-2222-2222-2222-222222222202', '2026-12-27', '2027-01-01', 16, 16, null),
-- Rajasthan
('22222222-2222-2222-2222-222222222203', '2026-10-10', '2026-10-17', 18, 9, null),
('22222222-2222-2222-2222-222222222203', '2026-12-20', '2026-12-27', 18, 15, 38999),
('22222222-2222-2222-2222-222222222203', '2027-01-15', '2027-01-22', 18, 4, null),
-- Goa
('22222222-2222-2222-2222-222222222204', '2026-08-21', '2026-08-24', 20, 18, null),
('22222222-2222-2222-2222-222222222204', '2026-09-04', '2026-09-07', 20, 10, null),
('22222222-2222-2222-2222-222222222204', '2026-10-02', '2026-10-05', 20, 3, null),
-- Spiti
('22222222-2222-2222-2222-222222222205', '2026-09-10', '2026-09-17', 12, 10, null),
('22222222-2222-2222-2222-222222222205', '2027-06-18', '2027-06-25', 12, 2, null),
('22222222-2222-2222-2222-222222222205', '2027-07-09', '2027-07-16', 12, 6, null),
-- Meghalaya
('22222222-2222-2222-2222-222222222206', '2026-10-24', '2026-10-29', 12, 9, null),
('22222222-2222-2222-2222-222222222206', '2026-11-21', '2026-11-26', 12, 4, null),
('22222222-2222-2222-2222-222222222206', '2027-02-13', '2027-02-18', 12, 7, null),
-- Rishikesh
('22222222-2222-2222-2222-222222222207', '2026-08-14', '2026-08-16', 24, 20, null),
('22222222-2222-2222-2222-222222222207', '2026-08-28', '2026-08-30', 24, 12, null),
('22222222-2222-2222-2222-222222222207', '2026-09-11', '2026-09-13', 24, 6, null);

-- ---------------------------------------------------------------------------
-- Reviews
-- ---------------------------------------------------------------------------
insert into reviews (trip_id, author_name, rating, title, body, trip_month) values
('22222222-2222-2222-2222-222222222201', 'Aditi R.', 5, 'Best trip of my life', 'Pangong at sunset genuinely doesn''t look real. Our trip leader Tenzin was incredible about altitude safety — never once felt rushed or unsafe. Worth every rupee.', 'July 2026'),
('22222222-2222-2222-2222-222222222201', 'Karan M.', 5, 'Well organised, small group', 'Group of 8, which made it feel personal. The oxygen cylinder in the car isn''t just a formality — one of us needed it on day 3 and it was handled calmly and quickly.', 'June 2026'),
('22222222-2222-2222-2222-222222222201', 'Priya S.', 4, 'Incredible views, tough but manageable', 'The altitude is real, go in with realistic expectations and start Diamox early. That said, Nubra Valley alone was worth the trip.', 'May 2026'),

('22222222-2222-2222-2222-222222222202', 'Rohan T.', 5, 'Houseboat night was magical', 'Falling asleep to the sound of water against a Kettuvallam houseboat is something everyone should experience once. Munnar tea gardens were a close second highlight.', 'January 2026'),
('22222222-2222-2222-2222-222222222202', 'Meera K.', 5, 'Relaxed pace, great food', 'Loved that this wasn''t a rush-through-everything itinerary. Thekkady spice plantation lunch was one of the best meals of the whole trip.', 'December 2025'),
('22222222-2222-2222-2222-222222222202', 'Sanjay P.', 4, 'Lovely trip, minor delays', 'Everything was well planned. We had one delay getting to Alleppey due to traffic, but the team communicated clearly throughout.', 'November 2025'),

('22222222-2222-2222-2222-222222222203', 'Neha & Arjun', 5, 'Felt like a movie', 'The desert camp night with the folk performance around the fire is something we still talk about. Every fort had a knowledgeable local guide, not just a driver pointing at buildings.', 'February 2026'),
('22222222-2222-2222-2222-222222222203', 'Vikram D.', 5, 'Four cities, zero stress', 'Logistics across four cities can get messy, but everything from hotel check-ins to the Jaisalmer-Udaipur transfer was seamless.', 'January 2026'),
('22222222-2222-2222-2222-222222222203', 'Ishita B.', 5, 'Udaipur sunset boat ride!', 'Lake Pichola at sunset from the boat is one of those money-can''t-quite-capture-it moments. Loved the whole trail.', 'December 2025'),

('22222222-2222-2222-2222-222222222204', 'Farhan A.', 4, 'Great for a quick reset', 'Exactly what I needed for a long weekend. The Mandovi cruise with live music was a nice surprise — wasn''t expecting a live band on a river cruise.', 'January 2026'),
('22222222-2222-2222-2222-222222222204', 'Sneha J.', 5, 'Easy, breezy, well planned', 'No stress at all, hotel was well located near Calangute and the spice plantation lunch was surprisingly good.', 'December 2025'),
('22222222-2222-2222-2222-222222222204', 'Aakash V.', 4, 'Good value', 'Solid itinerary for the price. Would have liked one more free evening but overall very happy.', 'November 2025'),

('22222222-2222-2222-2222-222222222205', 'Devika N.', 5, 'Not for the faint-hearted, but incredible', 'This is genuinely an expedition, not a vacation — long drives, basic homestays, thin air. And absolutely worth it. Tabo Monastery was a highlight I wasn''t expecting to love as much as I did.', 'September 2025'),
('22222222-2222-2222-2222-222222222205', 'Rahul G.', 5, 'Kunzum Pass and Chandratal — unreal', 'We got lucky with weather and made it to Chandratal. Even without that, the Spiti landscape alone justifies the trip.', 'July 2025'),

('22222222-2222-2222-2222-222222222206', 'Tanya S.', 5, '3500 steps well worth it', 'Legs were sore for days but standing on the double-decker root bridge made it completely worth it. The homestay in Nongriat was a lovely, humbling experience.', 'November 2025'),
('22222222-2222-2222-2222-222222222206', 'Manav K.', 5, 'Dawki river has to be seen to be believed', 'The water is so clear the boats look like they''re floating in mid-air. Whole trip was beautifully paced.', 'October 2025'),

('22222222-2222-2222-2222-222222222207', 'Ritika P.', 5, 'Perfect quick getaway from Delhi', 'Rafting guides were certified and safety-conscious, yoga session at sunrise was a genuinely peaceful start to the day. Great value for a 3-day trip.', 'June 2026'),
('22222222-2222-2222-2222-222222222207', 'Yash B.', 4, 'Fun but book early', 'Batches fill up fast on weekends, so plan ahead. The rafting stretch was a great mix of calm and thrilling sections.', 'May 2026'),

('22222222-2222-2222-2222-222222222208', 'Pooja & Siddharth', 5, 'Dream honeymoon, zero regrets', 'The private beach dinner on Radhanagar was the highlight of our entire trip — impeccably arranged, very private. Neil Island was the perfect quiet ending.', 'February 2026'),
('22222222-2222-2222-2222-222222222208', 'Ananya & Rohit', 5, 'Customisation made all the difference', 'They adjusted our itinerary twice before departure without any hassle. Snorkelling at North Bay was better than we expected.', 'January 2026');
