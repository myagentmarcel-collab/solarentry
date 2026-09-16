import { Funnel } from "@/components/Funnel";

export default function HomePage() {
  return (
    <div>
      <Funnel />
      <section className="mx-auto mt-16 max-w-3xl sm:mt-20">
        <div className="text-center">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent-strong)]">
            How it works
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-[var(--muted)] sm:text-[17px]">
            Three quick steps from your address to a free consult — no pressure,
            no invented stats.
          </p>
        </div>
        <ol className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-3 sm:gap-5">
          <li className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5 sm:p-6">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xs font-semibold tabular-nums text-[var(--accent-strong)]">
              1
            </span>
            <p className="mt-3 text-[15px] font-semibold text-[var(--foreground)]">
              Enter your address
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">
              We geocode your US home securely on the server — nothing is stored
              until you request a consult.
            </p>
          </li>
          <li className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5 sm:p-6">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xs font-semibold tabular-nums text-[var(--accent-strong)]">
              2
            </span>
            <p className="mt-3 text-[15px] font-semibold text-[var(--foreground)]">
              See solar potential
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">
              Google Solar API estimates sun hours, usable roof area, and a real
              panel layout for your roof.
            </p>
          </li>
          <li className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5 sm:p-6">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xs font-semibold tabular-nums text-[var(--accent-strong)]">
              3
            </span>
            <p className="mt-3 text-[15px] font-semibold text-[var(--foreground)]">
              Book a free consult
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">
              Request a callback — or call{" "}
              <a
                href="tel:+12038183242"
                className="font-medium text-[var(--foreground)] underline decoration-[var(--border)] underline-offset-2 transition hover:text-[var(--accent-strong)] hover:decoration-[var(--accent-strong)]"
              >
                203-818-3242
              </a>{" "}
              anytime.
            </p>
          </li>
        </ol>
        <p className="mt-8 text-center text-xs leading-relaxed text-[var(--muted)] sm:mt-10 sm:text-sm">
          Screening is satellite-based and not a substitute for an on-site
          inspection.
        </p>
      </section>
    </div>
  );
}
