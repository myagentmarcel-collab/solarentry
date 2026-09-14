"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google?: {
      maps: {
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            opts?: {
              types?: string[];
              componentRestrictions?: { country: string | string[] };
              fields?: string[];
            }
          ) => {
            addListener: (event: string, handler: () => void) => void;
            getPlace: () => {
              formatted_address?: string;
              geometry?: {
                location?: { lat: () => number; lng: () => number };
              };
            };
          };
        };
      };
    };
  }
}

interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (place: {
    address: string;
    latitude?: number;
    longitude?: number;
  }) => void;
  disabled?: boolean;
  id?: string;
}

/**
 * Address field with optional Google Places Autocomplete when
 * NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set (Places must be enabled).
 * Otherwise falls back to a plain text field; server geocodes on submit.
 */
export function AddressInput({
  value,
  onChange,
  onPlaceSelect,
  disabled,
  id = "address",
}: AddressInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mapsReady, setMapsReady] = useState(false);
  const publicKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!publicKey || typeof window === "undefined") return;

    const init = () => {
      if (!inputRef.current || !window.google?.maps?.places) return;
      const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ["address"],
        componentRestrictions: { country: "us" },
        fields: ["formatted_address", "geometry"],
      });
      ac.addListener("place_changed", () => {
        const place = ac.getPlace();
        const address = place.formatted_address || "";
        const lat = place.geometry?.location?.lat();
        const lng = place.geometry?.location?.lng();
        onChange(address);
        onPlaceSelect?.({
          address,
          latitude: lat,
          longitude: lng,
        });
      });
      setMapsReady(true);
    };

    if (window.google?.maps?.places) {
      init();
      return;
    }

    const existing = document.getElementById("gmaps-places");
    if (existing) {
      existing.addEventListener("load", init);
      return () => existing.removeEventListener("load", init);
    }

    const script = document.createElement("script");
    script.id = "gmaps-places";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(publicKey)}&libraries=places`;
    script.async = true;
    script.onload = init;
    document.head.appendChild(script);
  }, [publicKey, onChange, onPlaceSelect]);

  return (
    <div className="w-full">
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-slate-700"
      >
        Home address (US)
      </label>
      <input
        ref={inputRef}
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
        {mapsReady
          ? "Start typing for address suggestions."
          : "Enter your full street address. We’ll look it up securely on our servers."}
      </p>
    </div>
  );
}
