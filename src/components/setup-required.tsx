const steps = [
  {
    title: "Create a Supabase project",
    body: "Head to supabase.com, create a new project, and open the SQL Editor.",
  },
  {
    title: "Run the schema and seed data",
    body: "Paste and run supabase/migrations/0001_init.sql, then supabase/seed.sql, from this repo.",
  },
  {
    title: "Copy your API keys",
    body: "Project Settings → API. You'll need the Project URL, anon key, and service_role key.",
  },
  {
    title: "Set your environment variables",
    body: "Copy .env.example to .env.local and fill in the Supabase (and optionally Razorpay) values.",
  },
];

export function SetupRequired() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-200 px-6 py-16">
      <div className="w-full max-w-2xl rounded-3xl border border-border bg-white p-8 shadow-card sm:p-12">
        <img src="/logo.png" alt="Outway Club" className="mb-4 h-12 w-12 rounded-full" />
        <h1 className="mb-3 font-display text-3xl font-semibold text-ink sm:text-4xl">
          Connect Supabase to continue
        </h1>
        <p className="mb-8 text-ink-500">
          This site reads every trip, destination and booking from Supabase — there&apos;s no
          hard-coded content. Finish these steps locally, then the same environment variables
          on Vercel/Cloudflare will make production work identically.
        </p>

        <ol className="space-y-5">
          {steps.map((step, i) => (
            <li key={step.title} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pine-50 font-display text-sm font-semibold text-pine">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-ink">{step.title}</p>
                <p className="text-sm text-ink-500">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8 rounded-2xl bg-cream-300 p-4 text-sm text-ink-700">
          <p className="mb-1 font-semibold">Required env vars</p>
          <code className="block whitespace-pre-wrap font-mono text-xs leading-relaxed text-ink-500">
            NEXT_PUBLIC_SUPABASE_URL{"\n"}
            NEXT_PUBLIC_SUPABASE_ANON_KEY{"\n"}
            SUPABASE_SERVICE_ROLE_KEY
          </code>
        </div>

        <p className="mt-6 text-xs text-ink-400">
          Full walkthrough, including Razorpay setup and deployment, is in README.md.
        </p>
      </div>
    </div>
  );
}
