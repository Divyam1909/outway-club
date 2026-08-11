import { Check, X, Backpack } from "lucide-react";

export function InclusionsExclusions({
  inclusions,
  exclusions,
  thingsToCarry,
}: {
  inclusions: string[];
  exclusions: string[];
  thingsToCarry: string[];
}) {
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
      <div>
        <h3 className="mb-4 heading-sm text-lg text-ink">What&apos;s included</h3>
        <ul className="space-y-3">
          {inclusions.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-ink-700">
              <Check size={16} className="mt-0.5 shrink-0 text-pine" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-4 heading-sm text-lg text-ink">What&apos;s not included</h3>
        <ul className="space-y-3">
          {exclusions.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-ink-700">
              <X size={16} className="mt-0.5 shrink-0 text-clay" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {thingsToCarry.length > 0 && (
        <div className="sm:col-span-2">
          <h3 className="mb-4 flex items-center gap-2 heading-sm text-lg text-ink">
            <Backpack size={18} className="text-pine" /> What to pack
          </h3>
          <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {thingsToCarry.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-ink-700">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
