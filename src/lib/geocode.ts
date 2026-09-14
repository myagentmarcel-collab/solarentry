import type { LatLng } from "./types";

export interface GeocodeResult {
  location: LatLng;
  formattedAddress: string;
  source: "google" | "nominatim" | "provided";
}

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const trimmed = address.trim();
  if (!trimmed) {
    throw new Error("Address is required.");
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (apiKey) {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", trimmed);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("components", "country:US");

    const res = await fetch(url.toString(), { next: { revalidate: 0 } });
    if (!res.ok) {
      throw new Error(`Geocoding failed (${res.status}).`);
    }
    const data = (await res.json()) as {
      status: string;
      results?: Array<{
        formatted_address: string;
        geometry: { location: { lat: number; lng: number } };
      }>;
      error_message?: string;
    };

    if (data.status === "OK" && data.results?.[0]) {
      const r = data.results[0];
      return {
        location: {
          latitude: r.geometry.location.lat,
          longitude: r.geometry.location.lng,
        },
        formattedAddress: r.formatted_address,
        source: "google",
      };
    }

    // Fall through to Nominatim if Google returns ZERO_RESULTS / REQUEST_DENIED
    if (data.status !== "ZERO_RESULTS" && data.status !== "OK") {
      console.warn("Google Geocoding status:", data.status, data.error_message);
    }
  }

  // Nominatim fallback (OpenStreetMap) — US bias
  const nomUrl = new URL("https://nominatim.openstreetmap.org/search");
  nomUrl.searchParams.set("q", trimmed);
  nomUrl.searchParams.set("format", "json");
  nomUrl.searchParams.set("limit", "1");
  nomUrl.searchParams.set("countrycodes", "us");

  const nomRes = await fetch(nomUrl.toString(), {
    headers: {
      "User-Agent": "SolarEntry/1.0 (solarentry.com; residential solar screening)",
      Accept: "application/json",
    },
    next: { revalidate: 0 },
  });

  if (!nomRes.ok) {
    throw new Error("Unable to geocode that address. Please try again.");
  }

  const nomData = (await nomRes.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
  }>;

  if (!nomData.length) {
    throw new Error(
      "We couldn't find that US address. Please check the street, city, and ZIP."
    );
  }

  return {
    location: {
      latitude: parseFloat(nomData[0].lat),
      longitude: parseFloat(nomData[0].lon),
    },
    formattedAddress: nomData[0].display_name,
    source: "nominatim",
  };
}
