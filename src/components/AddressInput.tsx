"use client";

interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
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
}: AddressInputProps) {
  return (
    <div className="w-full">
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-[var(--muted)]"
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
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3.5 text-base text-white outline-none transition placeholder:text-[var(--muted-dim)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 disabled:opacity-50"
      />
      <p className="mt-2 text-xs text-[var(--muted-dim)]">
        Enter full street address (city, state, ZIP); we’ll look it up on submit.
      </p>
    </div>
  );
}
