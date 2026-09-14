import { classifySuitability, pickMidConfig } from "./classify";
import { geocodeAddress } from "./geocode";
import { boundsFromPanels } from "./panels";
import type {
  BuildingInsightsSummary,
  LatLng,
  SolarCheckResult,
  SolarPanel,
  SolarPanelConfig,
} from "./types";

const DISCLAIMER =
  "Results are a Google Solar API satellite screening, not an on-site inspection.";

function requireApiKey(): string {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    throw new Error(
      "GOOGLE_MAPS_API_KEY is not configured. Add it to .env.local to enable solar checks."
    );
  }
  return key;
}

export async function fetchBuildingInsights(
  location: LatLng
): Promise<BuildingInsightsSummary> {
  const key = requireApiKey();
  const url = new URL(
    "https://solar.googleapis.com/v1/buildingInsights:findClosest"
  );
  url.searchParams.set("location.latitude", String(location.latitude));
  url.searchParams.set("location.longitude", String(location.longitude));
  url.searchParams.set("requiredQuality", "MEDIUM");
  url.searchParams.set("key", key);

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      (body as { error?: { message?: string } })?.error?.message ||
      `Solar API error (${res.status})`;
    throw new Error(msg);
  }

  const data = body as {
    name?: string;
    center?: LatLng;
    imageryDate?: { year: number; month: number; day: number };
    postalCode?: string;
    administrativeArea?: string;
    regionCode?: string;
    solarPotential?: {
      maxArrayPanelsCount?: number;
      maxArrayAreaMeters2?: number;
      maxSunshineHoursPerYear?: number;
      panelCapacityWatts?: number;
      panelHeightMeters?: number;
      panelWidthMeters?: number;
      panelLifetimeYears?: number;
      carbonOffsetFactorKgPerMwh?: number;
      solarPanels?: SolarPanel[];
      solarPanelConfigs?: Array<{
        panelsCount: number;
        yearlyEnergyDcKwh: number;
      }>;
    };
  };

  if (!data.solarPotential || !data.center) {
    throw new Error(
      "No solar potential data is available for this location yet."
    );
  }

  const sp = data.solarPotential;
  if (
    sp.maxArrayPanelsCount == null ||
    sp.maxSunshineHoursPerYear == null ||
    sp.maxArrayAreaMeters2 == null
  ) {
    throw new Error(
      "Incomplete solar potential data returned for this building."
    );
  }

  const configs: SolarPanelConfig[] = (sp.solarPanelConfigs || []).map((c) => ({
    panelsCount: c.panelsCount,
    yearlyEnergyDcKwh: c.yearlyEnergyDcKwh,
    systemSizeKw:
      ((sp.panelCapacityWatts || 400) * c.panelsCount) / 1000,
  }));

  return {
    name: data.name,
    center: data.center,
    imageryDate: data.imageryDate,
    postalCode: data.postalCode,
    administrativeArea: data.administrativeArea,
    regionCode: data.regionCode,
    solarPotential: {
      maxArrayPanelsCount: sp.maxArrayPanelsCount,
      maxArrayAreaMeters2: sp.maxArrayAreaMeters2,
      maxSunshineHoursPerYear: sp.maxSunshineHoursPerYear,
      panelCapacityWatts: sp.panelCapacityWatts || 400,
      panelHeightMeters: sp.panelHeightMeters || 1.65,
      panelWidthMeters: sp.panelWidthMeters || 0.99,
      panelLifetimeYears: sp.panelLifetimeYears,
      carbonOffsetFactorKgPerMwh: sp.carbonOffsetFactorKgPerMwh,
      solarPanels: sp.solarPanels || [],
      solarPanelConfigs: configs,
    },
  };
}

/**
 * Optionally fetch dataLayers for RGB aerial imagery URL.
 * Returns a proxied URL so the API key never reaches the browser.
 */
