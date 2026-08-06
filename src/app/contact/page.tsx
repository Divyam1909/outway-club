import type { Metadata } from "next";
import { Mail, Phone, MapPin } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ContactForm } from "@/components/contact-form";
import { getTripBySlug } from "@/lib/data";

export const metadata: Metadata = { title: "Contact us" };

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ trip?: string }>;
}) {
  const { trip: tripSlug } = await searchParams;
  const trip = tripSlug ? await getTripBySlug(tripSlug) : null;

  return (
    <div className="py-14">
      <Container>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-clay">Get in touch</p>
            <h1 className="font-display text-4xl font-semibold text-ink">
              {trip ? "Tell us more about your trip" : "Let's plan something"}
            </h1>
            <p className="mt-3 max-w-md text-ink-500">
              Whether it&apos;s a question about an existing departure or a fully custom
              itinerary, our team replies within a business day.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 text-sm text-ink-700">
                <Mail size={18} className="text-pine" /> hello@outwayclub.example
              </div>
              <div className="flex items-center gap-3 text-sm text-ink-700">
                <Phone size={18} className="text-pine" /> +91 98765 43210
              </div>
              <div className="flex items-center gap-3 text-sm text-ink-700">
                <MapPin size={18} className="text-pine" /> Bengaluru, India
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-white p-6 shadow-card sm:p-8">
            <ContactForm tripId={trip?.id} tripTitle={trip?.title} />
          </div>
        </div>
      </Container>
    </div>
  );
}
