"use client";

import { useMemo } from "react";
import {
  PANEL_VISUAL_SCALE,
  boundsFromPanels,
  buildSegmentArrayArt,
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
 * Renders Solar API solarPanels[] as connected roof-segment arrays on a
 * Google Maps Static satellite backdrop (or neutral grid fallback).
 *
 * Art direction: one filled convex-hull polygon per segment (black-glass +
 * silver stroke) with a subtle inner module grid — not separate floating tiles.
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

  const arrays = useMemo(() => {
    if (!bounds || !panels.length) return [];
    return buildSegmentArrayArt(
      panels,
      panelHeightMeters,
      panelWidthMeters,
      bounds,
      PANEL_VISUAL_SCALE
    );
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
          <defs>
            {arrays.map((arr) => (
              <clipPath key={`clip-${arr.key}`} id={`clip-${arr.key}`}>
                <polygon points={arr.hullPoints} />
              </clipPath>
            ))}
          </defs>

          {arrays.map((arr) => (
            <g key={arr.key}>
              {/* Single connected black-glass array fill */}
              <polygon
                points={arr.hullPoints}
                fill="#0a0f1a"
                fillOpacity="0.82"
                stroke="rgba(226, 232, 240, 0.95)"
                strokeWidth="0.55"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              {/* Subtle module grid clipped to the hull */}
              <g
                clipPath={`url(#clip-${arr.key})`}
                stroke="rgba(148, 163, 184, 0.22)"
                strokeWidth="0.12"
                strokeLinecap="butt"
                vectorEffect="non-scaling-stroke"
              >
                {arr.gridLines.map((line, i) => (
                  <line
                    key={`${arr.key}-g${i}`}
                    x1={line.x1}
                    y1={line.y1}
                    x2={line.x2}
                    y2={line.y2}
                  />
                ))}
              </g>
            </g>
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
