import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { sanitizeText } from "@/lib/rate-limit";
import { friendlyError } from "@/lib/error-messages";

/**
 * Self-service profile edits. Only full_name and phone are writable here,
 * on purpose: the profiles.role column has no column-level RLS restriction,
 * so this route (not a direct client-side table write) is what keeps a
 * customer request limited to the two fields the settings form actually
 * exposes.
 */
export async function PATCH(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Please sign in and try again." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const fullName = sanitizeText(body.fullName, 120);
  const phone = sanitizeText(body.phone, 32);

  if (fullName.length < 2) {
    return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, phone: phone || null })
    .eq("id", currentUser.user.id);

  if (error) {
    return NextResponse.json({ error: friendlyError(error, "profile") }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
