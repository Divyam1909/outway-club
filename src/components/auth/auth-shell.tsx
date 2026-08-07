import Image from "next/image";
import Link from "next/link";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { getCurrentEscape } from "@/lib/data";
import { editionLabel, formatDateRange } from "@/lib/utils";

/**
 * The side panel advertises whatever is currently in the spotlight rather than
 * a fixed trip, so a retired escape can't linger on the login screen. When
 * nothing is on sale the panel falls back to brand imagery and copy.
 */
export async function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const trip = await getCurrentEscape();
  const departure = trip?.departures[0] ?? null;
  const edition = trip ? editionLabel(trip) : null;

  const facts: { icon: typeof Users; label: string }[] = [];
  if (trip) {
    if (departure) {
      facts.push({
        icon: CalendarDays,
        label: formatDateRange(departure.start_date, departure.end_date),
      });
    }
    if (trip.destination) facts.push({ icon: MapPin, label: trip.destination.name });
    facts.push({ icon: Users, label: `Capped at ${trip.group_size_max} travellers` });
  }

  return (
    <div className="grid min-h-[calc(100vh-5rem)] grid-cols-1 lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-14 sm:px-12 sm:py-16">
        <div className="w-full max-w-sm animate-fade-up">
          <Link href="/" className="mb-8 inline-flex items-center gap-2">
            <Image
              src="/brand/logo.png"
              alt="Outway Club"
              width={56}
              height={56}
              className="rounded-full"
            />
          </Link>
          <h1 className="font-display text-3xl font-semibold text-ink">{title}</h1>
          <p className="mb-8 mt-2 text-sm leading-relaxed text-ink-500">{subtitle}</p>
          {children}
        </div>
      </div>

      <div className="relative hidden overflow-hidden lg:block">
        <SmartImage
          src={trip?.hero_image}
          alt=""
          fill
          sizes="50vw"
          className="object-cover"
          fallbackLabel={trip?.title ?? "Outway Club"}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-pine-700 via-pine-700/55 to-pine-700/10" />

        <div className="absolute bottom-12 left-12 right-12 text-cream-100">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
            {edition ?? "Outway Club"}
          </p>
          <p className="mt-3 font-display text-3xl font-semibold leading-tight">
            {trip?.title ?? "Journeys, not tour packages"}
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-cream-100/75">
            {trip?.short_description ??
              "Small-group escapes across India, planned end to end before they ever go on sale."}
          </p>

          {facts.length > 0 && (
            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2.5">
              {facts.map((fact) => (
                <li key={fact.label} className="flex items-center gap-2 text-sm text-cream-100/85">
                  <fact.icon size={15} className="text-gold" />
                  {fact.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
