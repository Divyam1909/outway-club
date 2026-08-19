import "server-only";

import { blogDeclinedEmail, blogPublishedEmail, sendEmail } from "@/lib/email";
import { site } from "@/config/site";
import type { PostStatus } from "@/lib/types";

/**
 * Tell a contributor what happened to their piece.
 *
 * There are two ways an editor decides: the approve/decline buttons on the
 * moderation queue, and simply opening the submission in the editor and
 * pressing Publish. Both are legitimate, and a writer who gets an email from
 * one path and silence from the other would rightly conclude the review process
 * is arbitrary. So the notification lives here and both paths call it.
 *
 * Never throws, and never blocks the decision it is reporting: the status change
 * has already been written by the time this runs, and an unreachable mail
 * provider must not roll it back.
 */
export interface ReviewNotification {
  slug: string;
  title: string;
  authorName: string;
  /** Null for anything we wrote ourselves — nobody to write to. */
  submitterEmail: string | null;
  source: string;
  previousStatus: PostStatus;
  nextStatus: PostStatus;
  note: string | null;
}

export async function notifyWriter(notification: ReviewNotification): Promise<void> {
  // Only reader submissions, and only the first time a decision is made on
  // one. Editing a piece that is already live must not re-congratulate its
  // author on every typo fix.
  if (notification.source !== "community") return;
  if (!notification.submitterEmail) return;
  if (notification.previousStatus !== "submitted") return;
  if (notification.nextStatus === notification.previousStatus) return;

  const message =
    notification.nextStatus === "published"
      ? blogPublishedEmail({
          title: notification.title,
          slug: notification.slug,
          authorName: notification.authorName,
        })
      : notification.nextStatus === "rejected"
        ? blogDeclinedEmail({
            title: notification.title,
            authorName: notification.authorName,
            note: notification.note,
          })
        : null;

  // A move back to `draft` is an editor parking it, not a decision — the
  // writer hears nothing until it's actually published or turned down.
  if (!message) return;

  try {
    await sendEmail({
      to: notification.submitterEmail,
      subject: message.subject,
      html: message.html,
      replyTo: site.email,
    });
  } catch (error) {
    console.error("[blog-review] writer notification failed:", error);
  }
}