export async function fetchRgbImageryUrl(
  location: LatLng,
  radiusMeters = 50
): Promise<string | null> {
  try {
    const key = requireApiKey();
    const url = new URL("https://solar.googleapis.com/v1/dataLayers:get");
    url.searchParams.set("location.latitude", String(location.latitude));
    url.searchParams.set("location.longitude", String(location.longitude));
    url.searchParams.set("radiusMeters", String(radiusMeters));
    url.searchParams.set("view", "IMAGERY_AND_ANNUAL_FLUX_LAYERS");
    url.searchParams.set("requiredQuality", "MEDIUM");
    url.searchParams.set("pixelSizeMeters", "0.5");
    url.searchParams.set("key", key);

    const res = await fetch(url.toString(), { next: { revalidate: 0 } });
    if (!res.ok) return null;
    const data = (await res.json()) as { rgbUrl?: string };
    if (!data.rgbUrl) return null;

    // Proxy through our API so the browser never sees the key
    const proxied = `/api/imagery?src=${encodeURIComponent(data.rgbUrl)}`;
    return proxied;
  } catch {
    return null;
  }
}

export async function runSolarCheck(input: {
  address?: string;
  latitude?: number;
  longitude?: number;
}): Promise<SolarCheckResult> {
  let location: LatLng;
  let address: string;

  if (
    typeof input.latitude === "number" &&
    typeof input.longitude === "number" &&
    Number.isFinite(input.latitude) &&
    Number.isFinite(input.longitude)
  ) {
    location = { latitude: input.latitude, longitude: input.longitude };
    address = input.address?.trim() || `${input.latitude}, ${input.longitude}`;

    // If address provided without geocode, try to format via reverse if needed — keep as-is
    if (input.address?.trim()) {
      try {
        const geo = await geocodeAddress(input.address);
        location = geo.location;
        address = geo.formattedAddress;
      } catch {
        // Keep provided lat/lng + address string
      }
    }
  } else if (input.address?.trim()) {
    const geo = await geocodeAddress(input.address);
    location = geo.location;
    address = geo.formattedAddress;
  } else {
    throw new Error("Provide a US address or latitude/longitude.");
  }

  const insights = await fetchBuildingInsights(location);
  const sp = insights.solarPotential;
  const { suitability, reason } = classifySuitability({
    maxArrayPanelsCount: sp.maxArrayPanelsCount,
    maxSunshineHoursPerYear: sp.maxSunshineHoursPerYear,
    maxArrayAreaMeters2: sp.maxArrayAreaMeters2,
  });

  if (!sp.solarPanelConfigs.length) {
    throw new Error(
      "Building found, but no panel configuration data is available."
    );
  }

  const { config, index } = pickMidConfig(sp.solarPanelConfigs);
  const systemSizeKw =
    config.systemSizeKw ??
    (sp.panelCapacityWatts * config.panelsCount) / 1000;

  // Use panels for the selected config count (first N from solarPanels list)
  const panels = sp.solarPanels.slice(0, config.panelsCount);

  const imageryBounds = boundsFromPanels(
    panels.length ? panels : sp.solarPanels,
    sp.panelHeightMeters,
    sp.panelWidthMeters
  );

  const imageryUrl = await fetchRgbImageryUrl(
    insights.center,
    imageryBounds
      ? Math.max(
          40,
          Math.ceil(
            Math.max(
              Math.abs(imageryBounds.north - imageryBounds.south) * 111320,
              Math.abs(imageryBounds.east - imageryBounds.west) *
                111320 *
                Math.cos((insights.center.latitude * Math.PI) / 180)
            ) / 2
          ) + 15
        )
      : 50
  );

  return {
    address,
    location: insights.center,
    suitability,
    suitabilityReason: reason,
    sunHours: sp.maxSunshineHoursPerYear,
    availableRoofAreaM2: sp.maxArrayAreaMeters2,
    panelCount: config.panelsCount,
    systemSizeKw: Math.round(systemSizeKw * 10) / 10,
    yearlyEnergyDcKwh: Math.round(config.yearlyEnergyDcKwh),
    panelHeightMeters: sp.panelHeightMeters,
    panelWidthMeters: sp.panelWidthMeters,
    panels,
    configIndex: index,
    imageryUrl,
    imageryBounds,
    disclaimer: DISCLAIMER,
    rawName: insights.name,
  };
}
