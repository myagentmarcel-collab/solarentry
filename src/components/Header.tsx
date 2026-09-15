import Link from "next/link";

const PHONE = "203-818-3242";
const TEL = "tel:+12038183242";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <Link href="/" className="group flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--accent)] transition group-hover:border-[var(--accent)]/40">
            <SunIcon />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[15px] font-medium tracking-tight text-[var(--foreground)]">
              Solar Entry
            </span>
            <span className="hidden text-[11px] tracking-wide text-[var(--muted-dim)] sm:block">
              solarentry.com
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-5">
          <Link
            href="/privacy"
            className="hidden text-sm text-[var(--muted)] transition hover:text-[var(--accent-strong)] sm:inline"
          >
            Privacy
          </Link>
          <a
            href={TEL}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]/50 hover:bg-[var(--surface-elevated)]"
          >
            <PhoneIcon />
            <span className="tabular-nums tracking-tight">{PHONE}</span>
          </a>
        </div>
      </div>
    </header>
  );
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <circle cx="12" cy="12" r="3.5" />
      <path
        strokeLinecap="round"
        d="M12 2.5v2M12 19.5v2M4.93 4.93l1.4 1.4M17.67 17.67l1.4 1.4M2.5 12h2M19.5 12h2M4.93 19.07l1.4-1.4M17.67 6.33l1.4-1.4"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5 text-[var(--muted)]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
