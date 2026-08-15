-- Outway Club — editorial seed: the Udaipur destination guide.
-- Run after supabase/seed.sql (needs the Udaipur destination and Escape 001).
--   node scripts/db.mjs supabase/seed-blog.sql
--
-- content_html is written by hand here rather than through the admin editor, so
-- it is kept inside the same tag/class allowlist the editor is sanitised against
-- (src/lib/sanitize-html.ts) — re-saving this post from the admin console must
-- not silently strip any of it.

insert into blog_posts (
  id, slug, title, subtitle, excerpt, content_html, cover_image, cover_caption,
  author_name, author_role, tags, destination_id, trip_id, reading_minutes,
  status, published_at, is_featured, seo_title, seo_description
) values (
  '44444444-4444-4444-4444-444444444001',
  'udaipur-travel-guide',
  'Udaipur, Slowly: A Travel Guide to the City Built on Water',
  'Why Rajasthan''s only lake city is where it is, what is genuinely worth your hours, and the case for visiting in the season everyone else skips.',
  'A guide to Udaipur that starts with the siege that created it: the City Palace, Lake Pichola at last light, the old city on foot, what to eat, and why the monsoon — not winter — is the season the lakes were built for.',
  '<p class="post-lead">Rajasthan learned to live without water. Jaisalmer is the exact colour of the dunes it stands on. Jodhpur turns its blue back to the Thar. Jaipur is pink, gridded and dry for nine months of the year. Then the road bends south into the Aravallis and sets you down in Udaipur — a city built around a lake, facing a lake, eating its dinner in front of a lake. Every guidebook will tell you it is the beautiful one. Almost none of them tell you why it is here at all.</p>

<p>It is here because of a siege.</p>

<p>For roughly eight centuries the rulers of Mewar held Chittorgarh, a fort on a lone plateau standing clear above the plains. It is a magnificent place and it has one flaw, which is that anything standing clear above a plain can be surrounded. In 1559, Maharana Udai Singh II began laying out a new capital about a hundred kilometres to the south-west, in a bowl of hills. The story told locally is that a hermit meditating on the ridge above the water told him to build on that spot. The engineering gives the same advice for less romantic reasons: hills on every side, one narrow approach, and a valley floor that could be dammed and held as a reservoir. Nine years later Akbar took Chittorgarh. The court never went back.</p>

<p>So the lakes are not decoration. They are the reason the city survived the century it was born into. Pichola itself is older than Udaipur — it was dug around 1362 by a banjara grain trader who needed water for his bullocks, and Udai Singh simply found it, widened it and built his palace along its eastern edge. Everything you will photograph here started as a solution to a supply problem.</p>

<p class="post-pullquote">Udaipur is not a beautiful city that happens to have water. It is a waterworks that happens to be beautiful.</p>

<p>Hold on to that idea, because it decides the single most useful thing in this guide: when to come.</p>

<h2>When to visit Udaipur — and why we argue for the monsoon</h2>

<p>The received wisdom is October to March, and the received wisdom is not wrong. The air is cool and clean, the light is hard and flattering, and you can walk all afternoon without thinking about it. It is also when the whole of India and half of Europe decides to visit, when the good rooftop tables are booked a week out, and when room rates roughly double.</p>

<p>There is a subtler problem. A city built around reservoirs is only fully itself when the reservoirs are full. By late winter the lakes have been drawn down for months; in drought years they have dropped far enough to expose bare lake bed and leave the Lake Palace sitting in a field. The postcard season is not always the season of the postcard.</p>

<p>Monsoon reverses it. From late June the water comes back, the lakes rise to the line the engineers intended, and the Aravallis — brown, scrubby and unremarkable for most of the year — turn a green that lasts about eight weeks. Rajasthan rain is not the Konkan wall of water. It arrives in bursts of an hour or two, most often in the afternoon, and then the sky opens and everything is washed and lit and steaming. August is the greenest week for week, which is exactly why we run <a href="/trips/udaipur-mount-abu">Escape 001</a> in August rather than in December.</p>

<p>Being honest about the cost of that choice: it is humid, a few sunsets will be lost behind cloud, and an afternoon here or there will be rained out. Take those odds. Cloud over Pichola at dusk does more for a photograph than a clear sky ever has.</p>

<h3>Season by season</h3>

<ul>
  <li><strong>July to September — monsoon.</strong> Full lakes, green hills, low crowds, the best rates of the year. Some rain, some humidity, occasional overcast evenings.</li>
  <li><strong>October to March — the postcard.</strong> Perfect weather, hardest light, highest prices, most people. December and January mornings are genuinely cold; carry a layer.</li>
  <li><strong>April to June — the one to avoid.</strong> Regularly over 40°C by mid-morning. The lakes are at their lowest and so is your appetite for walking anywhere.</li>
</ul>

<figure>
  <img src="/images/escape-001/gallery-2.jpg" alt="A wet ghat road curving down through deep green monsoon hills in the Aravallis, with low cloud caught along the ridges above" />
  <figcaption>The Aravallis in August. These are the eight weeks a year the hills look like this, and it is the entire reason we run the trip in monsoon rather than in December.</figcaption>
</figure>

<h2>The City Palace, and how to actually see it</h2>

<p>Udai Singh began it in 1559 and his successors kept adding for close to four hundred years, which is why it does not read as a building so much as a stack of them — courtyards inside courtyards, staircases that were clearly cut as afterthoughts, balconies added by one maharana to look down on a garden built by another. It is the largest palace complex in Rajasthan and it rewards a slow walk far more than a fast one.</p>

<p>Two hours is the honest minimum. Go at opening or leave it until after three; the middle of the day is when every tour group in the city is funnelled through the same three courtyards. The rooms worth slowing down for are the mirrored and glass-inlaid chambers on the upper floors, and any window on the lake side — the palace was designed so that the view is rationed, appearing suddenly through a screen or an arch rather than all at once.</p>

<figure>
  <img src="/images/blog/udaipur-travel-guide/01-city-palace.jpg" alt="An upper gallery inside the City Palace in Udaipur, scalloped arches receding in layers, a mirror-inlaid window on the right, a stone staircase cut into the thick wall, and a small arched window framing Lake Pichola beyond" />
  <figcaption>The view is rationed on purpose. The lake arrives through an arch at the end of a corridor rather than all at once, which is why the complex is worth walking slowly.</figcaption>
</figure>

<p>The Crystal Gallery is ticketed separately and is the strangest thing in the city. In 1877 Maharana Sajjan Singh ordered an enormous consignment of cut crystal from F&amp;C Osler of Birmingham — furniture, decanters, fountains, even a crystal bed. He died before it arrived. The crates sat unopened for over a century before anyone put it on display. It is a room full of English glass ordered by a man who never saw a single piece of it, and it is worth the extra ticket for that fact alone.</p>

<h2>Lake Pichola at last light</h2>

<p>Take the boat. Not because it is undiscovered — it is the most photographed hour in Rajasthan — but because Udaipur was designed to be seen from the water and everything makes more sense once you are on it. The palace wall reads as a defensive line rather than a hotel frontage. The ghats become the working edges they still are. The hills close the whole thing into the bowl Udai Singh chose.</p>

<p>Boats run through the day; the one that matters leaves around half past five and gets you onto open water for the last of the light. You pass Jag Mandir, the island palace where Prince Khurram sheltered in the 1620s after rebelling against his father — he would later rule as Shah Jahan — and then Jag Niwas, built as a summer palace in the 1740s and now the Taj Lake Palace. A note worth having in advance: you cannot visit the Lake Palace unless you are staying or have a dinner booking. Every year a great many people arrive expecting otherwise.</p>

<figure>
  <img src="/images/blog/udaipur-travel-guide/02-pichola-dusk.jpg" alt="A canopied wooden passenger boat crossing Lake Pichola at dusk, the Lake Palace sitting low on the water and the City Palace lit gold along the hillside behind" />
  <figcaption>The half-five boat, monsoon sky. The palace lights come on a few minutes before the light fully goes, and for about ninety seconds both are working at once.</figcaption>
</figure>

<h2>The old city is the sight</h2>

<p>The mistake is to treat Udaipur as a list of monuments with streets in between. The streets are the better half. The lanes behind Gangaur Ghat are barely wide enough for a scooter, the stone underfoot is worn concave by four centuries of use, and in monsoon the whole surface turns to a dark mirror that throws the buildings back at you. Give yourself one afternoon with nothing booked and get lost in it on purpose.</p>

<p>Two fixed points are worth aiming at. Jagdish Temple, built in 1651 by Maharana Jagat Singh I, sits up a steep flight of steps in the middle of the bazaar and is a working temple rather than a monument — go near an aarti and you will hear it before you see it. Gangaur Ghat, five minutes downhill, is where the city does its laundry, its bathing and its evening sitting, and it is the best free seat in Udaipur an hour before sunset.</p>

<p>Nearby, Bagore Ki Haveli was built in the eighteenth century for a prime minister of Mewar and now runs the Dharohar show at seven each evening — Rajasthan''s classical and folk repertoire in one courtyard, including Kalbeliya and the pot dance performed with eight or nine brass pots balanced on the head. It is unapologetically for visitors. It is also very good, and an hour long, which is the correct length.</p>

<figure>
  <img src="/images/blog/udaipur-travel-guide/03-old-city-lane.jpg" alt="A narrow old city lane in Udaipur after rain, with whitewashed and ochre walls, blue and green painted doors, a carved wooden balcony overhead, stacked clay pots and a woman in a pink sari walking away over wet flagstones" />
  <figcaption>The lanes behind the ghats after rain. No monument in the city photographs as well as this does at four in the afternoon.</figcaption>
</figure>

<p>One local phenomenon deserves warning. <em>Octopussy</em> was filmed here in 1983, using the Lake Palace and the Monsoon Palace, and a remarkable number of rooftop cafés have screened it nightly ever since. You will see the posters. You do not have to go. It is, however, a perfect illustration of how long this city has been in the business of being looked at.</p>

<h2>What to eat in Udaipur</h2>

<p>Mewar cooking is not the desert cooking of Jodhpur and Jaisalmer, and the difference is worth eating your way through. The dish to order first is <strong>laal maas</strong> — mutton in a fierce Mathania chilli gravy, a hunting dish that belongs to this part of Rajasthan more than anywhere else. Then <strong>gatte ki sabzi</strong>, gram flour dumplings simmered in spiced yoghurt, which exists because for most of history there were no fresh vegetables to be had for months at a stretch. Then <strong>dal baati churma</strong>, at least once, ideally at lunch and ideally with an afternoon free afterwards.</p>

<p>Breakfast is street food: <strong>pyaaz kachori</strong> or a <strong>mirchi vada</strong> from a stall that has a queue, with a <strong>makhaniya lassi</strong> thick enough to stand a spoon in. In monsoon, order the kachori from wherever the oil is visibly moving.</p>

<figure>
  <img src="/images/blog/udaipur-travel-guide/04-thali.jpg" alt="A brass thali viewed from above with dal, kadhi, a seasonal vegetable, cumin raita, red chilli pickle, rice, a wedge of lime and two bajra rotis, a hand reaching in from the lower edge of the frame" />
  <figcaption>A working Rajasthani thali — dal, kadhi, a seasonal sabzi, raita and bajra roti. Cheaper than any rooftop, and usually better.</figcaption>
</figure>

<p>About the rooftops, honestly: most of them are selling the view first and the food second, and the gap between the two can be wide. The exception is the row facing the palace across the water at Ambrai Ghat, where the view is so completely the point that it stops being a criticism — you are paying for a table directly opposite a floodlit City Palace, and it is worth it once. Book it. On our own trips we reserve that table before anyone flies in, because walking up at eight on a Saturday does not work.</p>

<h2>How many days do you need in Udaipur?</h2>

<p><strong>Two full days is the minimum for the city itself.</strong> That gives you one for the City Palace, the ghats and the sunset boat, and one for the old city on foot, a temple or two and an evening show — without ever moving faster than the place deserves. <strong>Three to four days</strong> lets you add the Aravallis: Kumbhalgarh, Ranakpur or Mount Abu, all of them day trips or overnights from here.</p>

<p>One day is a mistake people make often. You will see the palace, you will take the boat, and you will leave having toured a city whose entire quality is that it slows you down.</p>

<h2>Where to go next: the Aravallis</h2>

<p>Udaipur is the best base in southern Rajasthan, and the country around it is under-visited compared to the city.</p>

<ul>
  <li><strong>Kumbhalgarh</strong> — about two hours north. A fifteenth-century hill fort wrapped in a perimeter wall running some thirty-six kilometres, frequently described as the longest continuous wall in the world after the Great Wall of China. Maharana Pratap was born inside it.</li>
  <li><strong>Ranakpur</strong> — around two and a half hours. A fifteenth-century Jain temple carried on 1,444 marble pillars, no two of them carved alike. Go in the morning, when the light comes in low and sideways through the whole hall.</li>
  <li><strong>Mount Abu</strong> — four hours west, and the only hill station in Rajasthan. The Dilwara temples, carved between the eleventh and thirteenth centuries from marble worked so thin the light passes through it; Nakki Lake; and Guru Shikhar at 1,722 metres, the highest point in the Aravallis, where on a clear monsoon morning you look down onto cloud sitting in the valleys.</li>
  <li><strong>Sajjangarh</strong> — twenty minutes out, on the ridge above the city. Built in 1884 and known as the Monsoon Palace, which tells you the season it was designed for. Both lakes at once from the top.</li>
  <li><strong>Badi Lake and the Ahar cenotaphs</strong> — the two places locals send you and tour buses do not. Badi was built in the seventeenth century as famine relief work; Ahar is a quiet field of some two hundred and fifty royal cenotaphs, and you will often have it entirely to yourself.</li>
</ul>

<h2>Practical notes</h2>

<ul>
  <li><strong>Getting there.</strong> Maharana Pratap Airport (UDR) is about 22 km east of the city, with direct flights from Delhi, Mumbai and Bengaluru. Udaipur City (UDZ) is the railway station, walkable to the old city by auto in fifteen minutes. Ahmedabad is roughly five hours by road if you would rather fly there.</li>
  <li><strong>Getting around.</strong> The old city is walkable and largely closed to cars — stay inside it if you can. Autos handle everything else; agree the fare first. For the forts and Mount Abu you want a car and a driver, not a bus.</li>
  <li><strong>What to wear.</strong> Shoulders and knees covered for temples. Dilwara is stricter still: no leather of any kind, including belts and bags, and no cameras or phones inside.</li>
  <li><strong>Timing that catches people out.</strong> Dilwara opens to visitors only from midday, with the earlier hours reserved for worship. The Dharohar show is at seven. The boat you want is the half-five.</li>
  <li><strong>What to skip.</strong> The vintage car collection unless you already care about vintage cars, and any rooftop that has to advertise its view on a board at street level.</li>
</ul>

<hr />

<p>On your last evening, go up to any rooftop in the old city about twenty minutes before the light goes, and order something slowly. The hills turn from green to grey. The white houses go the colour of the sky. Then the palace switches on across the water, all at once, and the whole bowl of the valley reads exactly as it was drawn — the water held in the middle, the hills closed around it, one narrow way in.</p>

<p>Remember while you are looking at it that none of this was built to be looked at. It was a calculation about where to put the water, made by a man who had just watched what happens to a fort with no way to supply itself. The beauty was a by-product. It usually is.</p>

<p class="post-small">We run this city — and the four-hour drive west into the Aravallis behind it — as <a href="/trips/udaipur-mount-abu">Escape 001</a>, in August, for exactly the reasons above. More on the region in our <a href="/destinations/udaipur">Udaipur destination guide</a>.</p>',
  '/images/blog/udaipur-travel-guide/cover.jpg',
  'Dusk over the old city, the City Palace lit along the far edge of Lake Pichola and monsoon cloud sitting on the Aravallis.',
  'Outway Club',
  'Field notes, Escape 001',
  '["Udaipur","Rajasthan","Destination guide","Monsoon"]',
  '11111111-1111-1111-1111-111111111001',
  '22222222-2222-2222-2222-222222222001',
  11,
  'published',
  now(),
  true,
  'Udaipur Travel Guide: What to Do, When to Go, How Long to Stay',
  'A writer''s guide to Udaipur — the City Palace, Lake Pichola at sunset, the old city on foot, what to eat, and why monsoon is the best season to visit.'
)
on conflict (slug) do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  excerpt = excluded.excerpt,
  content_html = excluded.content_html,
  cover_image = excluded.cover_image,
  cover_caption = excluded.cover_caption,
  author_name = excluded.author_name,
  author_role = excluded.author_role,
  tags = excluded.tags,
  destination_id = excluded.destination_id,
  trip_id = excluded.trip_id,
  reading_minutes = excluded.reading_minutes,
  status = excluded.status,
  -- Keep the original publish date on re-runs; only ever set it once.
  published_at = coalesce(blog_posts.published_at, excluded.published_at),
  is_featured = excluded.is_featured,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description;
