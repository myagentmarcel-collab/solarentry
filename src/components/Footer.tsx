import Link from "next/link";

const PHONE = "203-818-3242";
const TEL = "tel:+12038183242";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="font-semibold text-slate-900">Solar Entry</p>
          <p className="mt-1 text-sm text-slate-600">
            Residential solar screening for Connecticut &amp; US homeowners.
          </p>
          <p className="mt-1 text-sm text-slate-500">solarentry.com</p>
        </div>
        <div className="flex flex-col gap-2 text-sm sm:items-end">
          <a
            href={TEL}
            className="font-medium text-sky-700 hover:text-sky-900 tabular-nums"
          >
            Call {PHONE}
          </a>
          <Link href="/privacy" className="text-slate-600 hover:text-sky-700">
            Privacy
          </Link>
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} Solar Entry. Screening only — not an
            on-site inspection.
          </p>
        </div>
      </div>
    </footer>
  );
}
