import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ClipboardList,
  Globe2,
  LayoutDashboard,
  MapPinned,
  MessageSquare,
  Newspaper,
  Receipt,
  Star,
  Tag,
  Users,
  Mail,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { getCurrentUser, isBlogEditor } from "@/lib/auth";
import { getAdminStats, getEmptyAdminStats } from "@/lib/data";

/**
 * `journal: true` marks the sections a `blogger` can see. Everything else is
 * admin-only, and every one of those pages states that guard itself as well —
 * a nav that hides a link is a courtesy, not a permission check.
 */
const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, badge: null, journal: false },
  {
    href: "/admin/requests",
    label: "Requests",
    icon: ClipboardList,
    badge: "newRequestCount",
    journal: false,
  },
  { href: "/admin/bookings", label: "Bookings", icon: Receipt, badge: null, journal: false },
  { href: "/admin/trips", label: "Trips", icon: MapPinned, badge: null, journal: false },
  { href: "/admin/destinations", label: "Destinations", icon: Globe2, badge: null, journal: false },
  { href: "/admin/promo-codes", label: "Promo codes", icon: Tag, badge: null, journal: false },
  {
    href: "/admin/blog",
    label: "Journal",
    icon: Newspaper,
    badge: "journalQueueCount",
    journal: true,
  },
  { href: "/admin/users", label: "Users", icon: Users, badge: null, journal: false },
  { href: "/admin/reviews", label: "Reviews", icon: Star, badge: "pendingReviewCount", journal: false },
  {
    href: "/admin/enquiries",
    label: "Enquiries",
    icon: MessageSquare,
    badge: "newEnquiryCount",
    journal: false,
  },
  { href: "/admin/subscribers", label: "Waitlist", icon: Mail, badge: null, journal: false },
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const current = await getCurrentUser();
  if (!isBlogEditor(current)) redirect("/");

  const isAdmin = current?.profile?.role === "admin";
  const links = LINKS.filter((link) => isAdmin || link.journal);

  // The dashboard counts bookings, revenue and customers, all of which a
  // blogger has no business reading — so it isn't queried for them at all
  // rather than queried and then hidden.
  const stats = isAdmin ? await getAdminStats() : await getEmptyAdminStats();

  return (
    <div className="min-h-full bg-cream-300 py-8 sm:py-10">
      <Container>
        <nav aria-label="Admin sections" className="mb-8 -mx-1 overflow-x-auto pb-1 no-scrollbar">
          <ul className="flex w-max items-center gap-2 px-1">
            {links.map((link) => {
              const count = link.badge ? stats[link.badge] : 0;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-2 whitespace-nowrap rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-ink-700 transition-colors hover:border-pine hover:text-pine"
                  >
                    <link.icon size={15} />
                    {link.label}
                    {count > 0 && (
                      <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-clay px-1.5 text-[11px] font-bold text-cream-100">
                        {count}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        {children}
      </Container>
    </div>
  );
}
