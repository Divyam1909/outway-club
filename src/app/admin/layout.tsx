import Link from "next/link";
import { LayoutDashboard, MapPinned, Receipt } from "lucide-react";
import { Container } from "@/components/ui/container";
import { requireAdminPage } from "@/lib/auth";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/trips", label: "Trips", icon: MapPinned },
  { href: "/admin/bookings", label: "Bookings", icon: Receipt },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();

  return (
    <div className="bg-cream-300/40 py-10">
      <Container>
        <div className="mb-8 flex items-center gap-2">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-ink-700 hover:border-pine hover:text-pine"
            >
              <link.icon size={15} />
              {link.label}
            </Link>
          ))}
        </div>
        {children}
      </Container>
    </div>
  );
}
