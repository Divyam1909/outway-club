"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Mail,
  MessageCircle,
  Phone,
  Send,
} from "lucide-react";
import { DepartureBoard } from "@/components/trips/departure-board";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { Stepper } from "@/components/ui/stepper";
import { TrustBand } from "@/components/trips/trust-band";
import { TrustPoints } from "@/components/trips/trust-points";
import { HONEYPOT_FIELD } from "@/lib/honeypot";
import { messageFromResponse, networkError } from "@/lib/error-messages";
import { formatDateRange, formatINR, seatsLeft } from "@/lib/utils";
import {
  ORIGIN_CITIES,
  TIMINGS_NOTE_SHORT,
  TRAVEL_HELP_OPTIONS,
  questionsInSection,
} from "@/config/trip-request";
import { site, whatsappLink } from "@/config/site";
import type { Departure } from "@/lib/types";

/**
 * The two-minute form that stands between "Book now" and us.
 *
 * Payments are off, so this does not check anyone out — it collects who is
 * travelling, how they're getting to the start point, and the handful of
 * answers that decide which group they belong in, then sends it to ops. The
 * questionnaire is compulsory and deliberately at the front: an eighteen-seat
 * bus works when the eighteen wanted roughly the same weekend.
 *
 * Five short steps rather than one long page, because a wall of twelve
 * questions reads as work and three cards reads as a conversation. Each step
 * validates on its own, and a failed step focuses the first thing that's
 * missing instead of scrolling the reader off to find it.
 */

