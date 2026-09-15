"use client";

import { useMemo } from "react";
import {
  PANEL_VISUAL_SCALE,
  boundsFromPanels,
  clusterHullSvgPoints,
  groupPanelsBySegment,
  panelRectToSvgPoints,
  panelToRect,
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
 * Renders actual panel rectangles from Google Solar API solarPanels[]
 * (center, orientationDegrees, height/width meters) as an SVG overlay
 * on a Google Maps Static satellite backdrop (or neutral grid fallback).
 *
 * Art direction: slightly expanded black-glass tiles so edges kiss, soft
 * per-panel strokes, and a stronger silver hull around each roof-segment
 * cluster — still Solar API layout, not a fake grid.
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
  const bounds = useMemo(() => {
    if (imageryBounds) return imageryBounds;
    return boundsFromPanels(panels, panelHeightMeters, panelWidthMeters);
  }, [imageryBounds, panels, panelHeightMeters, panelWidthMeters]);

  const { polygons, clusterOutlines } = useMemo(() => {
    if (!bounds || !panels.length) {
      return { polygons: [] as { key: string; points: string }[], clusterOutlines: [] as { key: string; points: string }[] };
    }

    const ordered = sortPanelsForDraw(panels);
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

    const clusters = groupPanelsBySegment(ordered);
    const clusterOutlines = clusters
      .map((group, i) => {
        const points = clusterHullSvgPoints(
          group,
          panelHeightMeters,
          panelWidthMeters,
          bounds,
          PANEL_VISUAL_SCALE
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
          {/* Connected black-glass tiles — expanded so edges kiss */}
          {polygons.map((poly) => (
            <polygon
              key={poly.key}
              points={poly.points}
              fill="#0f172a"
              fillOpacity="0.78"
              stroke="rgba(226, 232, 240, 0.28)"
              strokeWidth="0.18"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {/* Stronger outer ring per roof-segment cluster */}
          {clusterOutlines.map((outline) => (
            <polygon
              key={outline.key}
              points={outline.points}
              fill="none"
              stroke="rgba(241, 245, 249, 0.92)"
              strokeWidth="0.55"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      </div>
      <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1.5">
        <div className="rounded-md bg-[var(--map-chrome)]/85 px-2 py-1 text-[11px] text-white backdrop-blur-sm">
          {panels.length} panels · Solar API layout
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
