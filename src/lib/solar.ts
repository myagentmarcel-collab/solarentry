import { classifySuitability, pickMidConfig } from "./classify";
import { geocodeAddress } from "./geocode";
import {
  boundsFromPanels,
  boundsFromStaticMap,
  type MapBounds,
} from "./panels";
import type {
  BuildingInsightsSummary,
  LatLng,
  SolarCheckResult,
  SolarPanel,
  SolarPanelConfig,
} from "./types";

const DISCLAIMER =
  "Results are a Google Solar API satellite screening, not an on-site inspection.";

/** Static Maps logical size (scale=2 doubles pixels only, not coverage). */
const STATIC_MAP_SIZE = 640;
const STATIC_MAP_SCALE = 2;

function requireApiKey(): string {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    throw new Error(
      "GOOGLE_MAPS_API_KEY is not configured. Add it to .env.local to enable solar checks."
    );
  }
  return key;
}

/**
 * Normalize a Solar API panel. Prefer API orientationDegrees; if missing,
 * fall back to roofSegmentStats[segmentIndex].azimuthDegrees so panels
 * track roof orientation instead of all sitting at 0°.
 */
export function normalizeSolarPanel(
  panel: SolarPanel & { orientation?: string },
  segmentAzimuthByIndex?: ReadonlyMap<number, number>
): SolarPanel {
  let degrees: number | undefined =
    typeof panel.orientationDegrees === "number" &&
    Number.isFinite(panel.orientationDegrees)
      ? panel.orientationDegrees
      : undefined;

  if (
    degrees === undefined &&
    segmentAzimuthByIndex &&
    typeof panel.segmentIndex === "number"
  ) {
    const az = segmentAzimuthByIndex.get(panel.segmentIndex);
    if (typeof az === "number" && Number.isFinite(az)) {
      degrees = az;
    }
  }

  return {
    center: panel.center,
    orientationDegrees: degrees ?? 0,
    orientation: panel.orientation,
    yearlyEnergyDcKwh: panel.yearlyEnergyDcKwh,
    segmentIndex: panel.segmentIndex,
  };
}

function buildSegmentAzimuthMap(
  roofSegmentStats:
    | Array<{ azimuthDegrees?: number; pitchDegrees?: number }>
    | undefined
): Map<number, number> {
  const map = new Map<number, number>();
  if (!roofSegmentStats) return map;
  roofSegmentStats.forEach((seg, index) => {
    if (
      typeof seg.azimuthDegrees === "number" &&
      Number.isFinite(seg.azimuthDegrees)
    ) {
      map.set(index, seg.azimuthDegrees);
    }
  });
  return map;
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
      roofSegmentStats?: Array<{
        pitchDegrees?: number;
        azimuthDegrees?: number;
        stats?: unknown;
        center?: LatLng;
      }>;
      solarPanels?: Array<
        SolarPanel & { orientation?: string; orientationDegrees?: number }
      >;
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

  const segmentAzimuthByIndex = buildSegmentAzimuthMap(sp.roofSegmentStats);

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
      solarPanels: (sp.solarPanels || []).map((p) =>
        normalizeSolarPanel(
          p as SolarPanel & { orientation?: string },
          segmentAzimuthByIndex
        )
      ),
      solarPanelConfigs: configs,
    },
  };
}


/**
 * Pick a Static Maps zoom so the roof (panel bounds) roughly fills the frame.
 * Zoom is clamped to ~19–21 for typical residential roofs.
 */
export function zoomForRoofBounds(
  bounds: MapBounds | null,
  center: LatLng
): number {
  if (!bounds) return 20;

  const heightM = Math.abs(bounds.north - bounds.south) * 111320;
  const widthM =
    Math.abs(bounds.east - bounds.west) *
    111320 *
    Math.cos((center.latitude * Math.PI) / 180);
  const spanM = Math.max(heightM, widthM, 20);

  // At mid-latitudes, ~640px Static Maps coverage ≈ 40m @21, 80m @20, 160m @19.
  // Aim for the roof to fill most of the frame with a little margin.
  if (spanM < 35) return 21;
  if (spanM < 75) return 20;
  if (spanM < 150) return 19;
  return 18;
}

/**
 * Build a browser-displayable satellite backdrop via Google Maps Static API.
 * Proxied through /api/imagery so the API key stays server-side.
 *
 * Note: Solar dataLayers rgbUrl is a GeoTIFF and cannot be used as <img> src
 * without conversion; we intentionally use Static Maps JPEG/PNG instead.
 */
export function buildSatelliteBackdropUrl(
  location: LatLng,
  zoom = 20
): string {
  // Build the Static Maps URL with literal commas in `center`.
  // Do NOT use URLSearchParams here: it encodes "," as %2C, and a following
  // encodeURIComponent would turn that into %252C (double encoding → 502).
  // Encode the whole URL exactly once for the /api/imagery?src= query param.
  // Note: Maps Static API must be enabled on GOOGLE_MAPS_API_KEY.
  const staticMap =
    "https://maps.googleapis.com/maps/api/staticmap" +
    `?center=${location.latitude},${location.longitude}` +
    `&zoom=${zoom}` +
    `&size=${STATIC_MAP_SIZE}x${STATIC_MAP_SIZE}` +
    `&scale=${STATIC_MAP_SCALE}` +
    "&maptype=satellite";
  // Key is attached by /api/imagery — never expose it to the browser.
  return `/api/imagery?src=${encodeURIComponent(staticMap)}`;
}

/**
 * Optionally fetch Solar dataLayers rgbUrl (GeoTIFF). Kept for future PNG
 * conversion; do not use the returned URL as an <img> src.
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

    // Proxied GeoTIFF — browsers cannot display this in <img> without conversion.
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

  // Panel bbox only drives zoom selection (roof fills the frame).
  const panelBounds = boundsFromPanels(
    panels.length ? panels : sp.solarPanels,
    sp.panelHeightMeters,
    sp.panelWidthMeters
  );

  const zoom = zoomForRoofBounds(panelBounds, insights.center);
  // Displayable JPEG/PNG satellite backdrop — not Solar GeoTIFF rgbUrl.
  const imageryUrl = buildSatelliteBackdropUrl(insights.center, zoom);

  // SVG overlay must use the Static Map's exact viewport, not the tight
  // panel-only bbox — otherwise panels float at the wrong scale/position.
  const imageryBounds = boundsFromStaticMap(
    insights.center,
    zoom,
    STATIC_MAP_SIZE,
    STATIC_MAP_SCALE
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
