"use client";

import { FormEvent, useState } from "react";
import { AddressInput } from "./AddressInput";
import { RoofMap } from "./RoofMap";
import type { SolarCheckResult } from "@/lib/types";

type Step = "address" | "result" | "consult" | "thanks";

const PHONE_DISPLAY = "203-818-3242";
const TEL = "tel:+12038183242";

const TIME_OPTIONS = [
  "Morning (9am–12pm)",
  "Afternoon (12pm–3pm)",
  "Late afternoon (3pm–6pm)",
  "Evening (6pm–8pm)",
];

export function Funnel() {
  const [step, setStep] = useState<Step>("address");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | undefined>();
  const [lng, setLng] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SolarCheckResult | null>(null);

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [consultAddress, setConsultAddress] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [leadNote, setLeadNote] = useState<string | null>(null);

  async function runCheck(e?: FormEvent) {
    e?.preventDefault();
    setError(null);
    if (!address.trim() && (lat == null || lng == null)) {
      setError("Please enter a US home address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/solar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: address.trim(),
          latitude: lat,
          longitude: lng,
        }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        result?: SolarCheckResult;
        error?: string;
      };

      if (!data.ok || !data.result) {
        setError(data.error || "Solar check failed. Please try again.");
        setResult(null);
        return;
      }

      setResult(data.result);
      setConsultAddress(data.result.address);
      setStep("result");
    } catch {
      setError(
        "We couldn’t reach the solar service. Check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function validateConsult(): boolean {
    const errs: Record<string, string> = {};
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) errs.phone = "Enter a valid phone number.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "Enter a valid email.";
    }
    if (consultAddress.trim().length < 5) {
      errs.address = "Home address is required.";
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) {
      errs.preferredDate = "Choose a consult date.";
    }
    if (!preferredTime) errs.preferredTime = "Choose a preferred time.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function submitLead(e: FormEvent) {
    e.preventDefault();
    if (!validateConsult()) return;

    setLoading(true);
    setError(null);
    setLeadNote(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          email: email.trim(),
          address: consultAddress.trim(),
          preferredDate,
          preferredTime,
          suitability: result?.suitability,
          panelCount: result?.panelCount,
          systemSizeKw: result?.systemSizeKw,
          sunHours: result?.sunHours,
          latitude: result?.location.latitude,
          longitude: result?.location.longitude,
        }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        issues?: Record<string, string[]>;
        email?: { sent: boolean; note?: string };
        sheets?: { appended: boolean; note?: string };
        message?: string;
      };

      if (!data.ok) {
        if (data.issues) {
          const mapped: Record<string, string> = {};
          for (const [k, v] of Object.entries(data.issues)) {
            if (v?.[0]) mapped[k] = v[0];
          }
          setFormErrors(mapped);
        }
        setError(data.error || "Could not submit. Please try again.");
        return;
      }

      const notes = [data.email?.note, data.sheets?.note]
        .filter(Boolean)
        .join(" ");
      setLeadNote(notes || null);
      setStep("thanks");
    } catch {
      setError("Network error submitting your request. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().slice(0, 10);

  return (
    <div className={`mx-auto w-full ${step === "address" ? "max-w-3xl" : "max-w-2xl"}`}>
      <StepIndicator step={step} />

      {step === "address" && (
        <section className="relative h-[360px] w-full overflow-hidden rounded-2xl border border-[var(--border)] shadow-md sm:h-[440px] md:h-[500px]">
          <img
            src="/images/solar-cinematic.jpg"
            alt="Modern white home with dark-framed picture windows and rooftop solar panels"
            className="absolute inset-0 h-full w-full object-cover object-[center_40%]"
            width={1280}
            height={720}
            decoding="async"
            fetchPriority="high"
          />
          {/* Soft vignette so the window card stays readable */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10"
          />

          {/* Window-pane card — right-center over picture windows on desktop; centered on mobile */}
          <div className="absolute inset-x-3 bottom-4 top-auto z-10 sm:inset-auto sm:bottom-auto sm:left-[48%] sm:right-[4%] sm:top-[18%] md:left-[50%] md:right-[5%] md:top-[16%]">
            <div className="relative overflow-hidden rounded-sm border-[5px] border-[#1a1a1a] shadow-[0_12px_40px_rgba(0,0,0,0.35)] sm:border-[6px]">
              {/* Inner glass lip — suggests window pane without crossing the form */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-[3px] z-10 rounded-[1px] border border-white/40 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.18)]"
              />
              <div className="relative z-20 bg-white/80 p-4 backdrop-blur-md sm:p-5 md:p-6">
                <h1 className="text-xl font-medium tracking-tight text-[var(--foreground)] sm:text-2xl md:text-[1.65rem] md:leading-snug">
                  Check your roof for solar
                </h1>
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)] sm:text-sm">
                  Free satellite screening for CT &amp; US homeowners.
                </p>

                <form onSubmit={runCheck} className="mt-3 space-y-3 sm:mt-4 sm:space-y-4">
                  <AddressInput
                    value={address}
                    onChange={(v) => {
                      setAddress(v);
                      setLat(undefined);
                      setLng(undefined);
                    }}
                    disabled={loading}
                    compact
                  />

                  {error && (
                    <ErrorBanner message={error} onRetry={() => runCheck()} />
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-3 text-base font-medium text-[var(--foreground)] transition hover:bg-[var(--accent-hover)] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Spinner /> Checking solar potential…
                      </>
                    ) : (
                      "Check my roof"
                    )}
                  </button>
                  <p className="text-center text-[10px] leading-snug text-[var(--muted-dim)] sm:text-xs">
                    Demo smoke-test address only (do not auto-submit as a lead):
                    3100 Main Street, Bridgeport, CT 06606
                  </p>
                </form>
              </div>
            </div>
          </div>
        </section>
      )}

      {step === "result" && result && (
        <section className="space-y-5">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-10">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.1em] text-[var(--muted-dim)]">
                  Results for
                </p>
                <h2 className="mt-1 text-lg font-medium tracking-tight text-[var(--foreground)] sm:text-xl">
                  {result.address}
                </h2>
              </div>
              <SuitabilityBadge value={result.suitability} />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              {result.suitabilityReason}
            </p>

            <div className="mt-6">
              <RoofMap
                panels={result.panels}
                panelHeightMeters={result.panelHeightMeters}
                panelWidthMeters={result.panelWidthMeters}
                imageryUrl={result.imageryUrl}
                imageryBounds={result.imageryBounds}
              />
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat
                label="Sun hours / yr"
                value={Math.round(result.sunHours).toLocaleString()}
              />
              <Stat
                label="Usable roof"
                value={`${Math.round(result.availableRoofAreaM2)} m²`}
              />
              <Stat label="Panels" value={String(result.panelCount)} />
              <Stat label="System size" value={`${result.systemSizeKw} kW`} />
            </dl>

            <p className="mt-4 text-xs leading-relaxed text-[var(--muted-dim)]">
              Est. yearly DC energy (mid config):{" "}
              {result.yearlyEnergyDcKwh.toLocaleString()} kWh.{" "}
              {result.disclaimer}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setStep("consult")}
                className="flex-1 rounded-lg bg-[var(--accent)] px-4 py-3.5 text-center text-base font-medium text-[var(--foreground)] transition hover:bg-[var(--accent-hover)] hover:text-white"
              >
                Request a free consult
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("address");
                  setResult(null);
                  setError(null);
                }}
                className="rounded-lg border border-[var(--border)] bg-transparent px-4 py-3.5 text-base font-medium text-[var(--muted)] transition hover:border-[var(--accent)]/50 hover:text-[var(--accent-strong)]"
              >
                Try another address
              </button>
            </div>
          </div>
        </section>
      )}

      {step === "consult" && (
        <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-10">
          <h2 className="text-2xl font-medium tracking-tight text-[var(--foreground)] sm:text-3xl">
            Schedule a consult
          </h2>
          <p className="mt-3 text-[var(--muted)] leading-relaxed">
            Share how to reach you. We’ll confirm by phone or email.
            Prefer to talk now?{" "}
            <a
              href={TEL}
              className="font-medium text-[var(--foreground)] underline decoration-[var(--border)] underline-offset-2 transition hover:text-[var(--accent-strong)]"
            >
              {PHONE_DISPLAY}
            </a>
          </p>

          <form onSubmit={submitLead} className="mt-8 space-y-4">
            <Field label="Phone" error={formErrors.phone} htmlFor="phone">
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
                placeholder="203-555-0100"
              />
            </Field>

            <Field label="Email" error={formErrors.email} htmlFor="email">
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@example.com"
              />
            </Field>

            <Field
              label="Home address"
              error={formErrors.address}
              htmlFor="consult-address"
            >
              <input
                id="consult-address"
                type="text"
                value={consultAddress}
                onChange={(e) => setConsultAddress(e.target.value)}
                className={inputClass}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Preferred date"
                error={formErrors.preferredDate}
                htmlFor="preferredDate"
              >
                <input
                  id="preferredDate"
                  type="date"
                  min={minDateStr}
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field
                label="Preferred time"
                error={formErrors.preferredTime}
                htmlFor="preferredTime"
              >
                <select
                  id="preferredTime"
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select…</option>
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {error && <ErrorBanner message={error} />}

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-[var(--accent)] px-4 py-3.5 text-base font-medium text-[var(--foreground)] transition hover:bg-[var(--accent-hover)] hover:text-white disabled:opacity-60"
              >
                {loading ? "Sending…" : "Submit request"}
              </button>
              <button
                type="button"
                onClick={() => setStep("result")}
                className="rounded-lg border border-[var(--border)] px-4 py-3.5 font-medium text-[var(--muted)] transition hover:border-[var(--accent)]/50 hover:text-[var(--accent-strong)]"
              >
                Back
              </button>
            </div>
          </form>
        </section>
      )}

      {step === "thanks" && (
        <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 text-center sm:p-12">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--success-bg)] text-[var(--success)]">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h2 className="mt-5 text-2xl font-medium tracking-tight text-[var(--foreground)] sm:text-3xl">
            Thank you — request received
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[var(--muted)] leading-relaxed">
            Someone from Solar Entry will follow up about your consult. Questions
            sooner? Call us anytime.
          </p>
          <a
            href={TEL}
            className="mt-6 inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-5 py-3 text-base font-medium tabular-nums tracking-tight text-[var(--foreground)] transition hover:border-[var(--accent)]/40"
          >
            {PHONE_DISPLAY}
          </a>
          {leadNote && (
            <p className="mx-auto mt-4 max-w-md text-xs text-[var(--muted-dim)]">
              {leadNote}
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              setStep("address");
              setResult(null);
              setPhone("");
              setEmail("");
              setPreferredDate("");
              setPreferredTime("");
              setLeadNote(null);
            }}
            className="mt-8 text-sm font-medium text-[var(--muted)] transition hover:text-[var(--accent-strong)]"
          >
            Check another address
          </button>
        </section>
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3.5 py-2.5 text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted-dim)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20";

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-medium text-[var(--muted)]"
      >
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 text-sm text-[var(--danger)]">{error}</p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-3.5">
      <dt className="text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--muted-dim)]">
        {label}
      </dt>
      <dd className="mt-1 text-lg font-medium tabular-nums tracking-tight text-[var(--foreground)]">
        {value}
      </dd>
    </div>
  );
}

