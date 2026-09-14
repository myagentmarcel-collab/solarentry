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
    <div className="mx-auto w-full max-w-2xl">
      <StepIndicator step={step} />

      {step === "address" && (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Check your roof for solar
          </h1>
          <p className="mt-2 text-slate-600">
            Free satellite screening for Connecticut &amp; US homeowners. Enter
            your address to see estimated sun hours, usable roof area, and a
            panel layout from Google Solar data.
          </p>

          <form onSubmit={runCheck} className="mt-6 space-y-5">
            <AddressInput
              value={address}
              onChange={(v) => {
                setAddress(v);
                setLat(undefined);
                setLng(undefined);
              }}
              disabled={loading}
            />

            {error && <ErrorBanner message={error} onRetry={() => runCheck()} />}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-sky-700 px-4 py-3.5 text-base font-semibold text-white shadow-md shadow-sky-200 transition hover:from-sky-700 hover:to-sky-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Spinner /> Checking solar potential…
                </>
              ) : (
                "Check my roof"
              )}
            </button>
            <p className="text-center text-xs text-slate-400">
              Demo smoke-test address only (do not auto-submit as a lead): 3100
              Main Street, Bridgeport, CT 06606
            </p>
          </form>
        </section>
      )}

      {step === "result" && result && (
        <section className="space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">Results for</p>
                <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
                  {result.address}
                </h2>
              </div>
              <SuitabilityBadge value={result.suitability} />
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {result.suitabilityReason}
            </p>

            <div className="mt-5">
              <RoofMap
                panels={result.panels}
                panelHeightMeters={result.panelHeightMeters}
                panelWidthMeters={result.panelWidthMeters}
                imageryUrl={result.imageryUrl}
                imageryBounds={result.imageryBounds}
              />
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
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

            <p className="mt-3 text-xs text-slate-500">
              Est. yearly DC energy (mid config):{" "}
              {result.yearlyEnergyDcKwh.toLocaleString()} kWh.{" "}
              {result.disclaimer}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setStep("consult")}
                className="flex-1 rounded-xl bg-amber-500 px-4 py-3.5 text-center text-base font-semibold text-slate-900 shadow-sm transition hover:bg-amber-400"
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
                className="rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-base font-medium text-slate-700 hover:bg-slate-50"
              >
                Try another address
              </button>
            </div>
          </div>
        </section>
      )}

      {step === "consult" && (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <h2 className="text-2xl font-semibold text-slate-900">
            Schedule a consult
          </h2>
          <p className="mt-1 text-slate-600">
            Share how to reach you. We’ll confirm by phone or email.
            Prefer to talk now?{" "}
            <a href={TEL} className="font-medium text-sky-700 hover:underline">
              {PHONE_DISPLAY}
            </a>
          </p>

          <form onSubmit={submitLead} className="mt-6 space-y-4">
            <Field
              label="Phone"
              error={formErrors.phone}
              htmlFor="phone"
            >
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
                className="flex-1 rounded-xl bg-sky-700 px-4 py-3.5 text-base font-semibold text-white hover:bg-sky-800 disabled:opacity-70"
              >
                {loading ? "Sending…" : "Submit request"}
              </button>
              <button
                type="button"
                onClick={() => setStep("result")}
                className="rounded-xl border border-slate-300 px-4 py-3.5 font-medium text-slate-700 hover:bg-slate-50"
              >
                Back
              </button>
            </div>
          </form>
        </section>
      )}

      {step === "thanks" && (
        <section className="rounded-3xl border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white p-5 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <svg
              viewBox="0 0 24 24"
              className="h-7 w-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-slate-900">
            Thank you — request received
          </h2>
          <p className="mx-auto mt-2 max-w-md text-slate-600">
            Someone from Solar Entry will follow up about your consult. Questions
            sooner? Call us anytime.
          </p>
          <a
            href={TEL}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-sky-700 px-5 py-3 text-base font-semibold text-white hover:bg-sky-800"
          >
            {PHONE_DISPLAY}
          </a>
          {leadNote && (
            <p className="mx-auto mt-4 max-w-md text-xs text-slate-500">
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
            className="mt-6 text-sm font-medium text-sky-700 hover:underline"
          >
            Check another address
          </button>
        </section>
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 shadow-sm outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15";

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
        className="mb-1 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900">
        {value}
      </dd>
    </div>
  );
}

function SuitabilityBadge({ value }: { value: string }) {
  const styles =
    value === "Good"
      ? "bg-emerald-100 text-emerald-800 ring-emerald-200"
      : value === "Fair"
        ? "bg-amber-100 text-amber-900 ring-amber-200"
        : "bg-slate-200 text-slate-800 ring-slate-300";
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset ${styles}`}
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
    <ol className="mb-6 flex items-center justify-center gap-1 sm:gap-2">
      {steps.map((s, i) => {
        const active = i <= current;
        return (
          <li key={s.id} className="flex items-center gap-1 sm:gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                active
                  ? "bg-sky-700 text-white"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              {i + 1}
            </span>
            <span
              className={`hidden text-xs font-medium sm:inline ${
                active ? "text-slate-800" : "text-slate-400"
              }`}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <span
                className={`mx-1 h-px w-4 sm:w-8 ${
                  i < current ? "bg-sky-600" : "bg-slate-200"
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
      className="flex flex-col gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"
    >
      <p>{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 font-semibold text-red-900 underline"
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
