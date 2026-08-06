"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");

    const supabase = createClient();
    const { error } = await supabase.from("newsletter_subscribers").insert({ email });

    if (error && error.code !== "23505") {
      setStatus("error");
      return;
    }
    setStatus("done");
    setEmail("");
  }

  if (status === "done") {
    return <p className="text-sm text-gold">You&apos;re on the list — welcome aboard.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
      <input
        type="email"
        required
        placeholder="you@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-full border border-cream-100/20 bg-cream-100/10 px-4 py-2.5 text-sm text-cream-100 placeholder:text-cream-100/40 focus:border-gold focus:outline-none"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="btn bg-gold px-5 py-2.5 text-sm text-pine-700 hover:bg-gold-400 disabled:opacity-60"
      >
        {status === "loading" ? "Joining…" : "Subscribe"}
      </button>
      {status === "error" && (
        <p className="text-xs text-clay-100">Something went wrong — try again.</p>
      )}
    </form>
  );
}
