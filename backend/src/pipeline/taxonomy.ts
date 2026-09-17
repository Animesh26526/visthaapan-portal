/**
 * VISTHAAPAN Disaster Hazard Taxonomy Normalization Engine.
 * Authoritative mapping from raw government disaster strings to controlled canonical categories.
 */

export interface NormalizedHazardResult {
  rawDisasterName: string;
  normalizedHazardType: string;
  confidence: number;
  rule: string;
  isSurveillanceRecord: boolean;
}

export const CANONICAL_HAZARDS = [
  'Flood',
  'Flash Flood',
  'Landslide',
  'Cloudburst',
  'Heavy Rain',
  'Cyclone / Windstorm',
  'Lightning',
  'Earthquake',
  'Fire',
  'Avalanche',
  'Drought',
  'Hydrological Accident / Drowning',
  'Transport Accident',
  'Other Localized Hazard',
  'Unspecified Hazard',
  'NO_EVENT',
] as const;

export type CanonicalHazardType = (typeof CANONICAL_HAZARDS)[number];

/**
 * Normalizes an incoming raw disaster report string into a controlled canonical hazard.
 * Preserves raw value, assigns confidence score, and records the normalization rule.
 */
export function normalizeHazardTaxonomy(rawDisaster: string | null | undefined): NormalizedHazardResult {
  const trimmed = (rawDisaster ?? '').trim();

  if (!trimmed || trimmed === '0' || trimmed.toLowerCase() === 'no event') {
    return {
      rawDisasterName: trimmed || 'No Event',
      normalizedHazardType: 'NO_EVENT',
      confidence: 1.0,
      rule: 'Quiescence surveillance filing (no active hazard detected)',
      isSurveillanceRecord: true,
    };
  }

  const lower = trimmed.toLowerCase();

  // Rule 1: Flash Flood (High specificity)
  if (lower.includes('flash flood') || lower.includes('flash-flood')) {
    return {
      rawDisasterName: trimmed,
      normalizedHazardType: 'Flash Flood',
      confidence: 0.95,
      rule: "Keyword match: 'flash flood'",
      isSurveillanceRecord: false,
    };
  }

  // Rule 2: Cloudburst (High specificity)
  if (lower.includes('cloudburst') || lower.includes('cloud burst')) {
    return {
      rawDisasterName: trimmed,
      normalizedHazardType: 'Cloudburst',
      confidence: 0.95,
      rule: "Keyword match: 'cloudburst'",
      isSurveillanceRecord: false,
    };
  }

  // Rule 3: Landslide and Mudflow
  if (lower.includes('landslide') || lower.includes('mudflow') || lower.includes('mud flow') || lower.includes('slope failure') || lower.includes('falling rock')) {
    return {
      rawDisasterName: trimmed,
      normalizedHazardType: 'Landslide',
      confidence: 0.95,
      rule: "Keyword match: 'landslide/mudflow/rockfall'",
      isSurveillanceRecord: false,
    };
  }

  // Rule 4: Avalanche
  if (lower.includes('avalanche') || lower.includes('snow slide')) {
    return {
      rawDisasterName: trimmed,
      normalizedHazardType: 'Avalanche',
      confidence: 0.95,
      rule: "Keyword match: 'avalanche'",
      isSurveillanceRecord: false,
    };
  }

  // Rule 5: Flood & Inundation
  if (lower.includes('flood') || lower.includes('inundation') || lower.includes('waterlogging') || lower.includes('water logging')) {
    return {
      rawDisasterName: trimmed,
      normalizedHazardType: 'Flood',
      confidence: 0.95,
      rule: "Keyword match: 'flood/inundation'",
      isSurveillanceRecord: false,
    };
  }

  // Rule 6: Heavy Rain & Precipitation
  if (lower.includes('heavy rain') || lower.includes('excessive rain') || lower.includes('incessant rain') || lower.includes('torrential')) {
    return {
      rawDisasterName: trimmed,
      normalizedHazardType: 'Heavy Rain',
      confidence: 0.95,
      rule: "Keyword match: 'heavy rain/precipitation'",
      isSurveillanceRecord: false,
    };
  }

  // Rule 7: Lightning & Thunderstorm
  if (lower.includes('lightening') || lower.includes('lightning') || lower.includes('thunder')) {
    return {
      rawDisasterName: trimmed,
      normalizedHazardType: 'Lightning',
      confidence: 0.95,
      rule: "Keyword match: 'lightning/thunder'",
      isSurveillanceRecord: false,
    };
  }

  // Rule 8: Cyclone, Gale, Storm & Hailstorm
  if (lower.includes('cyclone') || lower.includes('storm') || lower.includes('hail') || lower.includes('squall') || lower.includes('tornado') || lower.includes('gale')) {
    return {
      rawDisasterName: trimmed,
      normalizedHazardType: 'Cyclone / Windstorm',
      confidence: 0.90,
      rule: "Keyword match: 'cyclone/storm/hail'",
      isSurveillanceRecord: false,
    };
  }

  // Rule 9: Earthquake & Tectonic Activity
  if (lower.includes('earthquake') || lower.includes('tremor') || lower.includes('seismic')) {
    return {
      rawDisasterName: trimmed,
      normalizedHazardType: 'Earthquake',
      confidence: 0.95,
      rule: "Keyword match: 'earthquake/seismic'",
      isSurveillanceRecord: false,
    };
  }

  // Rule 10: Fire (Forest Fire, Village Fire, Urban Fire)
  if (lower.includes('fire')) {
    return {
      rawDisasterName: trimmed,
      normalizedHazardType: 'Fire',
      confidence: 0.90,
      rule: "Keyword match: 'fire'",
      isSurveillanceRecord: false,
    };
  }

  // Rule 11: Drought
  if (lower.includes('drought') || lower.includes('dry spell')) {
    return {
      rawDisasterName: trimmed,
      normalizedHazardType: 'Drought',
      confidence: 0.95,
      rule: "Keyword match: 'drought'",
      isSurveillanceRecord: false,
    };
  }

  // Rule 12: Drowning (Hydrological accidents)
  if (lower.includes('drown') || lower.includes('submersion')) {
    return {
      rawDisasterName: trimmed,
      normalizedHazardType: 'Hydrological Accident / Drowning',
      confidence: 0.85,
      rule: "Keyword match: 'drowning'",
      isSurveillanceRecord: false,
    };
  }

  // Rule 13: Transport Accidents
  if (lower.includes('accident') || lower.includes('air, road and rail')) {
    return {
      rawDisasterName: trimmed,
      normalizedHazardType: 'Transport Accident',
      confidence: 0.85,
      rule: "Keyword match: 'accident'",
      isSurveillanceRecord: false,
    };
  }

  // Rule 14: Placeholder / Vague categories
  if (
    lower === 'other' ||
    lower === 'others' ||
    lower === 'other :' ||
    lower === 'other : 0' ||
    lower === 'other: 0' ||
    lower === 'other:'
  ) {
    return {
      rawDisasterName: trimmed,
      normalizedHazardType: 'Unspecified Hazard',
      confidence: 0.30,
      rule: 'Vague administrative placeholder',
      isSurveillanceRecord: false,
    };
  }

  // Fallback: Localized specific incident
  return {
    rawDisasterName: trimmed,
    normalizedHazardType: 'Other Localized Hazard',
    confidence: 0.60,
    rule: 'Fallback localized disaster category',
    isSurveillanceRecord: false,
  };
}
