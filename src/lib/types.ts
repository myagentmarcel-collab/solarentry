export type Suitability = "Good" | "Fair" | "Poor";

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface SolarPanel {
  center: LatLng;
  /**
   * Degrees clockwise from north. Google Solar API often omits this and sends
   * `orientation: "LANDSCAPE" | "PORTRAIT"` instead — we default to 0.
   */
  orientationDegrees: number;
  /** API enum when orientationDegrees is absent. */
  orientation?: "LANDSCAPE" | "PORTRAIT" | string;
  yearlyEnergyDcKwh?: number;
  segmentIndex?: number;
}

export interface SolarPanelConfig {
  panelsCount: number;
  yearlyEnergyDcKwh: number;
  /** Approximate system size in kW (panels × panel capacity). */
  systemSizeKw?: number;
}

export interface BuildingInsightsSummary {
  name?: string;
  center: LatLng;
  imageryDate?: { year: number; month: number; day: number };
  postalCode?: string;
  administrativeArea?: string;
  regionCode?: string;
  solarPotential: {
    maxArrayPanelsCount: number;
    maxArrayAreaMeters2: number;
    maxSunshineHoursPerYear: number;
    panelCapacityWatts: number;
    panelHeightMeters: number;
    panelWidthMeters: number;
    panelLifetimeYears?: number;
    carbonOffsetFactorKgPerMwh?: number;
    solarPanels: SolarPanel[];
    solarPanelConfigs: SolarPanelConfig[];
  };
}

export interface SolarCheckResult {
  address: string;
  location: LatLng;
  suitability: Suitability;
  suitabilityReason: string;
  sunHours: number;
  availableRoofAreaM2: number;
  panelCount: number;
  systemSizeKw: number;
  yearlyEnergyDcKwh: number;
  panelHeightMeters: number;
  panelWidthMeters: number;
  panels: SolarPanel[];
  /** Mid-config from solarPanelConfigs used for display. */
  configIndex: number;
  imageryUrl: string | null;
  imageryBounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  } | null;
  disclaimer: string;
  rawName?: string;
}

export interface LeadPayload {
  phone: string;
  email: string;
  address: string;
  preferredDate: string;
  preferredTime: string;
  suitability?: Suitability;
  panelCount?: number;
  systemSizeKw?: number;
  sunHours?: number;
  latitude?: number;
  longitude?: number;
}

export interface LeadRecord extends LeadPayload {
  id: string;
  createdAt: string;
}
