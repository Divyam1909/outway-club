import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { CopyEmails } from "@/components/admin/copy-emails";
import { getSubscribersForAdmin } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Waitlist" };
export const dynamic = "force-dynamic";

const SOURCE_LABEL: Record<string, string> = {
  footer: "Footer",
  upcoming: "Upcoming escapes",
  trip: "Trip page",
  home: "Homepage",
};

export default async function AdminSubscribersPage() {
  const subscribers = await getSubscribersForAdmin();

  const bySource = subscribers.reduce<Record<string, number>>((acc, subscriber) => {
    acc[subscriber.source] = (acc[subscriber.source] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Waitlist</h1>
          <p className="mt-1 text-sm text-ink-500">
            {subscribers.length} {subscribers.length === 1 ? "person" : "people"} waiting to hear
            about the next escape
          </p>
        </div>
        {subscribers.length > 0 && (
          <CopyEmails emails={subscribers.map((subscriber) => subscriber.email)} />
        )}
      </div>

      {Object.keys(bySource).length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {Object.entries(bySource).map(([source, count]) => (
            <span
              key={source}
              className="rounded-full border border-border bg-white px-3.5 py-1.5 text-xs font-medium text-ink-600"
            >
              {SOURCE_LABEL[source] ?? source}: <strong className="text-ink">{count}</strong>
            </span>
          ))}
        </div>
      )}

      {subscribers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white/50 p-12 text-center">
          <p className="heading-sm text-lg text-ink">Nobody on the list yet</p>
          <p className="mt-1 text-sm text-ink-500">
            Signups from the footer and the upcoming-escapes page collect here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-white">
          <table className="w-full text-sm">
            <caption className="sr-only">Waitlist subscribers, newest first</caption>
            <thead className="border-b border-border bg-cream-300 text-left text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Email</th>
                <th scope="col" className="px-5 py-3 font-semibold">Signed up via</th>
                <th scope="col" className="px-5 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((subscriber) => (
                <tr key={subscriber.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3.5">
                    <a
                      href={`mailto:${subscriber.email}`}
                      className="font-medium text-ink hover:text-pine"
                    >
                      {subscriber.email}
                    </a>
                    {subscriber.name && (
                      <span className="ml-2 text-xs text-ink-500">{subscriber.name}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge tone="ink">{SOURCE_LABEL[subscriber.source] ?? subscriber.source}</Badge>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-ink-500">
                    {formatDate(subscriber.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
