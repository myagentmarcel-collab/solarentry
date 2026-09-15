import { Funnel } from "@/components/Funnel";

export default function HomePage() {
  return (
    <div>
      <Funnel />
      <section className="mx-auto mt-16 max-w-2xl">
        <h2 className="text-center text-sm font-medium uppercase tracking-[0.12em] text-[var(--muted-dim)]">
          How it works
        </h2>
        <ul className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
          <li className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
            <span className="text-xs font-medium tabular-nums text-[var(--accent)]">
              01
            </span>
            <p className="mt-2 font-medium text-white">Address</p>
            <p className="mt-1.5 leading-relaxed text-[var(--muted)]">
              Enter your US home address. We geocode it securely on the server.
            </p>
          </li>
          <li className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
            <span className="text-xs font-medium tabular-nums text-[var(--accent)]">
              02
            </span>
            <p className="mt-2 font-medium text-white">Solar check</p>
            <p className="mt-1.5 leading-relaxed text-[var(--muted)]">
              Google Solar API estimates sun hours, roof area, and a real panel
              layout.
            </p>
          </li>
          <li className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
            <span className="text-xs font-medium tabular-nums text-[var(--accent)]">
              03
            </span>
            <p className="mt-2 font-medium text-white">Consult</p>
            <p className="mt-1.5 leading-relaxed text-[var(--muted)]">
              Request a free consult — or call{" "}
              <a
                href="tel:+12038183242"
                className="font-medium text-white underline decoration-[var(--border)] underline-offset-2 transition hover:text-[var(--accent)] hover:decoration-[var(--accent)]"
              >
                203-818-3242
              </a>
              .
            </p>
          </li>
        </ul>
        <p className="mt-8 text-center text-xs leading-relaxed text-[var(--muted-dim)]">
          No fake reviews or invented stats. Screening is satellite-based and not
          a substitute for an on-site inspection.
        </p>
      </section>
    </div>
  );
}
