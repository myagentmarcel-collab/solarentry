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
        className="mb-1.5 block text-sm font-medium text-slate-700"
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
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none ring-sky-500/0 transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 disabled:bg-slate-50"
      />
      <p className="mt-1.5 text-xs text-slate-500">
        Enter full street address (city, state, ZIP); we’ll look it up on submit.
      </p>
    </div>
  );
}
