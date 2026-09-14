import type { Suitability } from "./types";

/**
 * Suitability thresholds for residential screening (Google Solar API data).
 *
 * These are heuristic screening bands for CT/US homeowners — NOT a substitute
 * for an on-site inspection. Tuned for typical residential arrays:
 *
 * Good:
 *   - maxArrayPanelsCount >= 20  (~6+ kW with 300W panels)
 *   - maxSunshineHoursPerYear >= 1400
 *   - maxArrayAreaMeters2 >= 40
 *
 * Fair:
 *   - maxArrayPanelsCount >= 10
 *   - maxSunshineHoursPerYear >= 1100
 *   - maxArrayAreaMeters2 >= 20
 *
 * Poor: anything below Fair thresholds.
 *
 * Classification uses ALL three metrics — failing any Good metric drops to Fair
 * (or Poor if Fair metrics also fail).
 */
export function classifySuitability(input: {
  maxArrayPanelsCount: number;
  maxSunshineHoursPerYear: number;
  maxArrayAreaMeters2: number;
}): { suitability: Suitability; reason: string } {
  const { maxArrayPanelsCount, maxSunshineHoursPerYear, maxArrayAreaMeters2 } =
    input;

  const isGood =
    maxArrayPanelsCount >= 20 &&
    maxSunshineHoursPerYear >= 1400 &&
    maxArrayAreaMeters2 >= 40;

  if (isGood) {
    return {
      suitability: "Good",
      reason: `Strong potential: ${maxArrayPanelsCount} panels, ${Math.round(maxSunshineHoursPerYear)} sun hours/yr, ${Math.round(maxArrayAreaMeters2)} m² usable roof.`,
    };
  }

  const isFair =
    maxArrayPanelsCount >= 10 &&
    maxSunshineHoursPerYear >= 1100 &&
    maxArrayAreaMeters2 >= 20;

  if (isFair) {
    return {
      suitability: "Fair",
      reason: `Moderate potential: ${maxArrayPanelsCount} panels, ${Math.round(maxSunshineHoursPerYear)} sun hours/yr, ${Math.round(maxArrayAreaMeters2)} m² usable roof.`,
    };
  }

  return {
    suitability: "Poor",
    reason: `Limited potential from satellite data: ${maxArrayPanelsCount} panels, ${Math.round(maxSunshineHoursPerYear)} sun hours/yr, ${Math.round(maxArrayAreaMeters2)} m² usable roof. An on-site consult can still clarify options.`,
  };
}

/** Pick a mid-range solarPanelConfigs entry for display (not max, not min). */
export function pickMidConfig<T>(configs: T[]): { config: T; index: number } {
  if (!configs.length) {
    throw new Error("No solar panel configs available for this building.");
  }
  const index = Math.floor((configs.length - 1) / 2);
  return { config: configs[index], index };
}
