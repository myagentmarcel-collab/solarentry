"use client";

import { useMemo } from "react";
import {
  boundsFromPanels,
  panelRectToSvgPoints,
  panelToRect,
  type MapBounds,
} from "@/lib/panels";
import type { SolarPanel } from "@/lib/types";

interface RoofMapProps {
  panels: SolarPanel[];
  panelHeightMeters: number;
  panelWidthMeters: number;
  imageryUrl: string | null;
  imageryBounds: MapBounds | null;
  className?: string;
}

/**
 * Renders actual panel rectangles from Google Solar API solarPanels[]
 * (center, orientationDegrees, height/width meters) as an SVG overlay
 * on a Google Maps Static satellite backdrop (or neutral grid fallback).
 */
export function RoofMap({
  panels,
  panelHeightMeters,
  panelWidthMeters,
  imageryUrl,
  imageryBounds,
  className = "",
}: RoofMapProps) {
  const bounds = useMemo(() => {
    if (imageryBounds) return imageryBounds;
    return boundsFromPanels(panels, panelHeightMeters, panelWidthMeters);
  }, [imageryBounds, panels, panelHeightMeters, panelWidthMeters]);

  const polygons = useMemo(() => {
    if (!bounds || !panels.length) return [];
    return panels.map((p, i) => {
      const rect = panelToRect(p, panelHeightMeters, panelWidthMeters);
      return {
        key: i,
        points: panelRectToSvgPoints(rect, bounds),
      };
    });
  }, [panels, panelHeightMeters, panelWidthMeters, bounds]);

  if (!bounds || !panels.length) {
    return (
      <div
        className={`flex aspect-[4/3] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-100 text-sm text-slate-500 ${className}`}
      >
        No panel layout available for this building.
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-800 shadow-inner ${className}`}
    >
      <div className="relative aspect-[4/3] w-full">
        {imageryUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageryUrl}
            alt="Satellite view of roof"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800">
            <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:24px_24px]" />
          </div>
        )}

        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-label={`${panels.length} proposed solar panels`}
        >
          {polygons.map((poly) => (
            <polygon
              key={poly.key}
              points={poly.points}
              fill="rgba(14, 165, 233, 0.55)"
              stroke="rgba(255, 255, 255, 0.95)"
              strokeWidth="0.35"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      </div>
      <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1.5">
        <div className="rounded-md bg-black/55 px-2 py-1 text-[11px] text-white backdrop-blur-sm">
          {panels.length} panels · Solar API layout
        </div>
        {imageryUrl ? (
          <div className="rounded-md bg-black/55 px-2 py-1 text-[11px] text-white/90 backdrop-blur-sm">
            Satellite backdrop via Google Maps; panel layout from Solar API
          </div>
        ) : null}
      </div>
    </div>
  );
}
