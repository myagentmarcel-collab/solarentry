"use client";

interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
  /** Tighter spacing for the window-pane hero card */
  compact?: boolean;
}

/**
 * Plain text address field. Server geocodes via /api/solar on submit.
 * Places Autocomplete disabled — it fought React controlled input and locked typing.
 */
export function AddressInput({
  value,
  onChange,
  disabled,
  id = "address",
  compact = false,
}: AddressInputProps) {
  return (
    <div className="w-full">
      <label
        htmlFor={id}
        className={`mb-1.5 block font-medium text-[var(--muted)] ${
          compact ? "text-xs" : "mb-2 text-sm"
        }`}
      >
        Home address (US)
      </label>
      <input
        id={id}
        type="text"
        autoComplete="street-address"
        placeholder="e.g. 123 Oak St, Bridgeport, CT 06606"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] text-base text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted-dim)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 disabled:opacity-50 ${
          compact ? "px-3 py-2.5" : "px-4 py-3.5"
        }`}
      />
      {!compact && (
        <p className="mt-2 text-xs text-[var(--muted-dim)]">
          Enter full street address (city, state, ZIP); we’ll look it up on
          submit.
        </p>
      )}
    </div>
  );
}
