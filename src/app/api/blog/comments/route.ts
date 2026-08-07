import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  RATE_LIMITS,
  TOO_MANY_REQUESTS,
  isBotSubmission,
  isValidEmail,
  rateLimitRequest,
  sanitizeMultiline,
  sanitizeText,
} from "@/lib/rate-limit";
import { newBlogCommentAlertEmail, sendEmail } from "@/lib/email";
import { site } from "@/config/site";

/**
 * Reader comments on a journal post.
 *
 * Open to everyone — a reader shouldn't need an account to say something about
 * a piece of writing — so this carries the full public-endpoint defence stack:
 * rate limiting, a honeypot, and moderation. Comments land unapproved and only
 * appear once an admin publishes them, the same rule trip reviews follow.
 *
 * A signed-in reader gets their comment tied to their account, which is what
 * lets the admin console tell a customer's comment from a stranger's.
 */
export async function POST(request: Request) {
  if (!(await rateLimitRequest(RATE_LIMITS.blogComment, request))) {
    return NextResponse.json(TOO_MANY_REQUESTS, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  // Caught bots get a success response so they don't learn they were filtered.
  if (isBotSubmission(body)) return NextResponse.json({ ok: true });

  const postId = sanitizeText(body.postId, 64);
  const authorName = sanitizeText(body.authorName, 80);
  const authorEmail = sanitizeText(body.authorEmail, 254);
  const commentBody = sanitizeMultiline(body.body, 3000);
  const ratingInput = body.rating;

  // Zero / null / absent all mean "no rating", which is allowed.
  const rating =
    ratingInput === null || ratingInput === undefined || ratingInput === 0
      ? null
      : Number(ratingInput);

  if (!postId) {
    return NextResponse.json({ error: "Missing post." }, { status: 400 });
  }
  if (authorName.length < 2) {
    return NextResponse.json({ error: "Please add the name to show on your comment." }, { status: 400 });
  }
  if (!isValidEmail(authorEmail)) {
    return NextResponse.json(
      { error: "Please add a valid email. It's never published — we only use it to reply." },
      { status: 400 }
    );
  }
  if (commentBody.length < 10) {
    return NextResponse.json({ error: "Please write a little more than that." }, { status: 400 });
  }
  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    return NextResponse.json({ error: "A rating has to be between 1 and 5 stars." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: post } = await admin
    .from("blog_posts")
    .select("id, title, slug, status")
    .eq("id", postId)
    .maybeSingle();

  if (!post || post.status !== "published") {
    return NextResponse.json({ error: "That post isn't available." }, { status: 404 });
  }

  // Attach the account when there is one, but never require it.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error: insertError } = await admin.from("blog_comments").insert({
    post_id: post.id,
    user_id: user?.id ?? null,
    author_name: authorName,
    author_email: authorEmail,
    rating,
    body: commentBody,
    is_approved: false,
  });

  if (insertError) {
    console.error("[blog/comments] insert failed:", insertError.message);
    return NextResponse.json({ error: "Couldn't save your comment. Please try again." }, { status: 500 });
  }

  const alert = newBlogCommentAlertEmail({
    authorName,
    postTitle: post.title,
    postSlug: post.slug,
    rating,
    body: commentBody,
  });
  await sendEmail({
    to: site.opsEmail,
    subject: alert.subject,
    html: alert.html,
    replyTo: authorEmail,
  }).catch(() => false);

  return NextResponse.json({ ok: true });
}
