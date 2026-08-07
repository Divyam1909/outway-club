import { clsx } from "clsx";

/**
 * `tone="dark"` is for sections sitting on pine — it recolours the heading and
 * description as a unit, rather than leaving callers to override the h2 with
 * an arbitrary variant selector (which silently failed and left an invisible
 * ink-on-pine heading).
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "light",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  tone?: "light" | "dark";
  className?: string;
}) {
  const dark = tone === "dark";

  return (
    <div className={clsx("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && (
        <p
          className={clsx(
            "mb-2 text-sm font-semibold uppercase tracking-[0.2em]",
            dark ? "text-gold" : "text-clay"
          )}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className={clsx(
          "text-3xl font-semibold leading-tight sm:text-4xl",
          dark ? "text-cream-100" : "text-ink"
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={clsx(
            "mt-4 text-base leading-relaxed",
            dark ? "text-cream-100/70" : "text-ink-500"
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