const STEPS = [
  { id: "trip", title: "The trip" },
  { id: "travel", title: "Getting there" },
  { id: "style", title: "How you travel" },
  { id: "you", title: "About you" },
  { id: "details", title: "Your details" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

export function TripRequestForm({
  tripId,
  tripSlug,
  tripTitle,
  destinationName,
  departures,
  pricePerPerson,
  initialDepartureId,
  initialTravelers,
  maxTravelers,
  initialOrigin,
  prefillName,
  prefillEmail,
  prefillPhone,
}: {
  tripId: string;
  tripSlug: string;
  tripTitle: string;
  destinationName: string;
  departures: Departure[];
  pricePerPerson: number;
  initialDepartureId: string;
  initialTravelers: number;
  maxTravelers: number;
  /** From ?from=delhi on the trip page's "getting there" chips. */
  initialOrigin: string;
  prefillName: string;
  prefillEmail: string;
  prefillPhone: string;
}) {
  const mountedAt = useRef(Date.now());
  const controls = useRef<Record<string, HTMLElement | null>>({});

  const [stepIndex, setStepIndex] = useState(0);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [departureId, setDepartureId] = useState(initialDepartureId);
  const [travelers, setTravelers] = useState(Math.min(Math.max(initialTravelers, 1), maxTravelers));

  const [originCity, setOriginCity] = useState(initialOrigin);
  const [originCityOther, setOriginCityOther] = useState("");
  const [travelHelp, setTravelHelp] = useState("");

  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [name, setName] = useState(prefillName);
  const [email, setEmail] = useState(prefillEmail);
  const [phone, setPhone] = useState(prefillPhone);
  const [dealBreakers, setDealBreakers] = useState("");
  const [notes, setNotes] = useState("");
  const [understood, setUnderstood] = useState(false);
  const [trap, setTrap] = useState("");

  const step = STEPS[stepIndex];
  const selectedDeparture = departures.find((departure) => departure.id === departureId) ?? null;
  const seatCap = useMemo(() => {
    if (!selectedDeparture) return maxTravelers;
    return Math.max(
      1,
      Math.min(maxTravelers, seatsLeft(selectedDeparture.total_seats, selectedDeparture.seats_booked))
    );
  }, [maxTravelers, selectedDeparture]);

  const indicativeTotal = (selectedDeparture?.price_override ?? pricePerPerson) * travelers;
  const whatsapp = whatsappLink(`Hi Outway, I've sent a booking request for ${tripTitle}.`);

  function setAnswer(id: string, value: string) {
    setAnswers((previous) => ({ ...previous, [id]: value }));
    clearError(id);
  }

  function clearError(key: string) {
    setFieldErrors((previous) => {
      if (!previous[key]) return previous;
      const next = { ...previous };
      delete next[key];
      return next;
    });
  }

  /** Problems on the current step, in the order they appear on screen. */
  function validateStep(id: StepId): [key: string, message: string][] {
    const problems: [string, string][] = [];

    if (id === "trip" && departures.length > 0 && !departureId) {
      problems.push(["departure", "Pick the date you want to travel on."]);
    }

    if (id === "travel") {
      if (!originCity) {
        problems.push(["origin_city", "Tell us which city you're starting from."]);
      } else if (originCity === "other" && originCityOther.trim().length < 2) {
        problems.push(["origin_city_other", "Type the city you'll be travelling from."]);
      }
      if (!travelHelp) {
        problems.push(["travel_help", "Let us know if we should book your flight or train."]);
      }
    }

    if (id === "style" || id === "you") {
      for (const question of questionsInSection(id)) {
        if (!answers[question.id]) {
          problems.push([question.id, "Pick the one that's closest. There's no wrong answer."]);
        }
      }
    }

    if (id === "details") {
      if (name.trim().length < 2) {
        problems.push(["name", "We need a name to put on the request."]);
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
        problems.push(["email", "Add an email address we can reply to."]);
      }
      if (phone.replace(/\D/g, "").length < 10) {
        problems.push(["phone", "Add a phone number we can reach you on, at least 10 digits."]);
      }
      if (!understood) {
        problems.push(["understood", "Please confirm you've read what happens next."]);
      }
    }

    return problems;
  }

  function showProblems(problems: [string, string][]): boolean {
    setFieldErrors(Object.fromEntries(problems));
    if (problems.length === 0) return false;

    const first = controls.current[problems[0][0]];
    first?.focus({ preventScroll: true });
    first?.scrollIntoView({ block: "center", behavior: "smooth" });
    return true;
  }

  function goNext() {
    if (showProblems(validateStep(step.id))) return;
    setStepIndex((index) => Math.min(index + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setSubmitError(null);
    setStepIndex((index) => Math.max(index - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit() {
    setSubmitError(null);
    if (showProblems(validateStep("details"))) return;

    // A step skipped by a back-button dance would otherwise fail server-side
    // with a message pointing at a screen the reader can't see.
    for (const earlier of STEPS.slice(0, STEPS.length - 1)) {
      const problems = validateStep(earlier.id);
      if (problems.length > 0) {
        setStepIndex(STEPS.findIndex((candidate) => candidate.id === earlier.id));
        window.scrollTo({ top: 0, behavior: "smooth" });
        setFieldErrors(Object.fromEntries(problems));
        return;
      }
    }

    setStatus("sending");

    try {
      const response = await fetch("/api/trip-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          departureId: departureId || null,
          name,
          email,
          phone,
          numTravelers: travelers,
          originCity,
          originCityOther,
          travelHelp,
          answers,
          dealBreakers,
          notes,
          formStartedAt: mountedAt.current,
          [HONEYPOT_FIELD]: trap,
        }),
      });

      if (!response.ok) {
        setSubmitError(
          await messageFromResponse(
            response,
            `We couldn't send that just now. Please try again, or email us at ${site.email}.`
          )
        );
        setStatus("idle");
        return;
      }

      setStatus("sent");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setSubmitError(networkError());
      setStatus("idle");
    }
  }

  // -------------------------------------------------------------------------
  // Sent
  // -------------------------------------------------------------------------
  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-pine-100 bg-pine-50 p-6 sm:p-8">
        <CheckCircle2 className="mb-4 text-pine" size={30} aria-hidden="true" />
        <h2 className="heading-fluid text-2xl text-pine-600">
          Request sent. Nothing is charged.
        </h2>
        <p className="mt-3 max-w-xl leading-relaxed text-pine-600/85">
          We&apos;ve got your answers for <strong>{tripTitle}</strong>
          {selectedDeparture
            ? `, ${formatDateRange(selectedDeparture.start_date, selectedDeparture.end_date)}`
            : ""}
          , for {travelers} {travelers === 1 ? "traveller" : "travellers"}. A confirmation is on its
          way to <strong>{email}</strong>.
        </p>

        <ol className="mt-6 space-y-3 text-sm leading-relaxed text-pine-600/85">
          {[
            "A person reads the request, checks the seats are actually free, and looks at who else is on that date.",
            `We write or call within ${site.responseTime} with the seat, the travel options you asked about, and anything you still want answered.`,
            "Payment happens only after that, once you're happy. Nothing is held or charged until then.",
          ].map((line, index) => (
            <li key={line} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pine text-xs font-semibold text-cream-100">
                {index + 1}
              </span>
              {line}
            </li>
          ))}
        </ol>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <a href={`mailto:${site.email}`} className="btn-primary flex-1">
            <Mail size={16} aria-hidden="true" /> Email us
          </a>
          {whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline flex-1"
            >
              <MessageCircle size={16} aria-hidden="true" /> WhatsApp
            </a>
          )}
          <Link href={`/trips/${tripSlug}`} className="btn-outline flex-1">
            Back to the trip
          </Link>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // The form
  // -------------------------------------------------------------------------
  return (
    <div>
      <ProgressRail stepIndex={stepIndex} />

      <div className="mt-6 rounded-2xl border border-border bg-white p-5 shadow-card sm:p-7">
        {/* Honeypot — hidden from people, irresistible to form bots. */}
        <div className="honeypot" aria-hidden="true">
          <label htmlFor={HONEYPOT_FIELD}>Company website</label>
          <input
            id={HONEYPOT_FIELD}
            name={HONEYPOT_FIELD}
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={trap}
            onChange={(event) => setTrap(event.target.value)}
          />
        </div>

        {step.id === "trip" && (
          <div className="space-y-6">
            <StepHeading
              title="Which weekend, and how many of you?"
              lead="Change either of these later by replying to our email — nothing here is locked in."
            />

            {departures.length > 0 ? (
              <div
                ref={(node) => {
                  controls.current["departure"] = node;
                }}
                tabIndex={-1}
              >
                <DepartureBoard
                  departures={departures}
                  selectedId={departureId}
                  onSelect={(id) => {
                    setDepartureId(id);
                    setTravelers(1);
                    clearError("departure");
                  }}
                  name="request-departure"
                  fallbackPrice={pricePerPerson}
                />
                {fieldErrors["departure"] && (
                  <p className="field-error-text">
                    <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                    {fieldErrors["departure"]}
                  </p>
                )}
              </div>
            ) : (
              <p className="rounded-xl bg-cream-300 px-4 py-3 text-sm leading-relaxed text-ink-700">
                No dates are on sale for this escape right now. Send the request anyway and
                we&apos;ll come back to you the moment new dates open.
              </p>
            )}

            <Stepper
              label="Travellers"
              value={travelers}
              max={seatCap}
              onChange={setTravelers}
              decrementLabel="One traveller fewer"
              incrementLabel="One traveller more"
              hint={
                seatCap > 1 && travelers >= seatCap
                  ? `${seatCap} is everything left on this date.`
                  : "Everyone on the same request travels as one group."
              }
            />

            <div className="rounded-xl bg-cream-300 px-4 py-3.5 text-sm text-ink-700">
              <div className="flex items-baseline justify-between gap-4">
                <span>
                  {formatINR(selectedDeparture?.price_override ?? pricePerPerson)} × {travelers}
                </span>
                <output aria-live="polite" className="heading-sm text-base text-ink">
                  {formatINR(indicativeTotal)}
                </output>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-500">
                Indicative only, and not payable now. Flights and trains are not included in this.
              </p>
              <TrustPoints align="start" className="mt-3.5 border-t border-border/70 pt-3.5" />
            </div>
          </div>
        )}

        {step.id === "travel" && (
          <div className="space-y-7">
            <StepHeading
              title={`How are you getting to ${destinationName}?`}
              lead={`The trip itself starts and ends in ${destinationName}. Tell us where you're coming from and we can book the flight or train with the group — or you arrive on your own, whichever you prefer.`}
            />

            <ChoiceGroup
              name="origin_city"
              legend="Where are you starting from?"
              options={ORIGIN_CITIES.map((city) => ({
                ...city,
                label:
                  city.value === "local" || city.value === "other"
                    ? city.label
                    : `${city.label} → ${destinationName}`,
              }))}
              value={originCity}
              onChange={(value) => {
                setOriginCity(value);
                clearError("origin_city");
              }}
              error={fieldErrors["origin_city"]}
              columns={2}
              firstInputRef={(node) => {
                controls.current["origin_city"] = node;
              }}
            />

            {originCity === "other" && (
              <div>
                <label htmlFor="origin-other" className="field-label">
                  Which city?
                </label>
                <input
                  id="origin-other"
                  ref={(node) => {
                    controls.current["origin_city_other"] = node;
                  }}
                  value={originCityOther}
                  onChange={(event) => {
                    setOriginCityOther(event.target.value);
                    clearError("origin_city_other");
                  }}
                  placeholder="e.g. Lucknow"
                  aria-invalid={fieldErrors["origin_city_other"] ? true : undefined}
                  className={clsx("field", fieldErrors["origin_city_other"] && "field-error")}
                />
                {fieldErrors["origin_city_other"] && (
                  <p className="field-error-text">
                    <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                    {fieldErrors["origin_city_other"]}
                  </p>
                )}
              </div>
            )}

            <ChoiceGroup
              name="travel_help"
              legend="Do you want us to book your travel?"
              help="Flights and trains aren't part of the trip price. We book them on your behalf and you pay the fare — no markup."
              options={TRAVEL_HELP_OPTIONS}
              value={travelHelp}
              onChange={(value) => {
                setTravelHelp(value);
                clearError("travel_help");
              }}
              error={fieldErrors["travel_help"]}
              firstInputRef={(node) => {
                controls.current["travel_help"] = node;
              }}
            />

            <p className="flex items-start gap-2 text-xs leading-relaxed text-ink-500">
              <CalendarDays size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
              {TIMINGS_NOTE_SHORT} We&apos;ll confirm the exact arrival and departure windows
              before you book anything.
            </p>
          </div>
        )}

        {(step.id === "style" || step.id === "you") && (
          <div className="space-y-8">
            <StepHeading
              title={
                step.id === "style"
                  ? "How do you like to travel?"
                  : "And who's coming?"
              }
              lead={
                step.id === "style"
                  ? "Two minutes, and it's the whole reason our groups work. We put people who want the same weekend on the same weekend."
                  : "Last few. These decide which group you'd be happiest in."
              }
            />

            {questionsInSection(step.id).map((question) => (
              <ChoiceGroup
                key={question.id}
                name={question.id}
                legend={question.label}
                help={question.help}
                options={question.options}
                value={answers[question.id] ?? ""}
                onChange={(value) => setAnswer(question.id, value)}
                error={fieldErrors[question.id]}
                firstInputRef={(node) => {
                  controls.current[question.id] = node;
                }}
              />
            ))}
          </div>
        )}

        {step.id === "details" && (
          <div className="space-y-6">
            <StepHeading
              title="Where do we reach you?"
              lead="A person replies to this, not an autoresponder."
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="request-name" className="field-label">
                  Full name
                </label>
                <input
                  id="request-name"
                  ref={(node) => {
                    controls.current["name"] = node;
                  }}
                  autoComplete="name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    clearError("name");
                  }}
                  aria-invalid={fieldErrors["name"] ? true : undefined}
                  className={clsx("field", fieldErrors["name"] && "field-error")}
                />
                <FieldError message={fieldErrors["name"]} />
              </div>

              <div>
                <label htmlFor="request-phone" className="field-label">
                  Phone
                </label>
                <input
                  id="request-phone"
                  ref={(node) => {
                    controls.current["phone"] = node;
                  }}
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value);
                    clearError("phone");
                  }}
                  placeholder="+91 98765 43210"
                  aria-invalid={fieldErrors["phone"] ? true : undefined}
                  className={clsx("field", fieldErrors["phone"] && "field-error")}
                />
                <FieldError message={fieldErrors["phone"]} />
              </div>
            </div>

            <div>
              <label htmlFor="request-email" className="field-label">
                Email
              </label>
              <input
                id="request-email"
                ref={(node) => {
                  controls.current["email"] = node;
                }}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  clearError("email");
                }}
                aria-invalid={fieldErrors["email"] ? true : undefined}
                className={clsx("field", fieldErrors["email"] && "field-error")}
              />
              <FieldError message={fieldErrors["email"]} />
            </div>

            <div>
              <label htmlFor="request-dealbreakers" className="field-label">
                Anything that would ruin the trip for you?{" "}
                <span className="font-normal text-ink-500">(optional)</span>
              </label>
              <textarea
                id="request-dealbreakers"
                rows={2}
                value={dealBreakers}
                onChange={(event) => setDealBreakers(event.target.value)}
                placeholder="Late nights, 5am starts, long drives, loud music in the car…"
                className="field"
              />
            </div>

            <div>
              <label htmlFor="request-notes" className="field-label">
                Anything else we should know?{" "}
                <span className="font-normal text-ink-500">(optional)</span>
              </label>
              <textarea
                id="request-notes"
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Dietary needs, a medical condition, who you'd like to share a room with, dates you're flexible on."
                className="field"
              />
            </div>

            <div>
              <label
                htmlFor="request-understood"
                className={clsx(
                  "flex cursor-pointer items-start gap-3 rounded-2xl p-4",
                  fieldErrors["understood"] ? "bg-clay-50 ring-1 ring-clay-600" : "bg-cream-300"
                )}
              >
                <input
                  id="request-understood"
                  ref={(node) => {
                    controls.current["understood"] = node;
                  }}
                  type="checkbox"
                  checked={understood}
                  onChange={(event) => {
                    setUnderstood(event.target.checked);
                    clearError("understood");
                  }}
                  aria-invalid={fieldErrors["understood"] ? true : undefined}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-pine"
                />
                <span className="text-sm leading-relaxed text-ink-700">
                  I understand this is a request, not a confirmed booking. Nothing is charged now —
                  Outway will contact me to confirm the seat and arrange payment. I&apos;ve read the{" "}
                  <Link
                    href="/terms"
                    target="_blank"
                    className="font-medium text-pine underline underline-offset-2"
                  >
                    terms
                  </Link>{" "}
                  and the{" "}
                  <Link
                    href="/privacy"
                    target="_blank"
                    className="font-medium text-pine underline underline-offset-2"
                  >
                    privacy policy
                  </Link>
                  .
                </span>
              </label>
              <FieldError message={fieldErrors["understood"]} />
            </div>

            {submitError && (
              <p role="alert" className="rounded-xl bg-clay-50 px-4 py-3 text-sm text-clay-600">
                {submitError}
              </p>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------
            Navigation. The primary action is on the right at every step, so
            the eye doesn't have to hunt for where "continue" moved to.
            ------------------------------------------------------------------ */}
        <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-6">
          {stepIndex > 0 ? (
            <button type="button" onClick={goBack} className="btn-ghost">
              <ArrowLeft size={16} aria-hidden="true" /> Back
            </button>
          ) : (
            <Link href={`/trips/${tripSlug}`} className="btn-ghost">
              <ArrowLeft size={16} aria-hidden="true" /> Trip
            </Link>
          )}

          {step.id === "details" ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={status === "sending"}
              className="btn-accent btn-lg"
            >
              {status === "sending" ? (
                "Sending…"
              ) : (
                <>
                  <Send size={16} aria-hidden="true" /> Send booking request
                </>
              )}
            </button>
          ) : (
            <button type="button" onClick={goNext} className="btn-primary btn-lg">
              Continue <ArrowRight size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-cream-300 p-5">
        <p className="text-sm font-semibold text-ink">Would rather just ask something first?</p>
        <p className="mt-1 text-sm leading-relaxed text-ink-500">
          You don&apos;t have to fill this in to talk to us. Write, call, or send the enquiry form
          and a person answers within {site.responseTime}.
        </p>
        <div className="mt-3.5 flex flex-wrap gap-2">
          <Link href={`/contact?trip=${tripSlug}`} className="btn-outline btn-sm">
            <Mail size={14} aria-hidden="true" /> Enquiry form
          </Link>
          {site.phoneDisplay && (
            <a
              href={`tel:${site.phoneDisplay.replace(/\s/g, "")}`}
              className="btn-outline btn-sm"
            >
              <Phone size={14} aria-hidden="true" /> {site.phoneDisplay}
            </a>
          )}
          {whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline btn-sm"
            >
              <MessageCircle size={14} aria-hidden="true" /> WhatsApp
            </a>
          )}
        </div>
      </div>

      {/* Refund ladder only: the Payment details block sits directly below
          this on the page and says the rest. */}
      <TrustBand showPayment={false} className="mt-6" />
    </div>
  );
}

// ---------------------------------------------------------------------------

function ProgressRail({ stepIndex }: { stepIndex: number }) {
  const percent = Math.round(((stepIndex + 1) / STEPS.length) * 100);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-ink-700">
          Step {stepIndex + 1} of {STEPS.length}
          <span className="font-normal text-ink-500"> · {STEPS[stepIndex].title}</span>
        </p>
        <p className="text-xs text-ink-500">About two minutes in total</p>
      </div>

      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
        aria-valuenow={stepIndex + 1}
        aria-label="Form progress"
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-cream-300"
      >
        <div
          className="h-full rounded-full bg-pine transition-[width] duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function StepHeading({ title, lead }: { title: string; lead: string }) {
  return (
    <div>
      <h2 className="heading-fluid text-xl text-ink sm:text-2xl">{title}</h2>
      <p className="mt-2 leading-relaxed text-ink-500">{lead}</p>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="field-error-text">
      <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}
