import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <AuthShell title="Create your account" subtitle="Book trips, track your bookings, and save your travel details for next time.">
      {/* The form reads ?redirect= so it can hand people back to the checkout
          they were sent here from, which useSearchParams needs a boundary for. */}
      <Suspense>
        <SignupForm />
      </Suspense>
    </AuthShell>
  );
}
