import { clsx } from "clsx";
import { Eyebrow } from "@/components/ui/eyebrow";

/**
 * `tone="dark"` is for sections sitting on pine — it recolours the heading and
 * description as a unit, rather than leaving callers to override the h2 with
 * an arbitrary variant selector (which silently failed and left an invisible
 * ink-on-pine heading).
 *
 * The description is capped at 38rem rather than the heading's own width: at
 * max-w-2xl it was running 85 to 100 characters a line, which is roughly
 * double a comfortable measure.
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
  const centered = align === "center";

  return (
    <div className={clsx("max-w-2xl", centered && "mx-auto text-center", className)}>
      {eyebrow && <Eyebrow tone={tone} className="mb-2.5">{eyebrow}</Eyebrow>}
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
            "mt-4 max-w-[38rem] text-base leading-relaxed",
            centered && "mx-auto",
            dark ? "text-cream-100/75" : "text-ink-500"
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
