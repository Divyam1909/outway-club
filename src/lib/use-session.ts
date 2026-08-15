"use client";

import { useSyncExternalStore } from "react";
import { createClient } from "@/lib/supabase/client";

export interface SessionState {
  /** True until the first auth check resolves. Render neutrally while it is. */
  loading: boolean;
  isSignedIn: boolean;
  fullName: string | null;
  email: string | null;
  isAdmin: boolean;
}

const SIGNED_OUT: SessionState = {
  loading: false,
  isSignedIn: false,
  fullName: null,
  email: null,
  isAdmin: false,
};

const LOADING: SessionState = { ...SIGNED_OUT, loading: true };

/**
 * Who's signed in, resolved once in the browser and shared by every consumer.
 *
 * This exists to keep pages cacheable. Reading the session on the server means
 * touching cookies, and one cookie read anywhere in a route's tree makes the
 * whole route dynamic — which is how a static "About" page ended up being
 * server-rendered per request. Auth state affects a handful of links and two
 * prefilled form fields; none of that is worth making the site uncacheable for,
 * and none of it belongs in a shared cache entry anyway.
 *
 * **The store is module-level, not per-hook, and that is the point.** Several
 * components ask this question on the same page — the navbar, the "write a
 * review" link, the comment form's prefill. An effect per component meant an
 * auth round trip *per component*, three times over on a trip page, every
 * navigation. One store, one resolution, everyone subscribes.
 *
 * Resolution is staged so the common case costs nothing:
 *
 *   1. `getSession()` reads the stored token locally, with **no network call**.
 *      No token means signed out, settled — so an anonymous visitor (which is
 *      most traffic, and every crawler) makes zero auth requests.
 *   2. Only if a token exists: paint from it immediately, so a returning user
 *      never sees a "Log in" button flash.
 *   3. Then `getUser()` revalidates against the auth server, so a revoked or
 *      expired session corrects itself to signed out.
 *
 * `isAdmin` here decides whether a link is *drawn*, never whether an action is
 * allowed. Authorisation stays on the server (`requireAdminPage`,
 * `requireAdminApi`) where it cannot be edited by the person it applies to.
 */

let state: SessionState = LOADING;
const listeners = new Set<() => void>();
let started = false;

/**
 * The profile row (name + role) cached for the tab, keyed by user id.
 *
 * A full page navigation throws away the module state above, so without this
 * every navigation re-queries `profiles` for the same answer. Name and role
 * change roughly never, and the cost of being briefly wrong is a nav link drawn
 * that the server would refuse to honour anyway — sessionStorage is the right
 * trade. Scoped to the tab and keyed by id, so signing in as someone else can
 * never inherit the previous person's role.
 */
interface CachedProfile {
  fullName: string | null;
  email: string | null;
  isAdmin: boolean;
}

function profileCacheKey(userId: string): string {
  return `outway.profile.${userId}`;
}

function readCachedProfile(userId: string): CachedProfile | null {
  try {
    const raw = sessionStorage.getItem(profileCacheKey(userId));
    return raw ? (JSON.parse(raw) as CachedProfile) : null;
  } catch {
    return null;
  }
}

function writeCachedProfile(userId: string, profile: CachedProfile): void {
  try {
    sessionStorage.setItem(profileCacheKey(userId), JSON.stringify(profile));
  } catch {
    // Private browsing, or a full quota. Not worth a broken page.
  }
}

/**
 * Drops the cached profile. Call after anything that edits a name or a role,
 * or the navbar keeps greeting someone by the name they just changed.
 */
export function clearProfileCache(): void {
  try {
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith("outway.profile.")) sessionStorage.removeItem(key);
    }
  } catch {
    // See above.
  }
}

function publish(next: SessionState): void {
  state = next;
  for (const listener of listeners) listener();
}

function start(): void {
  if (started || typeof window === "undefined") return;
  started = true;

  const supabase = createClient();
  // Once the auth server has answered, a late INITIAL_SESSION replay must not
  // overwrite it with the token we already revalidated.
  let verified = false;

  async function resolve(
    userId: string | null,
    metadataName: unknown,
    userEmail: string | null
  ): Promise<void> {
    if (!userId) {
      publish(SIGNED_OUT);
      return;
    }

    const nameFromToken = typeof metadataName === "string" ? metadataName : null;
    const cached = readCachedProfile(userId);

    publish({
      loading: false,
      isSignedIn: true,
      fullName: cached?.fullName ?? nameFromToken ?? state.fullName,
      email: cached?.email ?? userEmail ?? state.email,
      // Keep any role already established, so the Admin link doesn't disappear
      // and come back on a token refresh.
      isAdmin: cached?.isAdmin ?? state.isAdmin,
    });

    // Already answered this tab — the paint above is the final state.
    if (cached) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email, role")
      .eq("id", userId)
      .maybeSingle();

    const resolved: CachedProfile = {
      fullName: (profile?.full_name as string | null) ?? nameFromToken,
      email: (profile?.email as string | null) ?? userEmail,
      isAdmin: profile?.role === "admin",
    };

    writeCachedProfile(userId, resolved);
    publish({ loading: false, isSignedIn: true, ...resolved });
  }

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "INITIAL_SESSION" && verified) return;
    // Never let one person's cached role outlive their session on a shared
    // machine, even though the key is per-user.
    if (event === "SIGNED_OUT") clearProfileCache();
    void resolve(
      session?.user?.id ?? null,
      session?.user?.user_metadata?.full_name,
      session?.user?.email ?? null
    );
  });

  void (async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // No stored token: nobody is signed in, and there is nothing for the auth
    // server to tell us. Stop here rather than spending a request per page view
    // confirming that an anonymous visitor is anonymous.
    if (!session) {
      verified = true;
      publish(SIGNED_OUT);
      return;
    }

    const { data } = await supabase.auth.getUser();
    verified = true;
    void resolve(
      data.user?.id ?? null,
      data.user?.user_metadata?.full_name,
      data.user?.email ?? null
    );
  })();
}

function subscribe(listener: () => void): () => void {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): SessionState {
  return state;
}

/** The server has no session to read — that is the whole design. */
function getServerSnapshot(): SessionState {
  return LOADING;
}

export function useSession(): SessionState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
