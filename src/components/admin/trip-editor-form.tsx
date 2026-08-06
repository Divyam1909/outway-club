"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import type { Category, Destination, Difficulty, TripType, TripWithDetails } from "@/lib/types";

const INPUT = "w-full rounded-xl border border-border px-3.5 py-2.5 text-sm focus:border-pine focus:outline-none";
const LABEL = "mb-1.5 block text-sm font-medium text-ink-700";

interface DayDraft {
  id: string;
  day_number: number;
  title: string;
  description: string;
  activitiesText: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  accommodation: string;
}

interface DepartureDraft {
  id: string;
  start_date: string;
  end_date: string;
  total_seats: number;
  price_override: string;
}

function toLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function fromLines(items: string[] | undefined): string {
  return (items ?? []).join("\n");
}

export function TripEditorForm({
  destinations,
  initialTrip,
}: {
  destinations: Destination[];
  initialTrip?: TripWithDetails;
}) {
  const router = useRouter();
  const isEdit = Boolean(initialTrip);

  const [title, setTitle] = useState(initialTrip?.title ?? "");
  const [slug, setSlug] = useState(initialTrip?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [destinationId, setDestinationId] = useState(initialTrip?.destination_id ?? destinations[0]?.id ?? "");
  const [category, setCategory] = useState<Category>(initialTrip?.category ?? "adventure");
  const [tripType, setTripType] = useState<TripType>(initialTrip?.trip_type ?? "group");
  const [durationDays, setDurationDays] = useState(initialTrip?.duration_days ?? 5);
  const [durationNights, setDurationNights] = useState(initialTrip?.duration_nights ?? 4);
  const [difficulty, setDifficulty] = useState<Difficulty>(initialTrip?.difficulty ?? "easy");
  const [pricePerPerson, setPricePerPerson] = useState(initialTrip?.price_per_person ?? 0);
  const [discountedPrice, setDiscountedPrice] = useState(initialTrip?.discounted_price ?? "");
  const [groupSizeMin, setGroupSizeMin] = useState(initialTrip?.group_size_min ?? 2);
  const [groupSizeMax, setGroupSizeMax] = useState(initialTrip?.group_size_max ?? 16);
  const [startingPoint, setStartingPoint] = useState(initialTrip?.starting_point ?? "");
  const [shortDescription, setShortDescription] = useState(initialTrip?.short_description ?? "");
  const [description, setDescription] = useState(initialTrip?.description ?? "");
  const [heroImage, setHeroImage] = useState(initialTrip?.hero_image ?? "");
  const [galleryText, setGalleryText] = useState(fromLines(initialTrip?.gallery));
  const [highlightsText, setHighlightsText] = useState(fromLines(initialTrip?.highlights));
  const [inclusionsText, setInclusionsText] = useState(fromLines(initialTrip?.inclusions));
  const [exclusionsText, setExclusionsText] = useState(fromLines(initialTrip?.exclusions));
  const [thingsToCarryText, setThingsToCarryText] = useState(fromLines(initialTrip?.things_to_carry));
  const [isFeatured, setIsFeatured] = useState(initialTrip?.is_featured ?? false);
  const [isGroupTrip, setIsGroupTrip] = useState(initialTrip?.is_group_trip ?? true);
  const [isPublished, setIsPublished] = useState(initialTrip?.is_published ?? true);

  const [days, setDays] = useState<DayDraft[]>(
    initialTrip?.itinerary_days.map((d) => ({
      id: d.id,
      day_number: d.day_number,
      title: d.title,
      description: d.description,
      activitiesText: fromLines(d.activities),
      breakfast: d.meals.breakfast,
      lunch: d.meals.lunch,
      dinner: d.meals.dinner,
      accommodation: d.accommodation ?? "",
    })) ?? []
  );

  const [departures, setDepartures] = useState<DepartureDraft[]>(
    initialTrip?.departures.map((d) => ({
      id: d.id,
      start_date: d.start_date,
      end_date: d.end_date,
      total_seats: d.total_seats,
      price_override: d.price_override ? String(d.price_override) : "",
    })) ?? []
  );

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function addDay() {
    setDays((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        day_number: prev.length + 1,
        title: "",
        description: "",
        activitiesText: "",
        breakfast: true,
        lunch: true,
        dinner: true,
        accommodation: "",
      },
    ]);
  }

  function updateDay(id: string, patch: Partial<DayDraft>) {
    setDays((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }

  function removeDay(id: string) {
    setDays((prev) => prev.filter((d) => d.id !== id).map((d, i) => ({ ...d, day_number: i + 1 })));
  }

  function addDeparture() {
    setDepartures((prev) => [
      ...prev,
      { id: crypto.randomUUID(), start_date: "", end_date: "", total_seats: 16, price_override: "" },
    ]);
  }

  function updateDeparture(id: string, patch: Partial<DepartureDraft>) {
    setDepartures((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }

  function removeDeparture(id: string) {
    setDepartures((prev) => prev.filter((d) => d.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!destinationId) {
      setError("Select a destination.");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const tripPayload = {
      title,
      slug: slug || slugify(title),
      destination_id: destinationId,
      category,
      trip_type: tripType,
      duration_days: durationDays,
      duration_nights: durationNights,
      difficulty,
      price_per_person: pricePerPerson,
      discounted_price: discountedPrice === "" ? null : Number(discountedPrice),
      group_size_min: groupSizeMin,
      group_size_max: groupSizeMax,
      starting_point: startingPoint || null,
      short_description: shortDescription,
      description,
      hero_image: heroImage,
      gallery: toLines(galleryText),
      highlights: toLines(highlightsText),
      inclusions: toLines(inclusionsText),
      exclusions: toLines(exclusionsText),
      things_to_carry: toLines(thingsToCarryText),
      is_featured: isFeatured,
      is_group_trip: isGroupTrip,
      is_published: isPublished,
    };

    let tripId = initialTrip?.id;

    if (isEdit && tripId) {
      const { error: updateError } = await supabase.from("trips").update(tripPayload).eq("id", tripId);
      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    } else {
      const { data, error: insertError } = await supabase.from("trips").insert(tripPayload).select("id").single();
      if (insertError || !data) {
        setError(insertError?.message ?? "Could not create trip.");
        setSaving(false);
        return;
      }
      tripId = data.id;
    }

    await supabase.from("itinerary_days").delete().eq("trip_id", tripId);
    if (days.length > 0) {
      const { error: daysError } = await supabase.from("itinerary_days").insert(
        days.map((d) => ({
          trip_id: tripId,
          day_number: d.day_number,
          title: d.title,
          description: d.description,
          activities: toLines(d.activitiesText),
          meals: { breakfast: d.breakfast, lunch: d.lunch, dinner: d.dinner },
          accommodation: d.accommodation || null,
        }))
      );
      if (daysError) {
        setError(daysError.message);
        setSaving(false);
        return;
      }
    }

    await supabase.from("departures").delete().eq("trip_id", tripId);
    const validDepartures = departures.filter((d) => d.start_date && d.end_date);
    if (validDepartures.length > 0) {
      const { error: departuresError } = await supabase.from("departures").insert(
        validDepartures.map((d) => ({
          trip_id: tripId,
          start_date: d.start_date,
          end_date: d.end_date,
          total_seats: d.total_seats,
          price_override: d.price_override === "" ? null : Number(d.price_override),
        }))
      );
      if (departuresError) {
        setError(departuresError.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    router.push("/admin/trips");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <section className="rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-5 font-display text-lg font-semibold text-ink">Basics</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={LABEL}>Trip title</label>
            <input
              className={INPUT}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              required
            />
          </div>
          <div>
            <label className={LABEL}>Slug</label>
            <input
              className={INPUT}
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              required
            />
          </div>
          <div>
            <label className={LABEL}>Destination</label>
            <select className={INPUT} value={destinationId} onChange={(e) => setDestinationId(e.target.value)} required>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL}>Category</label>
            <select className={INPUT} value={category} onChange={(e) => setCategory(e.target.value as Category)}>
              {["adventure", "leisure", "honeymoon", "pilgrimage", "wildlife", "trek", "weekend", "family", "culture"].map(
                (c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                )
              )}
            </select>
          </div>
          <div>
            <label className={LABEL}>Trip type</label>
            <select className={INPUT} value={tripType} onChange={(e) => setTripType(e.target.value as TripType)}>
              <option value="group">Group</option>
              <option value="private">Private</option>
              <option value="customizable">Customizable</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Difficulty</label>
            <select className={INPUT} value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
              <option value="easy">Easy</option>
              <option value="moderate">Moderate</option>
              <option value="challenging">Challenging</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Starting point</label>
            <input className={INPUT} value={startingPoint} onChange={(e) => setStartingPoint(e.target.value)} />
          </div>
          <div>
            <label className={LABEL}>Duration (days)</label>
            <input type="number" min={1} className={INPUT} value={durationDays} onChange={(e) => setDurationDays(Number(e.target.value))} />
          </div>
          <div>
            <label className={LABEL}>Duration (nights)</label>
            <input type="number" min={0} className={INPUT} value={durationNights} onChange={(e) => setDurationNights(Number(e.target.value))} />
          </div>
          <div>
            <label className={LABEL}>Group size min</label>
            <input type="number" min={1} className={INPUT} value={groupSizeMin} onChange={(e) => setGroupSizeMin(Number(e.target.value))} />
          </div>
          <div>
            <label className={LABEL}>Group size max</label>
            <input type="number" min={1} className={INPUT} value={groupSizeMax} onChange={(e) => setGroupSizeMax(Number(e.target.value))} />
          </div>
          <div>
            <label className={LABEL}>Price per person (₹)</label>
            <input type="number" min={0} className={INPUT} value={pricePerPerson} onChange={(e) => setPricePerPerson(Number(e.target.value))} required />
          </div>
          <div>
            <label className={LABEL}>Discounted price (₹, optional)</label>
            <input
              type="number"
              min={0}
              className={INPUT}
              value={discountedPrice}
              onChange={(e) => setDiscountedPrice(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" checked={isGroupTrip} onChange={(e) => setIsGroupTrip(e.target.checked)} /> Group trip
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} /> Featured
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} /> Published
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-5 font-display text-lg font-semibold text-ink">Content</h2>
        <div className="space-y-4">
          <div>
            <label className={LABEL}>Short description (card &amp; hero subtitle)</label>
            <textarea className={INPUT} rows={2} value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} required />
          </div>
          <div>
            <label className={LABEL}>Full description</label>
            <textarea className={INPUT} rows={4} value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>
          <div>
            <label className={LABEL}>Hero image URL</label>
            <input className={INPUT} value={heroImage} onChange={(e) => setHeroImage(e.target.value)} required />
          </div>
          <div>
            <label className={LABEL}>Gallery image URLs (one per line)</label>
            <textarea className={INPUT} rows={3} value={galleryText} onChange={(e) => setGalleryText(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL}>Highlights (one per line)</label>
              <textarea className={INPUT} rows={4} value={highlightsText} onChange={(e) => setHighlightsText(e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>Things to carry (one per line)</label>
              <textarea className={INPUT} rows={4} value={thingsToCarryText} onChange={(e) => setThingsToCarryText(e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>Inclusions (one per line)</label>
              <textarea className={INPUT} rows={4} value={inclusionsText} onChange={(e) => setInclusionsText(e.target.value)} />
            </div>
            <div>
              <label className={LABEL}>Exclusions (one per line)</label>
              <textarea className={INPUT} rows={4} value={exclusionsText} onChange={(e) => setExclusionsText(e.target.value)} />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-white p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">Day-by-day itinerary</h2>
          <button type="button" onClick={addDay} className="btn-outline !px-3 !py-1.5 text-xs">
            <Plus size={14} /> Add day
          </button>
        </div>
        <div className="space-y-4">
          {days.map((day) => (
            <div key={day.id} className="rounded-xl border border-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-ink-700">Day {day.day_number}</span>
                <button type="button" onClick={() => removeDay(day.id)} className="text-clay hover:text-clay-600">
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  className={INPUT}
                  placeholder="Day title"
                  value={day.title}
                  onChange={(e) => updateDay(day.id, { title: e.target.value })}
                />
                <input
                  className={INPUT}
                  placeholder="Accommodation"
                  value={day.accommodation}
                  onChange={(e) => updateDay(day.id, { accommodation: e.target.value })}
                />
              </div>
              <textarea
                className={`${INPUT} mt-3`}
                rows={2}
                placeholder="Day description"
                value={day.description}
                onChange={(e) => updateDay(day.id, { description: e.target.value })}
              />
              <textarea
                className={`${INPUT} mt-3`}
                rows={2}
                placeholder="Activities (one per line)"
                value={day.activitiesText}
                onChange={(e) => updateDay(day.id, { activitiesText: e.target.value })}
              />
              <div className="mt-3 flex gap-5">
                <label className="flex items-center gap-2 text-sm text-ink-700">
                  <input type="checkbox" checked={day.breakfast} onChange={(e) => updateDay(day.id, { breakfast: e.target.checked })} /> Breakfast
                </label>
                <label className="flex items-center gap-2 text-sm text-ink-700">
                  <input type="checkbox" checked={day.lunch} onChange={(e) => updateDay(day.id, { lunch: e.target.checked })} /> Lunch
                </label>
                <label className="flex items-center gap-2 text-sm text-ink-700">
                  <input type="checkbox" checked={day.dinner} onChange={(e) => updateDay(day.id, { dinner: e.target.checked })} /> Dinner
                </label>
              </div>
            </div>
          ))}
          {days.length === 0 && <p className="text-sm text-ink-400">No days added yet.</p>}
        </div>
      </section>

      {isGroupTrip && (
        <section className="rounded-2xl border border-border bg-white p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">Departures</h2>
              <p className="text-xs text-ink-400">Saving replaces the full departure list below.</p>
            </div>
            <button type="button" onClick={addDeparture} className="btn-outline !px-3 !py-1.5 text-xs">
              <Plus size={14} /> Add departure
            </button>
          </div>
          <div className="space-y-3">
            {departures.map((departure) => (
              <div key={departure.id} className="grid grid-cols-2 gap-3 rounded-xl border border-border p-4 sm:grid-cols-5">
                <div>
                  <label className={LABEL}>Start date</label>
                  <input type="date" className={INPUT} value={departure.start_date} onChange={(e) => updateDeparture(departure.id, { start_date: e.target.value })} />
                </div>
                <div>
                  <label className={LABEL}>End date</label>
                  <input type="date" className={INPUT} value={departure.end_date} onChange={(e) => updateDeparture(departure.id, { end_date: e.target.value })} />
                </div>
                <div>
                  <label className={LABEL}>Total seats</label>
                  <input type="number" min={1} className={INPUT} value={departure.total_seats} onChange={(e) => updateDeparture(departure.id, { total_seats: Number(e.target.value) })} />
                </div>
                <div>
                  <label className={LABEL}>Price override (₹)</label>
                  <input className={INPUT} value={departure.price_override} onChange={(e) => updateDeparture(departure.id, { price_override: e.target.value })} />
                </div>
                <div className="flex items-end">
                  <button type="button" onClick={() => removeDeparture(departure.id)} className="btn-outline w-full !py-2.5 text-clay">
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </div>
            ))}
            {departures.length === 0 && <p className="text-sm text-ink-400">No departures added yet.</p>}
          </div>
        </section>
      )}

      {error && <p className="rounded-xl bg-clay-50 px-4 py-3 text-sm text-clay-600">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="btn-primary px-8 py-3">
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create trip"}
        </button>
      </div>
    </form>
  );
}
