import type { Metadata } from "next";
import { Mail, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RoleToggle } from "@/components/admin/role-toggle";
import { getProfilesForAdmin } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { requireAdminPage } from "@/lib/auth";

export const metadata: Metadata = { title: "Users" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  // Admin only. The layout lets a `blogger` into /admin for the Journal, so
  // every commercial screen states its own guard rather than inheriting one.
  await requireAdminPage();
  const [profiles, currentUser] = await Promise.all([getProfilesForAdmin(), getCurrentUser()]);

  const admins = profiles.filter((profile) => profile.role === "admin");

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Users</h1>
      <p className="mb-6 mt-1 text-sm text-ink-500">
        {profiles.length} account{profiles.length === 1 ? "" : "s"} · {admins.length} admin
        {admins.length === 1 ? "" : "s"}
      </p>

      {profiles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white/50 p-12 text-center">
          <p className="heading-sm text-lg text-ink">No accounts yet</p>
          <p className="mt-1 text-sm text-ink-500">
            Everyone who signs up will appear here.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {profiles.map((profile) => {
            const isSelf = profile.id === currentUser?.user.id;
            const name = profile.full_name || profile.email || "Unnamed account";

            return (
              <li
                key={profile.id}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 sm:flex-row sm:items-center"
              >
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pine-50 heading-sm text-base text-pine"
                >
                  {initials(name)}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-ink">{name}</p>
                    {profile.role === "admin" && <Badge tone="pine">Admin</Badge>}
                    {isSelf && <Badge tone="gold">You</Badge>}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-500">
                    {profile.email && (
                      <a
                        href={`mailto:${profile.email}`}
                        className="flex items-center gap-1.5 hover:text-pine"
                      >
                        <Mail size={13} /> {profile.email}
                      </a>
                    )}
                    {profile.phone && (
                      <span className="flex items-center gap-1.5">
                        <Phone size={13} /> {profile.phone}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-ink-500">
                    Joined {formatDate(profile.created_at)} ·{" "}
                    {profile.booking_count} booking{profile.booking_count === 1 ? "" : "s"}
                  </p>
                </div>

                <RoleToggle
                  userId={profile.id}
                  role={profile.role}
                  name={name}
                  isSelf={isSelf}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
