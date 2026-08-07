const steps = [
  {
    title: "Create a Supabase project",
    body: "Head to supabase.com, create a project, and open the SQL Editor.",
  },
  {
    title: "Run the schema, then the launch content",
    body: "Paste and run supabase/migrations/0001_init.sql, then 0002_launch.sql, then supabase/seed.sql — in that order. All three are safe to re-run.",
  },
  {
    title: "Copy your API keys",
    body: "Project Settings → API. You need the Project URL, the anon key and the service_role key.",
  },
  {
    title: "Fill in your environment",
    body: "Copy .env.example to .env.local and fill it in. Razorpay and Resend are optional locally — checkout and email degrade with a clear message rather than erroring.",
  },
];

export function SetupRequired() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-200 px-6 py-16">
      <div className="w-full max-w-2xl rounded-3xl border border-border bg-white p-8 shadow-card sm:p-12">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Outway Club" className="mb-4 h-12 w-12 rounded-full" />
        <h1 className="mb-3 font-display text-3xl font-semibold text-ink sm:text-4xl">
          Connect Supabase to continue
        </h1>
        <p className="mb-8 leading-relaxed text-ink-500">
          Every trip, booking, review and enquiry on this site comes from Supabase — there is no
          hard-coded content anywhere. Finish these steps locally, then set the same environment
          variables on your host and production works identically.
        </p>

        <ol className="space-y-5">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pine-50 font-display text-sm font-semibold text-pine">
                {index + 1}
              </span>
              <div>
                <p className="font-semibold text-ink">{step.title}</p>
                <p className="text-sm leading-relaxed text-ink-500">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8 rounded-2xl bg-cream-300 p-4 text-sm text-ink-700">
          <p className="mb-1 font-semibold">Required to boot</p>
          <code className="block whitespace-pre-wrap font-mono text-xs leading-relaxed text-ink-500">
            NEXT_PUBLIC_SUPABASE_URL{"\n"}
            NEXT_PUBLIC_SUPABASE_ANON_KEY{"\n"}
            SUPABASE_SERVICE_ROLE_KEY
          </code>
        </div>

        <p className="mt-6 text-xs text-ink-400">
          Full walkthrough — Razorpay, Resend SMTP, admin access and the go-live checklist — is in
          README.md.
        </p>
      </div>
    </div>
  );
}
