import type { Metadata } from "next";
import { Mail, Phone, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RequestStatus } from "@/components/admin/request-status";
import { getTripRequestsForAdmin } from "@/lib/data";
import { formatDate, formatDateRange } from "@/lib/utils";
import { QUESTIONNAIRE, answerLabel, questionLabel } from "@/config/trip-request";
import type { TripRequest } from "@/lib/types";
import { requireAdminPage } from "@/lib/auth";

export const metadata: Metadata = { title: "Booking requests" };
export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, "pine" | "clay" | "gold" | "ink"> = {
  new: "clay",
  contacted: "gold",
  confirmed: "pine",
  closed: "ink",
};

/** The answers most worth seeing at a glance when building a group. */
const HEADLINE_ANSWERS = ["travel_style", "evenings", "age_band"];

/**
 * Booking requests, grouped by the departure they're for.
 *
 * Grouped rather than listed flat because that's the actual job: eighteen
 * people on one bus works when the eighteen wanted the same weekend, so the
 * useful view is "who is on 15 August" — with the mix of answers summarised
 * above the names, not buried inside eighteen cards.
 */
export default async function AdminRequestsPage() {
  // Admin only. The layout lets a `blogger` into /admin for the Journal, so
  // every commercial screen states its own guard rather than inheriting one.
  await requireAdminPage();
  const requests = await getTripRequestsForAdmin();
  const newCount = requests.filter((request) => request.status === "new").length;
  const groups = groupByDeparture(requests);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Booking requests</h1>
      <p className="mb-6 mt-1 text-sm text-ink-500">
        {requests.length} total · {newCount} waiting on a reply · nothing here is a confirmed
        booking or a held seat
      </p>

      {requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white/50 p-12 text-center">
          <p className="heading-sm text-lg text-ink">No requests yet</p>
          <p className="mt-1 text-sm text-ink-500">
            Everyone who presses &ldquo;Book now&rdquo; fills the two-minute questionnaire, and it
            lands here. A copy goes to your inbox.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {groups.map((group) => (
            <section key={group.key}>
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="heading-sm text-lg text-ink">{group.label}</h2>
                <p className="text-sm text-ink-500">
                  {group.requests.length}{" "}
                  {group.requests.length === 1 ? "request" : "requests"} ·{" "}
                  {group.requests.reduce((sum, request) => sum + request.num_travelers, 0)}{" "}
                  travellers
                </p>
              </div>

              <GroupProfile requests={group.requests} />

              <ul className="mt-3 flex flex-col gap-3">
                {group.requests.map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function RequestCard({ request }: { request: TripRequest }) {
  const origin =
    request.origin_city === "other"
      ? request.origin_city_other || "Another city"
      : answerLabel("origin_city", request.origin_city);

  return (
    <li className="rounded-2xl border border-border bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-ink">{request.name}</p>
            <Badge tone={STATUS_TONE[request.status] ?? "ink"} className="capitalize">
              {request.status}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-ink-500">
              <Users size={12} aria-hidden="true" /> {request.num_travelers}
            </span>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <a
              href={`mailto:${request.email}?subject=${encodeURIComponent(
                `Your booking request${request.trip ? `: ${request.trip.title}` : ""}`
              )}`}
              className="flex items-center gap-1.5 text-pine hover:underline"
            >
              <Mail size={13} aria-hidden="true" /> {request.email}
            </a>
            <a
              href={`tel:${request.phone.replace(/\s/g, "")}`}
              className="flex items-center gap-1.5 text-ink-500 hover:text-pine"
            >
              <Phone size={13} aria-hidden="true" /> {request.phone}
            </a>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className="text-xs text-ink-500">{formatDate(request.created_at)}</span>
          <RequestStatus requestId={request.id} status={request.status} />
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 rounded-xl bg-cream-300 p-4 text-sm sm:grid-cols-2">
        <Row label="Starting from">{origin}</Row>
        <Row label="Flights / trains">{answerLabel("travel_help", request.travel_help)}</Row>
        {QUESTIONNAIRE.map((question) => (
          <Row key={question.id} label={questionLabel(question.id)}>
            {answerLabel(question.id, (request as unknown as Record<string, string>)[question.id])}
          </Row>
        ))}
      </dl>

      {request.deal_breakers && (
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-700">
          <span className="font-semibold text-ink">Would ruin it: </span>
          {request.deal_breakers}
        </p>
      )}

      {request.notes && (
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-700">
          <span className="font-semibold text-ink">Notes: </span>
          {request.notes}
        </p>
      )}
    </li>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/70 pb-1.5 last:border-b-0">
      <dt className="text-xs uppercase tracking-[0.12em] text-ink-500">{label}</dt>
      <dd className="text-right text-sm font-medium text-ink-700">{children}</dd>
    </div>
  );
}

/** The mix of answers on one departure, so a group can be read in a glance. */
function GroupProfile({ requests }: { requests: TripRequest[] }) {
  const rows = HEADLINE_ANSWERS.map((field) => {
    const tally = new Map<string, number>();
    for (const request of requests) {
      const value = (request as unknown as Record<string, string>)[field];
      if (!value) continue;
      tally.set(value, (tally.get(value) ?? 0) + 1);
    }
    return {
      field,
      counts: [...tally.entries()].sort((a, b) => b[1] - a[1]),
    };
  }).filter((row) => row.counts.length > 0);

  if (rows.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-white/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-500">
        Who&apos;s on this date
      </p>
      <div className="mt-2.5 space-y-2">
        {rows.map((row) => (
          <div key={row.field} className="flex flex-wrap items-baseline gap-x-2 gap-y-1.5">
            <span className="text-xs text-ink-500">{questionLabel(row.field)}</span>
            {row.counts.map(([value, count]) => (
              <span
                key={value}
                className="rounded-full bg-cream-300 px-2.5 py-1 text-xs font-medium text-ink-700"
              >
                {answerLabel(row.field, value)} · {count}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

interface RequestGroup {
  key: string;
  label: string;
  requests: TripRequest[];
}

function groupByDeparture(requests: TripRequest[]): RequestGroup[] {
  const groups = new Map<string, RequestGroup>();

  for (const request of requests) {
    const key = `${request.trip_id}:${request.departure_id ?? "none"}`;
    const dates = request.departure
      ? formatDateRange(request.departure.start_date, request.departure.end_date)
      : "No date chosen";
    const label = `${request.trip?.title ?? "Trip removed"} · ${dates}`;

    const existing = groups.get(key);
    if (existing) {
      existing.requests.push(request);
    } else {
      groups.set(key, { key, label, requests: [request] });
    }
  }

  return [...groups.values()];
}
