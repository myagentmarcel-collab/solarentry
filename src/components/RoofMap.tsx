"use client";

import { useMemo } from "react";
import {
  PANEL_VISUAL_SCALE,
  boundsFromPanels,
  clusterHullSvgPoints,
  groupPanelsBySegment,
  panelRectToSvgPoints,
  panelToRect,
  regularizePanelsForDisplay,
  sortPanelsForDraw,
  type MapBounds,
} from "@/lib/panels";
import type { SolarPanel } from "@/lib/types";

interface RoofMapProps {
  panels: SolarPanel[];
  panelHeightMeters: number;
  panelWidthMeters: number;
  imageryUrl: string | null;
  /** Prefer Static Maps viewport bounds so SVG matches the photo frame. */
  imageryBounds: MapBounds | null;
  className?: string;
}

/**
 * Renders Solar API solarPanels[] as separate module rectangles on a
 * Google Maps Static satellite backdrop (or neutral grid fallback).
 *
 * Art direction: lightly regularize centers into neat rows/cols per roof
 * segment, draw each panel slightly undersized (~90%) so thin gaps show,
 * dark chic black-glass fill + silver stroke, optional thin unfilled
 * outer outline for cohesion — not a solid connected blob.
 *
 * The container is square to match Static Maps size=640x640 so object-cover
 * does not crop the image relative to the overlay projection.
 */
export function RoofMap({
  panels,
  panelHeightMeters,
  panelWidthMeters,
  imageryUrl,
  imageryBounds,
  className = "",
}: RoofMapProps) {
  // Prefer Static-Map viewport bounds over tight panel-only bounds.
  // Bounds use original API centers (true size) so the photo frame stays aligned.
  const bounds = useMemo(() => {
    if (imageryBounds) return imageryBounds;
    return boundsFromPanels(panels, panelHeightMeters, panelWidthMeters);
  }, [imageryBounds, panels, panelHeightMeters, panelWidthMeters]);

  const { polygons, clusterOutlines } = useMemo(() => {
    if (!bounds || !panels.length) {
      return {
        polygons: [] as { key: string; points: string }[],
        clusterOutlines: [] as { key: string; points: string }[],
      };
    }

    const displayPanels = regularizePanelsForDisplay(
      panels,
      panelHeightMeters,
      panelWidthMeters
    );
    const ordered = sortPanelsForDraw(displayPanels);

    const polygons = ordered.map((p, i) => {
      const rect = panelToRect(
        p,
        panelHeightMeters,
        panelWidthMeters,
        PANEL_VISUAL_SCALE
      );
      const seg =
        typeof p.segmentIndex === "number" ? `s${p.segmentIndex}` : "s";
      return {
        key: `${seg}-${i}-${p.center.latitude.toFixed(6)}-${p.center.longitude.toFixed(6)}`,
        points: panelRectToSvgPoints(rect, bounds),
      };
    });

    // Thin unfilled ring around each segment for cohesion (not a solid fill).
    const clusters = groupPanelsBySegment(ordered);
    const clusterOutlines = clusters
      .map((group, i) => {
        const points = clusterHullSvgPoints(
          group,
          panelHeightMeters,
          panelWidthMeters,
          bounds,
          1
        );
        if (!points) return null;
        const segKey =
          typeof group[0]?.segmentIndex === "number"
            ? group[0].segmentIndex
            : i;
        return { key: `hull-${segKey}`, points };
      })
      .filter((o): o is { key: string; points: string } => o != null);

    return { polygons, clusterOutlines };
  }, [panels, panelHeightMeters, panelWidthMeters, bounds]);

  if (!bounds || !panels.length) {
    return (
      <div
        className={`flex aspect-square items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--muted)] ${className}`}
      >
        No panel layout available for this building.
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] shadow-inner ${className}`}
    >
      <div className="relative aspect-square w-full">
        {imageryUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageryUrl}
            alt="Satellite view of roof"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--map-light)] via-[var(--map-mid)] to-[var(--map-dark)]">
            <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.28)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.28)_1px,transparent_1px)] [background-size:24px_24px]" />
          </div>
        )}

        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 h-full w-full"
          aria-label={`${panels.length} proposed solar panels`}
        >
          {/* Individual black-glass modules with small gaps between them */}
          {polygons.map((poly) => (
            <polygon
              key={poly.key}
              points={poly.points}
              fill="#0a0f1a"
              fillOpacity="0.82"
              stroke="rgba(226, 232, 240, 0.88)"
              strokeWidth="0.32"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {/* Very light outer outline for group cohesion — thin, not filled */}
          {clusterOutlines.map((outline) => (
            <polygon
              key={outline.key}
              points={outline.points}
              fill="none"
              stroke="rgba(241, 245, 249, 0.45)"
              strokeWidth="0.28"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      </div>
      <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1.5">
        <div className="rounded-md bg-[var(--map-chrome)]/85 px-2 py-1 text-[11px] text-white backdrop-blur-sm">
          {panels.length} panels · Approximate layout
        </div>
        {imageryUrl ? (
          <div className="rounded-md bg-[var(--map-chrome)]/85 px-2 py-1 text-[11px] text-white/90 backdrop-blur-sm">
            Overlay aligned to Static Maps viewport; approximate — not a survey
          </div>
        ) : null}
      </div>
    </div>
  );
}
