"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Percent, IndianRupee, Save, X } from "lucide-react";
import { clsx } from "clsx";
import { messageFromResponse, networkError } from "@/lib/error-messages";
import { discountFor } from "@/lib/promo-rules";
import { formatINR } from "@/lib/utils";
import type { PromoCode, Trip } from "@/lib/types";

const INPUT =
  "w-full rounded-xl border border-border px-3.5 py-2.5 text-sm focus:border-pine focus:outline-none";
const LABEL = "mb-1.5 block text-sm font-medium text-ink-700";
const HINT = "mt-1.5 text-xs leading-relaxed text-ink-500";

/**
 * Create or edit a discount code.
 *
 * The panel at the bottom is the important part of this screen. Everything
 * above it is fields; that panel prices the code the customer would actually
 * get, using the same `discountFor` the server uses — so "10%, capped at ₹500"
 * stops being an abstraction before it goes live rather than after someone
 * books on it. Two-thirds of promo mistakes are a number that reads right and
 * computes wrong, and this is the only place to catch those for free.
 */
export function PromoCodeForm({
  promo,
  trips,
}: {
  promo?: PromoCode;
  trips: Pick<Trip, "id" | "title" | "price_per_person" | "discounted_price" | "is_published">[];
}) {
  const router = useRouter();
  const isEdit = Boolean(promo);

  const [code, setCode] = useState(promo?.code ?? "");
  const [label, setLabel] = useState(promo?.label ?? "");
  const [description, setDescription] = useState(promo?.description ?? "");

  const [discountType, setDiscountType] = useState<"percent" | "flat">(
    promo?.discount_type ?? "percent"
  );
  const [discountValue, setDiscountValue] = useState(String(promo?.discount_value ?? ""));
  const [maxDiscountAmount, setMaxDiscountAmount] = useState(
    promo?.max_discount_amount !== null && promo?.max_discount_amount !== undefined
      ? String(promo.max_discount_amount)
      : ""
  );
  const [perTraveler, setPerTraveler] = useState(promo?.per_traveler ?? false);

  const [minOrderAmount, setMinOrderAmount] = useState(
    promo?.min_order_amount ? String(promo.min_order_amount) : ""
  );
  const [minTravelers, setMinTravelers] = useState(String(promo?.min_travelers ?? 1));
  const [usageLimit, setUsageLimit] = useState(
    promo?.usage_limit !== null && promo?.usage_limit !== undefined ? String(promo.usage_limit) : ""
  );
  const [perUserLimit, setPerUserLimit] = useState(
    promo?.per_user_limit !== null && promo?.per_user_limit !== undefined
      ? String(promo.per_user_limit)
      : ""
  );

  const [startsAt, setStartsAt] = useState(toLocalInput(promo?.starts_at));
  const [endsAt, setEndsAt] = useState(toLocalInput(promo?.ends_at));

  const [isActive, setIsActive] = useState(promo?.is_active ?? true);
  const [autoApply, setAutoApply] = useState(promo?.auto_apply ?? false);
  const [tripIds, setTripIds] = useState<string[]>(promo?.trip_ids ?? []);

  const [partnerName, setPartnerName] = useState(promo?.partner_name ?? "");
  const [partnerHandle, setPartnerHandle] = useState(promo?.partner_handle ?? "");
  const [notes, setNotes] = useState(promo?.notes ?? "");

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // The preview prices against a real trip: the first one the code is pinned
  // to, else the first published trip. A worked example on a made-up price
  // would be the exact thing this panel exists to prevent.
  const sampleTrip =
    trips.find((trip) => tripIds.includes(trip.id)) ??
    trips.find((trip) => trip.is_published) ??
    trips[0];

  const preview = useMemo(() => {
    const value = Number(discountValue);
    if (!sampleTrip || !Number.isFinite(value) || value <= 0) return null;

    const perPerson = Number(sampleTrip.discounted_price ?? sampleTrip.price_per_person);
    const shape = {
      discount_type: discountType,
      discount_value: value,
      max_discount_amount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
      per_traveler: perTraveler,
    } as PromoCode;

    return [1, 2, 4].map((travelers) => {
      const subtotal = perPerson * travelers;
      const discount = discountFor(shape, subtotal, travelers);
      return { travelers, subtotal, discount, total: subtotal - discount };
    });
  }, [sampleTrip, discountType, discountValue, maxDiscountAmount, perTraveler]);

  function toggleTrip(id: string) {
    setTripIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
  }

  async function save() {
    setError(null);
    setSaving(true);

    const payload = {
      code,
      label,
      description,
      discountType,
      discountValue: Number(discountValue),
      maxDiscountAmount: maxDiscountAmount === "" ? null : Number(maxDiscountAmount),
      perTraveler,
      minOrderAmount: minOrderAmount === "" ? 0 : Number(minOrderAmount),
      minTravelers: Number(minTravelers) || 1,
      usageLimit: usageLimit === "" ? null : Number(usageLimit),
      perUserLimit: perUserLimit === "" ? null : Number(perUserLimit),
      startsAt: startsAt || null,
      endsAt: endsAt || null,
      isActive,
      autoApply,
      tripIds,
      partnerName,
      partnerHandle,
      notes,
    };

    try {
      const response = await fetch(
        isEdit ? `/api/admin/promo-codes/${promo!.id}` : "/api/admin/promo-codes",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      setSaving(false);

      if (!response.ok) {
        setError(await messageFromResponse(response, "Couldn't save that code."));
        return;
      }

      router.push("/admin/promo-codes");
      router.refresh();
    } catch {
      setSaving(false);
      setError(networkError());
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
      className="space-y-8"
    >
      {/* --- Identity -------------------------------------------------------- */}
      <section className="rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-5 heading-sm text-lg text-ink">The code</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="promo-code" className={LABEL}>
              Code
            </label>
            <input
              id="promo-code"
              className={`${INPUT} font-mono uppercase tracking-wider`}
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase())
              }
              placeholder="RIYA10"
              maxLength={40}
              required
            />
            <p className={HINT}>
              Letters and numbers only, so it survives being read aloud on a reel. Matched
              case-insensitively.
            </p>
          </div>
          <div>
            <label htmlFor="promo-label" className={LABEL}>
              Name shown to the customer
            </label>
            <input
              id="promo-label"
              className={INPUT}
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Janmashtami special"
              maxLength={80}
              required
            />
            <p className={HINT}>Appears on the discount line at checkout.</p>
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="promo-description" className={LABEL}>
            Description <span className="font-normal text-ink-500">(optional)</span>
          </label>
          <input
            id="promo-description"
            className={INPUT}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="₹1,000 off every traveller on the 4 September departure."
            maxLength={300}
          />
        </div>
      </section>

      {/* --- The discount ---------------------------------------------------- */}
      <section className="rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-5 heading-sm text-lg text-ink">What comes off</h2>

        <div className="mb-4 grid grid-cols-2 gap-3">
          {(
            [
              { value: "percent", label: "A percentage", icon: Percent },
              { value: "flat", label: "A flat amount", icon: IndianRupee },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setDiscountType(option.value)}
              aria-pressed={discountType === option.value}
              className={clsx(
                "flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors",
                discountType === option.value
                  ? "border-pine bg-pine-50 text-pine-600"
                  : "border-border text-ink-700 hover:border-pine"
              )}
            >
              <option.icon size={15} /> {option.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="promo-value" className={LABEL}>
              {discountType === "percent" ? "Percent off" : "Rupees off"}
            </label>
            {/* step="any" on every money field, deliberately.
                `step={50}` alongside `min={1}` makes the browser treat 1, 51,
                101 … as the only valid values — so "₹1,000 off" is refused by
                native validation, the form silently declines to submit, and the
                only feedback is a tooltip that vanishes. A step meant as a
                nudge for the spinner arrows quietly became a constraint on what
                a discount is allowed to be. The server validates the range. */}
            <input
              id="promo-value"
              className={INPUT}
              type="number"
              min={1}
              max={discountType === "percent" ? 90 : undefined}
              step="any"
              inputMode="decimal"
              value={discountValue}
              onChange={(event) => setDiscountValue(event.target.value)}
              required
            />
          </div>

          {discountType === "percent" ? (
            <div>
              <label htmlFor="promo-cap" className={LABEL}>
                Never take off more than
              </label>
              <input
                id="promo-cap"
                className={INPUT}
                type="number"
                min={1}
                step="any"
                inputMode="decimal"
                value={maxDiscountAmount}
                onChange={(event) => setMaxDiscountAmount(event.target.value)}
                placeholder="No cap"
              />
              <p className={HINT}>
                Set this. Without a cap, &ldquo;10% off&rdquo; is ₹900 on one traveller and ₹9,000
                on a group of ten.
              </p>
            </div>
          ) : (
            <div className="flex items-end pb-1">
              <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink-700">
                <input
                  type="checkbox"
                  checked={perTraveler}
                  onChange={(event) => setPerTraveler(event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-pine"
                />
                <span>
                  Per traveller
                  <span className="mt-0.5 block text-xs text-ink-500">
                    On, four travellers get four times this. Off, it comes off the order once.
                  </span>
                </span>
              </label>
            </div>
          )}
        </div>
      </section>

      {/* --- Limits ---------------------------------------------------------- */}
      <section className="rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-1.5 heading-sm text-lg text-ink">Limits</h2>
        <p className="mb-5 text-sm text-ink-500">Leave a field blank for no limit.</p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="promo-usage-limit" className={LABEL}>
              Total uses
            </label>
            <input
              id="promo-usage-limit"
              className={INPUT}
              type="number"
              min={1}
              step={1}
              value={usageLimit}
              onChange={(event) => setUsageLimit(event.target.value)}
              placeholder="Unlimited"
            />
            {promo && (
              <p className={HINT}>
                Used {promo.times_used} time{promo.times_used === 1 ? "" : "s"} so far.
              </p>
            )}
          </div>
          <div>
            <label htmlFor="promo-per-user" className={LABEL}>
              Uses per person
            </label>
            <input
              id="promo-per-user"
              className={INPUT}
              type="number"
              min={1}
              step={1}
              value={perUserLimit}
              onChange={(event) => setPerUserLimit(event.target.value)}
              placeholder="Unlimited"
            />
            <p className={HINT}>Counted by email address on the request.</p>
          </div>
          <div>
            <label htmlFor="promo-min-order" className={LABEL}>
              Minimum order
            </label>
            <input
              id="promo-min-order"
              className={INPUT}
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              value={minOrderAmount}
              onChange={(event) => setMinOrderAmount(event.target.value)}
              placeholder="No minimum"
            />
          </div>
          <div>
            <label htmlFor="promo-min-travelers" className={LABEL}>
              Minimum travellers
            </label>
            <input
              id="promo-min-travelers"
              className={INPUT}
              type="number"
              min={1}
              step={1}
              value={minTravelers}
              onChange={(event) => setMinTravelers(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="promo-starts" className={LABEL}>
              Live from
            </label>
            <input
              id="promo-starts"
              className={INPUT}
              type="datetime-local"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
            />
            <p className={HINT}>Blank means immediately.</p>
          </div>
          <div>
            <label htmlFor="promo-ends" className={LABEL}>
              Live until
            </label>
            <input
              id="promo-ends"
              className={INPUT}
              type="datetime-local"
              value={endsAt}
              onChange={(event) => setEndsAt(event.target.value)}
            />
            <p className={HINT}>Blank means it runs until you switch it off.</p>
          </div>
        </div>
      </section>

      {/* --- Where it applies ------------------------------------------------- */}
      <section className="rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-1.5 heading-sm text-lg text-ink">Which escapes</h2>
        <p className="mb-4 text-sm text-ink-500">
          Tick none and it works on everything, including escapes that don&apos;t exist yet.
        </p>

        <ul className="space-y-2">
          {trips.map((trip) => (
            <li key={trip.id}>
              <label className="flex cursor-pointer items-center gap-2.5 rounded-xl bg-cream-300 px-4 py-2.5 text-sm text-ink-700">
                <input
                  type="checkbox"
                  checked={tripIds.includes(trip.id)}
                  onChange={() => toggleTrip(trip.id)}
                  className="h-4 w-4 accent-pine"
                />
                <span className="flex-1">{trip.title}</span>
                <span className="text-xs text-ink-500">
                  {formatINR(Number(trip.discounted_price ?? trip.price_per_person))}
                  {trip.is_published ? "" : " · hidden"}
                </span>
              </label>
            </li>
          ))}
          {trips.length === 0 && (
            <li className="text-sm text-ink-500">No trips yet.</li>
          )}
        </ul>

        <div className="mt-5 space-y-3 border-t border-border pt-5">
          <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={autoApply}
              onChange={(event) => setAutoApply(event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-pine"
            />
            <span>
              Apply automatically, without anyone typing it
              <span className="mt-0.5 block text-xs leading-relaxed text-ink-500">
                For event offers. The discounted price shows on the trip page and the homepage, and
                the code lands on the request by itself. Needs an end date and at least one escape
                ticked — otherwise it&apos;s a permanent price cut, not an offer.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-pine"
            />
            <span>
              Switched on
              <span className="mt-0.5 block text-xs text-ink-500">
                Untick to stop the code dead without deleting what it has already done.
              </span>
            </span>
          </label>
        </div>
      </section>

      {/* --- Attribution ----------------------------------------------------- */}
      <section className="rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-1.5 heading-sm text-lg text-ink">Whose code is it</h2>
        <p className="mb-5 text-sm text-ink-500">
          Only ever shown in here. It&apos;s what turns the usage count into an invoice.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="promo-partner" className={LABEL}>
              Collaborator <span className="font-normal text-ink-500">(optional)</span>
            </label>
            <input
              id="promo-partner"
              className={INPUT}
              value={partnerName}
              onChange={(event) => setPartnerName(event.target.value)}
              placeholder="Riya Sharma"
              maxLength={120}
            />
          </div>
          <div>
            <label htmlFor="promo-handle" className={LABEL}>
              Handle or channel <span className="font-normal text-ink-500">(optional)</span>
            </label>
            <input
              id="promo-handle"
              className={INPUT}
              value={partnerHandle}
              onChange={(event) => setPartnerHandle(event.target.value)}
              placeholder="@riya.travels"
              maxLength={120}
            />
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="promo-notes" className={LABEL}>
            Internal note <span className="font-normal text-ink-500">(optional)</span>
          </label>
          <textarea
            id="promo-notes"
            className={INPUT}
            rows={2}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Agreed 8% commission on top, paid after the departure runs."
            maxLength={500}
          />
        </div>
      </section>

      {/* --- Worked example --------------------------------------------------- */}
      {preview && sampleTrip && (
        <section className="rounded-2xl border border-pine-100 bg-pine-50 p-6">
          <h2 className="heading-sm text-lg text-pine-600">What a customer actually pays</h2>
          <p className="mt-1.5 text-sm text-pine-600/80">
            Priced against <strong>{sampleTrip.title}</strong> at{" "}
            {formatINR(Number(sampleTrip.discounted_price ?? sampleTrip.price_per_person))} per
            person, using the same calculation the checkout uses.
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[26rem] text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-pine-600/70">
                <tr>
                  <th className="py-2 pr-4 font-medium">Travellers</th>
                  <th className="py-2 pr-4 font-medium">Before</th>
                  <th className="py-2 pr-4 font-medium">Discount</th>
                  <th className="py-2 font-medium">They pay</th>
                </tr>
              </thead>
              <tbody className="text-pine-600">
                {preview.map((row) => (
                  <tr key={row.travelers} className="border-t border-pine-100">
                    <td className="py-2.5 pr-4">{row.travelers}</td>
                    <td className="py-2.5 pr-4">{formatINR(row.subtotal)}</td>
                    <td className="py-2.5 pr-4 font-medium">−{formatINR(row.discount)}</td>
                    <td className="py-2.5 font-semibold">{formatINR(row.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {discountType === "percent" && !maxDiscountAmount && (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-clay-50 px-4 py-3 text-xs leading-relaxed text-clay-600">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
              No cap set, so the discount grows with the group. Look at the four-traveller row
              before you save this.
            </p>
          )}
        </section>
      )}

      {error && (
        <p role="alert" className="rounded-xl bg-clay-50 px-4 py-3 text-sm text-clay-600">
          {error}
        </p>
      )}

      <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center gap-3 border-t border-border bg-cream-300 px-1 py-4">
        <button type="submit" disabled={saving} className="btn-primary px-6 py-3">
          <Save size={15} /> {saving ? "Saving…" : isEdit ? "Save changes" : "Create code"}
        </button>
        <Link href="/admin/promo-codes" className="btn-ghost ml-auto px-4 py-3 text-ink-500">
          <X size={15} /> Cancel
        </Link>
      </div>
    </form>
  );
}

/**
 * ISO instant to the value a `datetime-local` input wants, in the operator's
 * own timezone. Formatting it in UTC — the obvious `toISOString().slice(0,16)`
 * — silently shows an Indian operator a code ending at 6.29pm when it ends at
 * midnight, and they "fix" it.
 */
function toLocalInput(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
