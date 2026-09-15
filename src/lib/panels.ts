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
 * Visual-only shrink so adjacent Solar API panels show a thin consistent gap.
 * Does not change API layout truth or Static Maps bounds math.
 * ~90% of true size → neat symmetric modules, not a solid blob.
 */
export const PANEL_VISUAL_SCALE = 0.9;

/**
 * Build a rectangle for one solar panel from Google Solar API fields.
 * orientationDegrees is degrees clockwise from north (Google Solar docs).
 *
 * `visualScale` scales the drawn rect around the API center (art direction only).
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
  widthMeters: number,
  visualScale = 1
): PanelRect {
  const { latitude, longitude } = panel.center;
  let h = heightMeters;
  let w = widthMeters;
  // PORTRAIT swaps long/short edges relative to the default LANDSCAPE layout.
  if (panel.orientation === "PORTRAIT") {
    h = widthMeters;
    w = heightMeters;
  }
  const scale = Number.isFinite(visualScale) && visualScale > 0 ? visualScale : 1;
  const halfH = (h / 2) * scale;
  const halfW = (w / 2) * scale;

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

export interface SvgPoint {
  x: number;
  y: number;
}

/** Stable north→south, west→east draw order (avoids random-looking stacking). */
export function sortPanelsForDraw(panels: SolarPanel[]): SolarPanel[] {
  return [...panels].sort((a, b) => {
    const dLat = b.center.latitude - a.center.latitude;
    if (Math.abs(dLat) > 1e-12) return dLat;
    return a.center.longitude - b.center.longitude;
  });
}

/**
 * Group panels by roof segment when segmentIndex is present; otherwise one cluster.
 */
export function groupPanelsBySegment(panels: SolarPanel[]): SolarPanel[][] {
  const hasSegment = panels.some((p) => typeof p.segmentIndex === "number");
  if (!hasSegment) return [panels];

  const map = new Map<number, SolarPanel[]>();
  for (const p of panels) {
    const key = typeof p.segmentIndex === "number" ? p.segmentIndex : -1;
    const list = map.get(key);
    if (list) list.push(p);
    else map.set(key, [p]);
  }

  return [...map.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, group]) => group);
}

/** Cluster 1D values: merge neighbors within `tolerance`, return means. */
function clusterAxisValues(values: number[], tolerance: number): number[] {
  if (!values.length) return [];
  const sorted = [...values].sort((a, b) => a - b);
  const means: number[] = [];
  let bucket = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const v = sorted[i];
    const bucketMean = bucket.reduce((s, x) => s + x, 0) / bucket.length;
    if (Math.abs(v - bucketMean) <= tolerance) {
      bucket.push(v);
    } else {
      means.push(bucket.reduce((s, x) => s + x, 0) / bucket.length);
      bucket = [v];
    }
  }
  means.push(bucket.reduce((s, x) => s + x, 0) / bucket.length);
  return means;
}

function nearestAxis(value: number, means: number[]): number {
  let best = means[0];
  let bestDist = Math.abs(value - best);
  for (let i = 1; i < means.length; i++) {
    const d = Math.abs(value - means[i]);
    if (d < bestDist) {
      best = means[i];
      bestDist = d;
    }
  }
  return best;
}

/**
 * Lightly snap panel centers onto neat row/col lines per roof segment
 * for a pretty, symmetric overlay. Display-only — does not invent panels
 * or move them off the roof; keeps count and approximate placement.
 */
