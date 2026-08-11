import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { site } from "@/config/site";

/**
 * Shared shell for Terms / Privacy / Refund policy so the three documents
 * stay visually and structurally identical.
 */
export function LegalPage({
  eyebrow,
  title,
  intro,
  lastUpdated,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="section">
      <Container className="max-w-3xl">
        <Eyebrow className="mb-2">{eyebrow}</Eyebrow>
        <h1 className="font-display text-4xl font-semibold text-ink sm:text-5xl">{title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-500">{intro}</p>
        <p className="mt-6 inline-flex rounded-full bg-cream-300 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">
          Last updated {lastUpdated}
        </p>

        <div className="legal-prose mt-12">{children}</div>

        <div className="mt-14 rounded-2xl border border-border bg-white p-6 shadow-soft">
          <h2 className="heading-sm text-lg text-ink">Questions about this document?</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">
            Write to{" "}
            <a href={`mailto:${site.email}`} className="font-medium text-pine hover:underline">
              {site.email}
            </a>{" "}
            and a person will answer, usually within {site.responseTime}.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-sm">
            <Link href="/terms" className="btn-outline btn-sm">
              Terms of Service
            </Link>
            <Link href="/privacy" className="btn-outline btn-sm">
              Privacy Policy
            </Link>
            <Link href="/refund-policy" className="btn-outline btn-sm">
              Cancellation &amp; Refunds
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}

export function LegalSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
