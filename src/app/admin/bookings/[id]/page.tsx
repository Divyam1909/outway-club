import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { differenceInCalendarDays } from "date-fns";
import { ArrowLeft, CreditCard, Mail, MapPin, Phone, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SmartImage } from "@/components/ui/smart-image";
import { CancelBookingButton } from "@/components/account/cancel-booking-button";
import { getBookingByIdForAdmin } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { refundPercentFor } from "@/config/site";
import { formatDate, formatDateRange, formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "Booking detail" };
export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, "pine" | "clay" | "gold" | "ink"> = {
  confirmed: "pine",
  pending: "gold",
  cancelled: "ink",
  completed: "ink",
};

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const booking = await getBookingByIdForAdmin(id);
  if (!booking) notFound();

  const supabase = await createClient();
  const { data: customer } = await supabase
    .from("profiles")
    .select("full_name, email, phone, created_at")
    .eq("id", booking.user_id)
    .maybeSingle();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = booking.departure ? new Date(booking.departure.start_date) : null;
  const endDate = booking.departure ? new Date(booking.departure.end_date) : null;
  const daysBeforeDeparture = startDate ? differenceInCalendarDays(startDate, today) : null;

  const canCancel =
    (booking.status === "confirmed" || booking.status === "pending") &&
    (!endDate || endDate >= today);

  const email = booking.contact_email ?? customer?.email ?? null;
  const phone = booking.contact_phone ?? customer?.phone ?? null;

  return (
    <div>
      <Link
        href="/admin/bookings"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-pine"
      >
        <ArrowLeft size={15} /> All bookings
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-sm uppercase tracking-wider text-ink-400">
            {booking.id.slice(0, 8)}
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-ink">
            {booking.trip?.title ?? "Booking"}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone={STATUS_TONE[booking.status] ?? "ink"} className="capitalize">
              {booking.status}
            </Badge>
            <Badge tone={booking.payment_status === "paid" ? "pine" : "clay"}>
              {booking.payment_status.replace("_", " ")}
            </Badge>
            <span className="text-sm text-ink-400">Booked {formatDate(booking.created_at)}</span>
          </div>
        </div>

        <div className="text-right">
          <p className="font-display text-3xl font-semibold text-ink">
            {formatINR(booking.total_amount)}
          </p>
          {booking.refund_amount !== null && Number(booking.refund_amount) > 0 && (
            <p className="mt-1 text-sm font-medium text-clay">
              {formatINR(Number(booking.refund_amount))} refunded
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Panel title="Travellers on this booking">
            {booking.travelers && booking.travelers.length > 0 ? (
              <ul className="divide-y divide-border">
                {booking.travelers
                  .slice()
                  .sort((a, b) => Number(b.is_primary) - Number(a.is_primary))
                  .map((traveler) => (
                    <li key={traveler.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 first:pt-0 last:pb-0">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pine-50 text-pine">
                        <User size={15} />
                      </span>
                      <span className="flex-1 font-medium text-ink">{traveler.full_name}</span>
                      {traveler.age !== null && (
                        <span className="text-sm text-ink-500">{traveler.age} yrs</span>
                      )}
                      {traveler.gender && (
                        <span className="text-sm capitalize text-ink-500">{traveler.gender}</span>
                      )}
                      {traveler.is_primary && <Badge tone="gold">Primary</Badge>}
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-400">
                No traveller details were captured on this booking.
              </p>
            )}
          </Panel>

          {booking.special_requests && (
            <Panel title="Special requests">
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink-700">
                {booking.special_requests}
              </p>
            </Panel>
          )}

          <Panel title="Payment">
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              <Field label="Amount" value={formatINR(booking.total_amount)} />
              <Field label="Status" value={booking.payment_status.replace("_", " ")} />
              <Field label="Razorpay order" value={booking.razorpay_order_id ?? "N/A"} mono />
              <Field label="Razorpay payment" value={booking.razorpay_payment_id ?? "N/A"} mono />
              {booking.razorpay_refund_id && (
                <Field label="Razorpay refund" value={booking.razorpay_refund_id} mono />
              )}
              {booking.refund_amount !== null && (
                <Field label="Refund amount" value={formatINR(Number(booking.refund_amount))} />
              )}
            </dl>
          </Panel>

          {booking.status === "cancelled" && (
            <Panel title="Cancellation">
              <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                <Field
                  label="Cancelled on"
                  value={booking.cancelled_at ? formatDate(booking.cancelled_at) : "N/A"}
                />
                <Field
                  label="Refund"
                  value={formatINR(Number(booking.refund_amount ?? 0))}
                />
              </dl>
              {booking.cancellation_reason && (
                <p className="mt-4 rounded-xl bg-cream-300/70 p-4 text-sm leading-relaxed text-ink-700">
                  &ldquo;{booking.cancellation_reason}&rdquo;
                </p>
              )}
              {booking.payment_status === "refund_pending" && (
                <p className="mt-4 rounded-xl bg-clay-50 p-4 text-sm text-clay-700">
                  The automatic refund didn&apos;t go through, issue it manually in the Razorpay
                  dashboard against payment{" "}
                  <span className="font-mono">{booking.razorpay_payment_id}</span>, then mark this
                  booking refunded.
                </p>
              )}
            </Panel>
          )}
        </div>

        <div className="space-y-6">
          <Panel title="Customer">
            <p className="font-medium text-ink">{customer?.full_name ?? "Name not set"}</p>
            <div className="mt-3 space-y-2 text-sm">
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="flex items-center gap-2 text-ink-500 hover:text-pine"
                >
                  <Mail size={14} /> {email}
                </a>
              )}
              {phone && (
                <a href={`tel:${phone}`} className="flex items-center gap-2 text-ink-500 hover:text-pine">
                  <Phone size={14} /> {phone}
                </a>
              )}
              {customer?.created_at && (
                <p className="text-xs text-ink-400">
                  Account created {formatDate(customer.created_at)}
                </p>
              )}
            </div>
          </Panel>

          {booking.trip && (
            <Panel title="Trip">
              <Link href={`/trips/${booking.trip.slug}`} className="group block">
                <div className="relative mb-3 aspect-[16/9] overflow-hidden rounded-xl">
                  <SmartImage
                    src={booking.trip.hero_image}
                    alt={booking.trip.title}
                    fill
                    sizes="(min-width: 1024px) 320px, 100vw"
                    className="object-cover"
                  />
                </div>
                <p className="font-medium text-ink group-hover:text-pine">{booking.trip.title}</p>
              </Link>
              <div className="mt-3 space-y-2 text-sm text-ink-500">
                {booking.departure && (
                  <p className="flex items-center gap-2">
                    <MapPin size={14} />
                    {formatDateRange(booking.departure.start_date, booking.departure.end_date)}
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <CreditCard size={14} />
                  {booking.num_travelers} × {formatINR(Number(booking.total_amount) / booking.num_travelers)}
                </p>
                {daysBeforeDeparture !== null && daysBeforeDeparture >= 0 && (
                  <p className="text-xs text-ink-400">
                    {daysBeforeDeparture} day{daysBeforeDeparture === 1 ? "" : "s"} until departure
                  </p>
                )}
              </div>
            </Panel>
          )}

          {canCancel && booking.trip && (
            <div className="rounded-2xl border border-clay-100 bg-clay-50 p-5">
              <p className="text-sm font-semibold text-clay-700">Cancel on the customer&apos;s behalf</p>
              <p className="mt-1 text-xs leading-relaxed text-clay-600/85">
                Applies the same refund tier a customer would get, releases the seats and emails
                both of you.
              </p>
              <div className="mt-4">
                <CancelBookingButton
                  bookingId={booking.id}
                  tripTitle={booking.trip.title}
                  totalAmount={Number(booking.total_amount)}
                  refundPercent={
                    booking.payment_status === "paid"
                      ? refundPercentFor(daysBeforeDeparture ?? 999)
                      : 0
                  }
                  daysBeforeDeparture={daysBeforeDeparture}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-white p-6">
      <h2 className="mb-4 font-display text-lg font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-ink-400">{label}</dt>
      <dd
        className={
          mono
            ? "mt-0.5 break-all font-mono text-xs text-ink-700"
            : "mt-0.5 text-sm capitalize text-ink-700"
        }
      >
        {value}
      </dd>
    </div>
  );
}
