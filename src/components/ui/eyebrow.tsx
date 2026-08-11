import { clsx } from "clsx";

/**
 * The small uppercase line that sits above a heading.
 *
 * It exists because there were six different tracking values doing this job
 * across the site — 0.14em, 0.16em, 0.18em, 0.2em, 0.22em and Tailwind's own
 * `wider` — which is six slightly different brands. One value, in `.eyebrow`.
 *
 * `tone="dark"` is the treatment on pine. Gold at 0.18em on pine reads; on
 * cream it doesn't, which is why the light tone is clay and not gold.
 */
export function Eyebrow({
  children,
  tone = "light",
  className,
}: {
  children: React.ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <p className={clsx("eyebrow", tone === "dark" ? "text-gold" : "text-clay-600", className)}>
      {children}
    </p>
  );
}
