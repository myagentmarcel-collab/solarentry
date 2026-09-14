import { Funnel } from "@/components/Funnel";

export default function HomePage() {
  return (
    <div>
      <Funnel />
      <section className="mx-auto mt-12 max-w-2xl text-center">
        <h2 className="text-lg font-semibold text-slate-900">
          How Solar Entry works
        </h2>
        <ul className="mt-4 grid gap-3 text-left text-sm text-slate-600 sm:grid-cols-3">
          <li className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="font-semibold text-sky-700">1. Address</span>
            <p className="mt-1">
              Enter your US home address. We geocode it securely on the server.
            </p>
          </li>
          <li className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="font-semibold text-sky-700">2. Solar check</span>
            <p className="mt-1">
              Google Solar API estimates sun hours, roof area, and a real panel
              layout.
            </p>
          </li>
          <li className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="font-semibold text-sky-700">3. Consult</span>
            <p className="mt-1">
              Request a free consult — or call{" "}
              <a
                href="tel:+12038183242"
                className="font-medium text-sky-700 hover:underline"
              >
                203-818-3242
              </a>
              .
            </p>
          </li>
        </ul>
        <p className="mt-6 text-xs text-slate-400">
          No fake reviews or invented stats. Screening is satellite-based and not
          a substitute for an on-site inspection.
        </p>
      </section>
    </div>
  );
}