export function regularizePanelsForDisplay(
  panels: SolarPanel[],
  heightMeters: number,
  widthMeters: number
): SolarPanel[] {
  if (panels.length < 2) return panels.map((p) => ({ ...p, center: { ...p.center } }));

  const groups = groupPanelsBySegment(panels);
  const out: SolarPanel[] = [];

  for (const group of groups) {
    if (group.length < 2) {
      out.push(...group.map((p) => ({ ...p, center: { ...p.center } })));
      continue;
    }

    const refLat =
      group.reduce((s, p) => s + p.center.latitude, 0) / group.length;
    const refLng =
      group.reduce((s, p) => s + p.center.longitude, 0) / group.length;

    const avgOrientation =
      group.reduce((s, p) => s + resolveOrientationDegrees(p), 0) /
      group.length;
    const rad = (avgOrientation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // Local axes (meters): x = width, y = height — same basis as panelToRect.
    const locals = group.map((p) => {
      const north =
        (p.center.latitude - refLat) * 111320;
      const east =
        (p.center.longitude - refLng) *
        111320 *
        Math.cos((refLat * Math.PI) / 180);
      const x = east * cos - north * sin;
      const y = east * sin + north * cos;
      return { panel: p, x, y };
    });

    // Typical module pitch; tolerance ~22% so API jitter merges into rows/cols.
    const stepX = Math.max(widthMeters, 0.4);
    const stepY = Math.max(heightMeters, 0.4);
    // PORTRAIT panels swap edges — use mixed pitch if present.
    const hasPortrait = group.some((p) => p.orientation === "PORTRAIT");
    const tolX = (hasPortrait ? Math.min(stepX, stepY) : stepX) * 0.22;
    const tolY = (hasPortrait ? Math.min(stepX, stepY) : stepY) * 0.22;

    const xMeans = clusterAxisValues(
      locals.map((l) => l.x),
      tolX
    );
    const yMeans = clusterAxisValues(
      locals.map((l) => l.y),
      tolY
    );

    for (const { panel, x, y } of locals) {
      const sx = nearestAxis(x, xMeans);
      const sy = nearestAxis(y, yMeans);
      const east = sx * cos + sy * sin;
      const north = -sx * sin + sy * cos;
      out.push({
        ...panel,
        // Shared orientation keeps the array looking aligned/symmetric.
        orientationDegrees: avgOrientation,
        center: {
          latitude: refLat + metersToLatDegrees(north),
          longitude: refLng + metersToLngDegrees(east, refLat),
        },
      });
    }
  }

  return out;
}

/** Andrew's monotone chain convex hull in SVG space (counter-clockwise). */
export function convexHullSvg(points: SvgPoint[]): SvgPoint[] {
  if (points.length <= 1) return points.slice();
  const sorted = [...points].sort((a, b) =>
    a.x === b.x ? a.y - b.y : a.x - b.x
  );

  const cross = (o: SvgPoint, a: SvgPoint, b: SvgPoint) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  const lower: SvgPoint[] = [];
  for (const p of sorted) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0
    ) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: SvgPoint[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0
    ) {
      upper.pop();
    }
    upper.push(p);
  }

  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

export function svgPointsToAttr(points: SvgPoint[]): string {
  return points.map((p) => `${p.x},${p.y}`).join(" ");
}

/**
 * Convex hull of panel corners for a cluster (SVG space).
 * Used for a light unfilled outer outline only — not a solid array fill.
 */
export function clusterHullPoints(
  panels: SolarPanel[],
  heightMeters: number,
  widthMeters: number,
  bounds: MapBounds,
  visualScale = 1
): SvgPoint[] | null {
  if (!panels.length) return null;
  const pts: SvgPoint[] = [];
  for (const p of panels) {
    const rect = panelToRect(p, heightMeters, widthMeters, visualScale);
    for (const c of rect.corners) {
      pts.push(latLngToSvg(c, bounds));
    }
  }
  const hull = convexHullSvg(pts);
  if (hull.length < 3) return null;
  return hull;
}

/**
 * Thin convex-hull outline for a panel cluster (SVG viewBox space).
 * True-size corners so the ring sits just outside the gapped modules.
 */
export function clusterHullSvgPoints(
  panels: SolarPanel[],
  heightMeters: number,
  widthMeters: number,
  bounds: MapBounds,
  visualScale = 1
): string | null {
  const hull = clusterHullPoints(
    panels,
    heightMeters,
    widthMeters,
    bounds,
    visualScale
  );
  return hull ? svgPointsToAttr(hull) : null;
}

/** Expand bounds to include all panels with a small padding. */
export function boundsFromPanels(
  panels: SolarPanel[],
  heightMeters: number,
  widthMeters: number,
  paddingMeters = 8
): MapBounds | null {
  if (!panels.length) return null;

  // True API size only — never bake visualScale into Static Maps / fallback bounds.
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
