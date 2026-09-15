import Link from "next/link";

const PHONE = "203-818-3242";
const TEL = "tel:+12038183242";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--background)]">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          <p className="text-sm font-medium tracking-tight text-[var(--foreground)]">
            Solar Entry
          </p>
          <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-[var(--muted)]">
            Residential solar screening for Connecticut &amp; US homeowners.
          </p>
          <p className="mt-2 text-xs tracking-wide text-[var(--muted-dim)]">
            solarentry.com
          </p>
        </div>
        <div className="flex flex-col gap-2.5 text-sm sm:items-end">
          <a
            href={TEL}
            className="font-medium tabular-nums tracking-tight text-[var(--foreground)] transition hover:text-[var(--accent-strong)]"
          >
            {PHONE}
          </a>
          <Link
            href="/privacy"
            className="text-[var(--muted)] transition hover:text-[var(--accent-strong)]"
          >
            Privacy
          </Link>
          <p className="max-w-xs text-xs leading-relaxed text-[var(--muted-dim)] sm:text-right">
            © {new Date().getFullYear()} Solar Entry. Screening only — not an
            on-site inspection.
          </p>
        </div>
      </div>
    </footer>
  );
}
