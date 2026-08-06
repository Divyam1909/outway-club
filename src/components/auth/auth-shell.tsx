import Image from "next/image";
import Link from "next/link";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-[calc(100vh-5rem)] grid-cols-1 lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-16 sm:px-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 flex items-center gap-2">
            <Image src="/logo.png" alt="Outway Club" width={56} height={56} className="rounded-full" />
          </Link>
          <h1 className="font-display text-3xl font-semibold text-ink">{title}</h1>
          <p className="mt-2 mb-8 text-sm text-ink-500">{subtitle}</p>
          {children}
        </div>
      </div>

      <div className="relative hidden lg:block">
        <Image
          src="https://picsum.photos/seed/outway-auth/1200/1600"
          alt=""
          fill
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
        <div className="absolute bottom-10 left-10 right-10 text-cream-100">
          <p className="font-display text-2xl font-semibold leading-snug">
            &ldquo;Every itinerary felt like it was actually planned by someone who&apos;d been
            there.&rdquo;
          </p>
          <p className="mt-3 text-sm text-cream-100/80">— Neha &amp; Arjun, Royal Rajasthan Heritage Trail</p>
        </div>
      </div>
    </div>
  );
}
