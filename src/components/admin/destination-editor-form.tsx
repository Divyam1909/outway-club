"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { revalidatePublicPages } from "@/lib/revalidate-client";
import { ImageUploader } from "@/components/admin/image-uploader";
import { friendlyError, networkError } from "@/lib/error-messages";
import { slugify } from "@/lib/utils";
import type { Destination } from "@/lib/types";

const INPUT =
  "w-full rounded-xl border border-border px-3.5 py-2.5 text-sm focus:border-pine focus:outline-none";
const LABEL = "mb-1.5 block text-sm font-medium text-ink-700";

/**
 * Create / edit a destination.
 *
 * This exists so the person who actually plans a trip never has to open the
 * database to add the place it goes to. Writes go straight to Supabase under
 * the caller's session — the "destinations: admin write/update" RLS policies
 * are the guard, exactly as the trip editor works.
 */
export function DestinationEditorForm({
  destination,
  /** How many trips point here — a destination in use cannot be deleted. */
  tripCount = 0,
}: {
  destination?: Destination;
  tripCount?: number;
}) {
  const router = useRouter();
  const isEdit = Boolean(destination);

  const [name, setName] = useState(destination?.name ?? "");
  const [slug, setSlug] = useState(destination?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [region, setRegion] = useState(destination?.region ?? "");
  const [country, setCountry] = useState(destination?.country ?? "India");
  const [tagline, setTagline] = useState(destination?.tagline ?? "");
  const [description, setDescription] = useState(destination?.description ?? "");
  const [bestTime, setBestTime] = useState(destination?.best_time ?? "");
  const [heroImage, setHeroImage] = useState(destination?.hero_image ?? "");
  const [gallery, setGallery] = useState<string[]>(destination?.gallery ?? []);
  const [isFeatured, setIsFeatured] = useState(destination?.is_featured ?? false);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!heroImage) {
      setError("Upload a hero image, the destination card and page header both need one.");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const payload = {
      slug: slug || slugify(name),
      name,
      region,
      country: country || "India",
      tagline: tagline || null,
      description: description || null,
      best_time: bestTime || null,
      hero_image: heroImage,
      gallery,
      is_featured: isFeatured,
    };

    try {
      const { error: writeError } = isEdit
        ? await supabase.from("destinations").update(payload).eq("id", destination!.id)
        : await supabase.from("destinations").insert(payload);

      if (writeError) {
        setError(
          friendlyError(
            writeError,
            "destination",
            "Couldn't save the destination. Please try again."
          )
        );
        setSaving(false);
        return;
      }

      setSaving(false);
      await revalidatePublicPages("destination", payload.slug);
      // A rename leaves the old address cached and still serving the place.
      if (destination && destination.slug !== payload.slug) {
        await revalidatePublicPages("destination", destination.slug);
      }
      router.push("/admin/destinations");
      router.refresh();
    } catch (caught) {
      console.error("[destination-editor] save failed:", caught);
      setError(networkError());
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-5 heading-sm text-lg text-ink">Where it is</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="destination-name" className={LABEL}>
              Name
            </label>
            <input
              id="destination-name"
              className={INPUT}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (!slugTouched) setSlug(slugify(event.target.value));
              }}
              placeholder="Udaipur"
              required
            />
          </div>

          <div>
            <label htmlFor="destination-slug" className={LABEL}>
              Web address
            </label>
            <div className="flex items-center gap-1 rounded-xl border border-border px-3.5 focus-within:border-pine">
              <span className="shrink-0 text-sm text-ink-500">/destinations/</span>
              <input
                id="destination-slug"
                className="w-full bg-transparent py-2.5 text-sm focus:outline-none"
                value={slug}
                onChange={(event) => {
                  setSlug(event.target.value);
                  setSlugTouched(true);
                }}
                required
              />
            </div>
            {isEdit && (
              <p className="mt-1.5 text-xs text-clay-600">
                Changing this breaks any existing link to the old address.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="destination-region" className={LABEL}>
              State or region
            </label>
            <input
              id="destination-region"
              className={INPUT}
              value={region}
              onChange={(event) => setRegion(event.target.value)}
              placeholder="Rajasthan"
              required
            />
          </div>

          <div>
            <label htmlFor="destination-country" className={LABEL}>
              Country
            </label>
            <input
              id="destination-country"
              className={INPUT}
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="destination-tagline" className={LABEL}>
              Tagline <span className="font-normal text-ink-500">(optional)</span>
            </label>
            <input
              id="destination-tagline"
              className={INPUT}
              value={tagline}
              onChange={(event) => setTagline(event.target.value)}
              placeholder="Lake palaces, old-city lanes and the best sunsets in Rajasthan."
              maxLength={200}
            />
            <p className="mt-1.5 text-xs text-ink-500">
              One line under the name on the destination card.
            </p>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="destination-best-time" className={LABEL}>
              Best time to visit <span className="font-normal text-ink-500">(optional)</span>
            </label>
            <input
              id="destination-best-time"
              className={INPUT}
              value={bestTime}
              onChange={(event) => setBestTime(event.target.value)}
              placeholder="September to March"
            />
          </div>
        </div>

        <label className="mt-5 flex items-center gap-2 text-sm text-ink-700">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(event) => setIsFeatured(event.target.checked)}
          />
          Feature on the homepage and destinations page
        </label>
      </section>

      <section className="rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-5 heading-sm text-lg text-ink">Description</h2>
        <label htmlFor="destination-description" className={LABEL}>
          About this place <span className="font-normal text-ink-500">(optional)</span>
        </label>
        <textarea
          id="destination-description"
          className={INPUT}
          rows={5}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What the place is actually like, in a couple of honest paragraphs. This shows on the destination page and is what search engines read."
        />
      </section>

      <section className="rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-5 heading-sm text-lg text-ink">Photography</h2>
        <div className="space-y-5">
          <ImageUploader
            label="Hero image"
            hint="Top of the destination page and the destination card. Landscape, at least 1600px wide."
            value={heroImage ? [heroImage] : []}
            onChange={(next) => setHeroImage(next[0] ?? "")}
          />
          <ImageUploader
            label="Gallery"
            hint="Optional. Three to six photos of the place itself, not of a specific trip."
            value={gallery}
            onChange={setGallery}
            multiple
          />
        </div>
      </section>

      {isEdit && tripCount > 0 && (
        <p className="rounded-xl bg-cream-300 px-4 py-3 text-sm text-ink-500">
          {tripCount} trip{tripCount === 1 ? "" : "s"} currently point here. Editing this
          destination updates every one of them.
        </p>
      )}

      {error && (
        <p role="alert" className="rounded-xl bg-clay-50 px-4 py-3 text-sm text-clay-600">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={saving} className="btn-primary px-8 py-3">
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create destination"}
        </button>
        <Link href="/admin/destinations" className="btn-ghost px-4 py-3 text-ink-500">
          <X size={15} /> Cancel
        </Link>
      </div>
    </form>
  );
}
