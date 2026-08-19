import { NextResponse } from "next/server";
import { requireUserApi } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildSubmissionPayload } from "@/lib/blog-payload";
import {
  RATE_LIMITS,
  TOO_MANY_REQUESTS,
  isBotSubmission,
  rateLimitRequest,
} from "@/lib/rate-limit";
import {
  blogSubmissionAlertEmail,
  blogSubmissionReceivedEmail,
  sendEmail,
  type BlogSubmissionEmailData,
} from "@/lib/email";
import { site } from "@/config/site";

/**
 * A reader sends in an article.
 *
 * Signed in, rate limited, sanitised, and stored as `submitted` — which is a
 * status no public query returns. Nothing about this endpoint can put anything
 * on the website; only an editor pressing publish does that.
 *
 * It writes on the service role rather than from the browser for the same
 * reason the admin editor does: `sanitizeHtml` has to run somewhere the author
 * cannot skip, and the status has to be set somewhere the author cannot choose.
 */
export async function POST(request: Request) {
  const guard = await requireUserApi();
  if ("response" in guard) return guard.response;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  if (!(await rateLimitRequest(RATE_LIMITS.blogSubmission, request))) {
    return NextResponse.json(TOO_MANY_REQUESTS, { status: 429 });
  }

  // Accepted-and-discarded, so a bot doesn't learn it was caught. A human who
  // genuinely wrote nine hundred characters in under two seconds does not exist.
  if (isBotSubmission(body)) {
    return NextResponse.json({ ok: true });
  }

  const email = guard.current.user.email ?? "";
  if (!email) {
    return NextResponse.json(
      { error: "Your account has no email address on it, so we'd have nowhere to reply." },
      { status: 400 }
    );
  }

  const result = buildSubmissionPayload(body, {
    id: guard.current.user.id,
    email,
    name: guard.current.profile?.full_name ?? "",
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const admin = createAdminClient();

  // Two writers titling a piece "Udaipur in the monsoon" is a coincidence, not
  // an error — the second one gets a suffix rather than a rejection. The slug is
  // an editor's to change before publishing anyway.
  let slug = result.payload.slug;
  let inserted: { id: string; slug: string } | null = null;

  for (let attempt = 0; attempt < 4 && !inserted; attempt += 1) {
    const { data, error } = await admin
      .from("blog_posts")
      .insert({ ...result.payload, slug, author_id: guard.current.user.id })
      .select("id, slug")
      .single();

    if (!error) {
      inserted = data;
      break;
    }

    if (error.code === "23505") {
      slug = `${result.payload.slug.slice(0, 100)}-${Math.random().toString(36).slice(2, 6)}`;
      continue;
    }

    console.error("[blog/submissions] insert failed:", error.message);
    return NextResponse.json(
      { error: "We couldn't save that just now. Your writing is still on the page — try again." },
      { status: 500 }
    );
  }

  if (!inserted) {
    return NextResponse.json(
      { error: "We couldn't find a free web address for that title. Try rewording it." },
      { status: 409 }
    );
  }

  const payload: BlogSubmissionEmailData = {
    postId: inserted.id,
    title: result.payload.title,
    authorName: result.payload.author_name,
    authorEmail: email,
    excerpt: result.payload.excerpt,
    readingMinutes: result.payload.reading_minutes,
    tags: result.payload.tags,
  };

  // Best effort, exactly like every other send in this app: the submission is
  // already stored, and an unreachable inbox must not turn into a lost article.
  const alert = blogSubmissionAlertEmail(payload);
  const ack = blogSubmissionReceivedEmail(payload);
  await Promise.allSettled([
    sendEmail({ to: site.opsEmail, subject: alert.subject, html: alert.html, replyTo: email }),
    sendEmail({ to: email, subject: ack.subject, html: ack.html, replyTo: site.email }),
  ]);

  return NextResponse.json({ ok: true, id: inserted.id });
}
