import Link from "next/link";
import {
  Globe2,
  LayoutDashboard,
  MapPinned,
  MessageSquare,
  Newspaper,
  Receipt,
  Star,
  Users,
  Mail,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { requireAdminPage } from "@/lib/auth";
import { getAdminStats } from "@/lib/data";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, badge: null },
  { href: "/admin/bookings", label: "Bookings", icon: Receipt, badge: null },
  { href: "/admin/trips", label: "Trips", icon: MapPinned, badge: null },
  { href: "/admin/destinations", label: "Destinations", icon: Globe2, badge: null },
  { href: "/admin/blog", label: "Journal", icon: Newspaper, badge: "pendingCommentCount" },
  { href: "/admin/users", label: "Users", icon: Users, badge: null },
  { href: "/admin/reviews", label: "Reviews", icon: Star, badge: "pendingReviewCount" },
  { href: "/admin/enquiries", label: "Enquiries", icon: MessageSquare, badge: "newEnquiryCount" },
  { href: "/admin/subscribers", label: "Waitlist", icon: Mail, badge: null },
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();
  const stats = await getAdminStats();

  return (
    <div className="min-h-full bg-cream-300 py-8 sm:py-10">
      <Container>
        <nav aria-label="Admin sections" className="mb-8 -mx-1 overflow-x-auto pb-1 no-scrollbar">
          <ul className="flex w-max items-center gap-2 px-1">
            {LINKS.map((link) => {
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
