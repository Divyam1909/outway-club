import type { Metadata } from "next";
import Link from "next/link";
import { ContactFootnote, MessagePage } from "@/components/ui/message-page";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Destination not found",
  robots: { index: false, follow: false },
};

/** A place we don't cover, or whose page has been renamed. */
export default function DestinationNotFound() {
  return (
    <MessagePage
      eyebrow="Place not found"
      title="We don't have a page for that destination"
      actions={
        <>
          <Link href="/destinations" className="btn-primary">
            See where we go
          </Link>
          <Link href="/trips" className="btn-outline">
            Browse the escapes
          </Link>
        </>
      }
      footnote={
        <ContactFootnote
          email={site.email}
          prefix="Want us to run something here? We take requests seriously —"
        />
      }
    >
      <p>
        Either we don&apos;t cover this place yet, or its page has moved. We add destinations as we
        actually plan trips to them, so the list stays honest.
      </p>
    </MessagePage>
  );
}
