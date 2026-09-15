import type { LatLng, SolarPanel } from "./types";

/**
 * Convert meters to degrees of latitude (approx constant worldwide).
 * 1° lat ≈ 111,320 m.
 */
export function metersToLatDegrees(meters: number): number {
  return meters / 111320;
}

/**
 * Convert meters to degrees of longitude at a given latitude.
 */
export function metersToLngDegrees(meters: number, latitude: number): number {
  const metersPerDegree =
    111320 * Math.cos((latitude * Math.PI) / 180);
  return meters / Math.max(metersPerDegree, 1e-6);
}

export interface PanelRect {
  /** Four corners in lat/lng, clockwise from top-left relative to panel orientation. */
  corners: LatLng[];
  center: LatLng;
  orientationDegrees: number;
}

/**
 * Build a rectangle for one solar panel from Google Solar API fields.
 * orientationDegrees is degrees clockwise from north (Google Solar docs).
 */
export function resolveOrientationDegrees(panel: SolarPanel): number {
  if (
    typeof panel.orientationDegrees === "number" &&
    Number.isFinite(panel.orientationDegrees)
  ) {
    return panel.orientationDegrees;
  }
  // API may omit degrees; normalizeSolarPanel should have filled from segment azimuth.
  return 0;
}

export function panelToRect(
  panel: SolarPanel,
  heightMeters: number,
  widthMeters: number
): PanelRect {
  const { latitude, longitude } = panel.center;
  let h = heightMeters;
  let w = widthMeters;
  // PORTRAIT swaps long/short edges relative to the default LANDSCAPE layout.
  if (panel.orientation === "PORTRAIT") {
    h = widthMeters;
    w = heightMeters;
  }
  const halfH = h / 2;
  const halfW = w / 2;

  // Local offsets in meters relative to panel axes (before rotation):
  // height along orientation (north when orientation=0), width perpendicular.
  const localCorners: Array<[number, number]> = [
    [-halfW, halfH], // top-left
    [halfW, halfH], // top-right
    [halfW, -halfH], // bottom-right
    [-halfW, -halfH], // bottom-left
  ];

  const orientationDegrees = resolveOrientationDegrees(panel);
  const rad = (orientationDegrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const corners: LatLng[] = localCorners.map(([x, y]) => {
    // Rotate: x east, y north
    const east = x * cos + y * sin;
    const north = -x * sin + y * cos;
    return {
      latitude: latitude + metersToLatDegrees(north),
      longitude: longitude + metersToLngDegrees(east, latitude),
    };
  });

  return {
    corners,
    center: panel.center,
    orientationDegrees,
  };
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Exact geographic bounds of a Google Maps Static API image for a given
 * center, zoom, and logical size.
 *
 * Uses the standard Web Mercator meters-per-pixel formula:
 *   m/px = 156543.03392 * cos(lat) / 2^zoom
 *
 * `scale` (1 or 2) doubles output pixels but does NOT change coverage, so
 * geographic bounds use the logical `size` only (e.g. 640, not 1280).
 */
export function boundsFromStaticMap(
  center: LatLng,
  zoom: number,
  size = 640,
  scale = 2
): MapBounds {
  void scale; // retained in signature for callers; coverage ignores it
  const metersPerPixel =
    (156543.03392 * Math.cos((center.latitude * Math.PI) / 180)) /
    Math.pow(2, zoom);
  const halfSpanMeters = (size / 2) * metersPerPixel;

  const padLat = metersToLatDegrees(halfSpanMeters);
  const padLng = metersToLngDegrees(halfSpanMeters, center.latitude);

  return {
    north: center.latitude + padLat,
    south: center.latitude - padLat,
    east: center.longitude + padLng,
    west: center.longitude - padLng,
  };
}

/** Project lat/lng into 0–1 SVG viewBox space within given bounds. */
export function latLngToSvg(
  point: LatLng,
  bounds: MapBounds
): { x: number; y: number } {
  const x =
    (point.longitude - bounds.west) / (bounds.east - bounds.west || 1);
  const y =
    (bounds.north - point.latitude) / (bounds.north - bounds.south || 1);
  return { x: x * 100, y: y * 100 };
}

export function panelRectToSvgPoints(
  rect: PanelRect,
  bounds: MapBounds
): string {
  return rect.corners
    .map((c) => {
      const { x, y } = latLngToSvg(c, bounds);
      return `${x},${y}`;
    })
    .join(" ");
}

/** Expand bounds to include all panels with a small padding. */
export function boundsFromPanels(
  panels: SolarPanel[],
  heightMeters: number,
  widthMeters: number,
  paddingMeters = 8
): MapBounds | null {
  if (!panels.length) return null;

  const rects = panels.map((p) => panelToRect(p, heightMeters, widthMeters));
  let north = -Infinity;
  let south = Infinity;
  let east = -Infinity;
  let west = Infinity;

  for (const r of rects) {
    for (const c of r.corners) {
      north = Math.max(north, c.latitude);
      south = Math.min(south, c.latitude);
      east = Math.max(east, c.longitude);
      west = Math.min(west, c.longitude);
    }
  }

  if (![north, south, east, west].every(Number.isFinite)) {
    return null;
  }

  const midLat = (north + south) / 2;
  const padLat = metersToLatDegrees(paddingMeters);
  const padLng = metersToLngDegrees(paddingMeters, midLat);

  return {
    north: north + padLat,
    south: south - padLat,
    east: east + padLng,
    west: west - padLng,
  };
}
