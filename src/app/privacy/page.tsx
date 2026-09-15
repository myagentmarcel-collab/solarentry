import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy",
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-10">
      <h1 className="text-2xl font-medium tracking-tight text-[var(--foreground)] sm:text-3xl">
        Privacy note
      </h1>
      <p className="mt-5 text-[var(--muted)] leading-relaxed">
        Solar Entry (solarentry.com) collects the information you submit when
        you check an address or request a consult — typically your home address,
        phone number, email, and preferred contact time.
      </p>
      <p className="mt-4 text-[var(--muted)] leading-relaxed">
        We use that information to run a satellite-based solar screening (via
        Google Solar / Maps APIs when configured) and to follow up about a
        consult. Lead details may be stored on our servers, emailed to our team
        at solarx28@gmail.com, and/or appended to an internal Google Sheet.
      </p>
      <p className="mt-4 text-[var(--muted)] leading-relaxed">
        We do not sell your personal information. API keys and service
        credentials stay on the server and are never exposed in the browser for
        Solar API calls.
      </p>
      <p className="mt-4 text-[var(--muted)] leading-relaxed">
        Questions? Call{" "}
        <a
          href="tel:+12038183242"
          className="font-medium text-[var(--foreground)] underline decoration-[var(--border)] underline-offset-2 transition hover:text-[var(--accent-strong)]"
        >
          203-818-3242
        </a>{" "}
        or email solarx28@gmail.com.
      </p>
      <p className="mt-10">
        <Link
          href="/"
          className="text-sm font-medium text-[var(--muted)] transition hover:text-[var(--accent-strong)]"
        >
          ← Back to solar check
        </Link>
      </p>
    </article>
  );
}
