import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SettingsForm } from "@/components/account/settings-form";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login?redirect=/account/settings");

  return (
    <div className="py-14 sm:py-16">
      <Container className="max-w-2xl">
        <Link href="/account" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-pine">
          <ArrowLeft size={15} /> Back to my bookings
        </Link>

        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-clay">Account</p>
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Settings</h1>
        <p className="mt-2 text-ink-500">Update your details, email or password.</p>

        <div className="mt-8">
          <SettingsForm
            fullName={currentUser.profile?.full_name ?? ""}
            phone={currentUser.profile?.phone ?? ""}
            email={currentUser.user.email ?? ""}
          />
        </div>
      </Container>
    </div>
  );
}
