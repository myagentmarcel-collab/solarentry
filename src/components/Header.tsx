import Link from "next/link";
import { BrandLockup } from "@/components/BrandMark";

const PHONE = "203-818-3242";
const TEL = "tel:+12038183242";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--background)]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="group inline-flex items-center transition-opacity hover:opacity-80"
          aria-label="Solar Entry home"
        >
          <BrandLockup />
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/privacy"
            className="hidden text-sm text-[var(--muted-dim)] transition hover:text-[var(--foreground)] sm:inline"
          >
            Privacy
          </Link>
          <a
            href={TEL}
            className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-elevated)]"
          >
            <PhoneIcon />
            <span className="tabular-nums tracking-tight">{PHONE}</span>
          </a>
        </div>
      </div>
    </header>
  );
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5 text-[var(--muted-dim)]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
