// Poisons the module for client bundles: if a component with "use client" ever
// imports this — directly or through a chain of helpers — the build FAILS
// instead of quietly shipping SUPABASE_SERVICE_ROLE_KEY to the browser. The
// comment below said this already; this makes it enforced rather than trusted.
import "server-only";

import { createClient } from "@supabase/supabase-js";

// Service-role client — bypasses Row Level Security entirely.
// Server-only: import this from Route Handlers / Server Actions, never from
// client components, and never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