function SuitabilityBadge({ value }: { value: string }) {
  const styles =
    value === "Good"
      ? "border-[var(--success)]/30 bg-[var(--success-bg)] text-[var(--success)]"
      : value === "Fair"
        ? "border-amber-600/30 bg-amber-50 text-amber-700"
        : "border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--muted)]";
  return (
    <span
      className={`inline-flex items-center rounded-lg border px-3 py-1 text-sm font-medium ${styles}`}
    >
      {value} fit
    </span>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const steps: Array<{ id: Step; label: string }> = [
    { id: "address", label: "Address" },
    { id: "result", label: "Results" },
    { id: "consult", label: "Consult" },
    { id: "thanks", label: "Done" },
  ];
  const order = ["address", "result", "consult", "thanks"] as Step[];
  const current = order.indexOf(step);

  return (
    <ol className="mb-8 flex items-center justify-center gap-1 sm:gap-2">
      {steps.map((s, i) => {
        const active = i <= current;
        return (
          <li key={s.id} className="flex items-center gap-1 sm:gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-medium tabular-nums ${
                active
                  ? "bg-[var(--accent)] text-[var(--foreground)]"
                  : "border border-[var(--border)] text-[var(--muted-dim)]"
              }`}
            >
              {i + 1}
            </span>
            <span
              className={`hidden text-xs font-medium sm:inline ${
                active ? "text-[var(--foreground)]" : "text-[var(--muted-dim)]"
              }`}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <span
                className={`mx-1 h-px w-4 sm:w-8 ${
                  i < current ? "bg-[var(--accent)]/45" : "bg-[var(--border)]"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-2 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger-bg)] px-4 py-3 text-sm text-[var(--danger)] sm:flex-row sm:items-center sm:justify-between"
    >
      <p>{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 font-medium text-[var(--foreground)] underline underline-offset-2"
        >
          Retry
        </button>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-5 w-5 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}
