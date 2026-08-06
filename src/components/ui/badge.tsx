import { clsx } from "clsx";
import type { HTMLAttributes } from "react";

type Tone = "pine" | "clay" | "gold" | "ink";

const toneClasses: Record<Tone, string> = {
  pine: "bg-pine-50 text-pine-600",
  clay: "bg-clay-50 text-clay-600",
  gold: "bg-gold-100 text-gold-600",
  ink: "bg-ink/5 text-ink-700",
};

export function Badge({
  tone = "pine",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return <span className={clsx("badge", toneClasses[tone], className)} {...props} />;
}
