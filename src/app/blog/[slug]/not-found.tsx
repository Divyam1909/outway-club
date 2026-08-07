import type { Metadata } from "next";
import Link from "next/link";
import { ContactFootnote, MessagePage } from "@/components/ui/message-page";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Story not found",
  robots: { index: false, follow: false },
};

/**
 * A journal post that isn't there — either an unpublished draft, or a post
 * whose slug changed after someone linked to it.
 */
export default function PostNotFound() {
  return (
    <MessagePage
      eyebrow="Not in the journal"
      title="We couldn't find that story"
      actions={
        <>
          <Link href="/blog" className="btn-primary">
            Read the journal
          </Link>
          <Link href="/" className="btn-outline">
            Back to home
          </Link>
        </>
      }
      footnote={
        <ContactFootnote email={site.email} prefix="Sure this piece exists? Let us know at" />
      }
    >
      <p>
        This piece either hasn&apos;t been published yet, or its address changed after the link you
        followed was made. Everything we&apos;ve written is on the journal index.
      </p>
    </MessagePage>
  );
}
