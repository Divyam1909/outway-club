"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { friendlyError, messageFromResponse, networkError } from "@/lib/error-messages";
import { clearProfileCache } from "@/lib/use-session";

type Status = "idle" | "loading" | "done";

/**
 * Three independent forms rather than one big save button: a profile edit,
 * an email change and a password change fail, confirm and rate-limit on
 * completely different timelines (email changes wait on a confirmation
 * click days later), so bundling them would mean one spinner lying about
 * the other two.
 */
export function SettingsForm({
  fullName: initialFullName,
  phone: initialPhone,
  email,
}: {
  fullName: string;
  phone: string;
  email: string;
}) {
  return (
    <div className="space-y-8">
      <ProfileForm fullName={initialFullName} phone={initialPhone} />
      <EmailForm currentEmail={email} />
      <PasswordForm />
    </div>
  );
}

function Card({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-white p-6 shadow-soft sm:p-7">
      <h2 className="heading-sm text-lg text-ink">{title}</h2>
      <p className="mt-1 text-sm text-ink-500">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ProfileForm({ fullName, phone }: { fullName: string; phone: string }) {
  const router = useRouter();
  const [name, setName] = useState(fullName);
  const [phoneValue, setPhoneValue] = useState(phone);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setError(null);

    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: name, phone: phoneValue }),
      });

      if (!response.ok) {
        setError(await messageFromResponse(response, "We couldn't save that just now."));
        setStatus("idle");
        return;
      }

      setStatus("done");
      // The navbar greets people by the name it cached for this tab.
      clearProfileCache();
      router.refresh();
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setError(networkError());
      setStatus("idle");
    }
  }

  return (
    <Card title="Your details" description="Shown on your bookings and used if we need to reach you.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="settings-name" className="field-label">
            Full name
          </label>
          <input
            id="settings-name"
            className="field"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            minLength={2}
          />
        </div>
        <div>
          <label htmlFor="settings-phone" className="field-label">
            Phone
          </label>
          <input
            id="settings-phone"
            type="tel"
            className="field"
            value={phoneValue}
            onChange={(event) => setPhoneValue(event.target.value)}
            placeholder="+91 98765 43210"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-clay-600">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={status === "loading"} className="btn-primary">
            {status === "loading" ? "Saving…" : "Save changes"}
          </button>
          {status === "done" && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-pine">
              <Check size={15} /> Saved
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}

function EmailForm({ currentEmail }: { currentEmail: string }) {
  const [newEmail, setNewEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setError(null);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ email: newEmail.trim() });

      if (updateError) {
        setError(friendlyError(updateError, "account", "We couldn't start that email change."));
        setStatus("idle");
        return;
      }

      setStatus("done");
      setNewEmail("");
    } catch {
      setError(networkError());
      setStatus("idle");
    }
  }

  return (
    <Card title="Email address" description={`Currently ${currentEmail}. Changing it sends a confirmation link to the new address before it takes effect.`}>
      {status === "done" ? (
        <p className="flex items-center gap-2 text-sm font-medium text-pine">
          <Check size={16} /> Check your new inbox to confirm the change.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="settings-email" className="field-label">
              New email address
            </label>
            <input
              id="settings-email"
              type="email"
              required
              className="field"
              value={newEmail}
              onChange={(event) => setNewEmail(event.target.value)}
              placeholder="you@newaddress.com"
            />
          </div>
          <button type="submit" disabled={status === "loading"} className="btn-outline shrink-0">
            {status === "loading" ? "Sending…" : "Update email"}
          </button>
        </form>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-clay-600">
          {error}
        </p>
      )}
    </Card>
  );
}

function PasswordForm() {
  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setError(null);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(friendlyError(updateError, "account", "We couldn't update your password."));
        setStatus("idle");
        return;
      }

      setStatus("done");
      setPassword("");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setError(networkError());
      setStatus("idle");
    }
  }

  return (
    <Card title="Password" description="Choose a new password of at least 8 characters.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="relative flex-1">
          <label htmlFor="settings-password" className="field-label">
            New password
          </label>
          <input
            id="settings-password"
            type={reveal ? "text" : "password"}
            required
            minLength={8}
            className="field pr-11"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setReveal((value) => !value)}
            aria-label={reveal ? "Hide password" : "Show password"}
            className="absolute right-3 top-[2.4rem] text-ink-500 hover:text-ink-700"
          >
            {reveal ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
        <button type="submit" disabled={status === "loading"} className="btn-outline shrink-0">
          {status === "loading" ? "Updating…" : "Update password"}
        </button>
      </form>
      {status === "done" && (
        <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-pine">
          <Check size={15} /> Password updated.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-clay-600">
          {error}
        </p>
      )}
    </Card>
  );
}
