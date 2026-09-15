import { Funnel } from "@/components/Funnel";

export default function HomePage() {
  return (
    <div>
      {/* Clear hero banner — pool + solar photo above the white funnel card */}
      <div className="mx-auto mb-8 w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--border)] shadow-sm sm:mb-10">
        <img
          src="/images/solar-cinematic.jpg"
          alt="Modern home with a swimming pool and rooftop solar panels"
          className="h-[240px] w-full object-cover object-center sm:h-[300px] md:h-[340px]"
          width={1200}
          height={680}
          decoding="async"
          fetchPriority="high"
        />
      </div>

      <Funnel />
      <section className="mx-auto mt-16 max-w-2xl">
        <h2 className="text-center text-sm font-medium uppercase tracking-[0.12em] text-[var(--muted-dim)]">
          How it works
        </h2>
        <ul className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
          <li className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
            <span className="text-xs font-medium tabular-nums text-[var(--accent-strong)]">
              01
            </span>
            <p className="mt-2 font-medium text-[var(--foreground)]">Address</p>
            <p className="mt-1.5 leading-relaxed text-[var(--muted)]">
              Enter your US home address. We geocode it securely on the server.
            </p>
          </li>
          <li className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
            <span className="text-xs font-medium tabular-nums text-[var(--accent-strong)]">
              02
            </span>
            <p className="mt-2 font-medium text-[var(--foreground)]">Solar check</p>
            <p className="mt-1.5 leading-relaxed text-[var(--muted)]">
              Google Solar API estimates sun hours, roof area, and a real panel
              layout.
            </p>
          </li>
          <li className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
            <span className="text-xs font-medium tabular-nums text-[var(--accent-strong)]">
              03
            </span>
            <p className="mt-2 font-medium text-[var(--foreground)]">Consult</p>
            <p className="mt-1.5 leading-relaxed text-[var(--muted)]">
              Request a free consult — or call{" "}
              <a
                href="tel:+12038183242"
                className="font-medium text-[var(--foreground)] underline decoration-[var(--border)] underline-offset-2 transition hover:text-[var(--accent-strong)] hover:decoration-[var(--accent-strong)]"
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
