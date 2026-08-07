import Link from "next/link";
import { Container } from "@/components/ui/container";

/**
 * The shared full-page state used by every 404 and error boundary.
 *
 * Keeping one component means a customer who hits a missing trip and a
 * customer who hits a database outage get the same tone, the same escape
 * routes and the same contact details — the only thing that changes is what
 * we tell them happened.
 */
export function MessagePage({
  eyebrow,
  title,
  children,
  actions,
  footnote,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  actions: React.ReactNode;
  footnote?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[70vh] items-center py-16 sm:py-24">
      <Container>
        <div className="mx-auto max-w-xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-clay">
            {eyebrow}
          </p>
          <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">{title}</h1>
          <div className="mt-4 text-[15px] leading-relaxed text-ink-500">{children}</div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">{actions}</div>

          {footnote && <div className="mt-8 text-xs leading-relaxed text-ink-400">{footnote}</div>}
        </div>
      </Container>
    </div>
  );
}

/** The "email us" line that closes most of these pages. */
export function ContactFootnote({ email, prefix }: { email: string; prefix: string }) {
  return (
    <p>
      {prefix}{" "}
      <a
        href={`mailto:${email}`}
        className="font-medium text-pine underline underline-offset-2 hover:text-pine-600"
      >
        {email}
      </a>{" "}
      and a real person will pick it up.
    </p>
  );
}

/** Standard pair of escape routes. */
export function HomeAndTripsActions() {
  return (
    <>
      <Link href="/trips" className="btn-primary">
        Browse the escapes
      </Link>
      <Link href="/" className="btn-outline">
        Back to home
      </Link>
    </>
  );
}
