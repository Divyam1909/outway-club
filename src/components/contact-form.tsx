"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export function ContactForm({ tripId, tripTitle }: { tripId?: string; tripTitle?: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(tripTitle ? `Hi, I'd like to know more about "${tripTitle}".` : "");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");

    const supabase = createClient();
    const { error } = await supabase.from("enquiries").insert({
      name,
      email,
      phone: phone || null,
      trip_id: tripId ?? null,
      message,
    });

    setStatus(error ? "error" : "done");
  }

  if (status === "done") {
    return (
      <div className="rounded-2xl border border-pine-100 bg-pine-50 p-6 text-pine-600">
        <p className="font-semibold">Thanks — we&apos;ve got your message.</p>
        <p className="mt-1 text-sm">Our team usually replies within one business day.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {tripTitle && (
        <div className="rounded-xl bg-cream-300 px-4 py-3 text-sm text-ink-700">
          Asking about: <span className="font-semibold">{tripTitle}</span>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-700">Name</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-pine focus:outline-none" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-700">Phone (optional)</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-pine focus:outline-none" />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-700">Email</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-pine focus:outline-none" />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-700">Message</label>
        <textarea required rows={5} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:border-pine focus:outline-none" />
      </div>
      {status === "error" && <p className="text-sm text-clay-600">Something went wrong — please try again.</p>}
      <button type="submit" disabled={status === "loading"} className="btn-accent w-full py-3.5 text-base">
        {status === "loading" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
