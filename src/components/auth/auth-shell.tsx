import Image from "next/image";
import Link from "next/link";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";

const ESCAPE_FACTS = [
  { icon: CalendarDays, label: "15 – 17 August" },
  { icon: MapPin, label: "Udaipur × Mount Abu" },
  { icon: Users, label: "Capped at 18 travellers" },
];

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-[calc(100vh-5rem)] grid-cols-1 lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-14 sm:px-12 sm:py-16">
        <div className="w-full max-w-sm animate-fade-up">
          <Link href="/" className="mb-8 inline-flex items-center gap-2">
            <Image
              src="/logo.png"
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
          src="/images/escape-001/hero.jpg"
          alt=""
          fill
          sizes="50vw"
          className="object-cover"
          fallbackLabel="Escape 001"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-pine-700 via-pine-700/55 to-pine-700/10" />

        <div className="absolute bottom-12 left-12 right-12 text-cream-100">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
            Escape 001
          </p>
          <p className="mt-3 font-display text-3xl font-semibold leading-tight">
            Udaipur × Mount Abu
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-cream-100/75">
            Three days across the greenest month in Rajasthan. One lake city, one hill station,
            and eighteen people who signed up for the same weekend.
          </p>

          <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2.5">
            {ESCAPE_FACTS.map((fact) => (
              <li key={fact.label} className="flex items-center gap-2 text-sm text-cream-100/85">
                <fact.icon size={15} className="text-gold" />
                {fact.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
