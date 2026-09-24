/**
 * Centralized null-safe numeric formatting utilities for VISTHAAPAN Portal.
 * Prevents "Cannot read properties of undefined (reading 'toFixed')" and ensures
 * missing or undefined values are rendered as "—" or explicit fallback text,
 * while preserving legitimate 0 (zero) values.
 * Also supports string representations of numbers from API/database records.
 */

export const toNumeric = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') {
    return !Number.isNaN(value) && Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return null;
    const num = Number(trimmed);
    return !Number.isNaN(num) && Number.isFinite(num) ? num : null;
  }
  return null;
};

export const isValidNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !Number.isNaN(value) && Number.isFinite(value);
};

/**
 * Formats a generic number with optional fraction digits and locale grouping.
 * @param value - numeric value, string representation, null, or undefined
 * @param digits - fraction digits (default 0)
 * @param fallback - string to display if value is null/undefined/NaN (default "—")
 */
export const formatNumber = (
  value: number | string | null | undefined,
  digits: number = 0,
  fallback: string = '—'
): string => {
  const num = toNumeric(value);
  if (num === null) return fallback;
  if (digits === 0) {
    return Math.round(num).toLocaleString('en-IN');
  }
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

/**
 * Formats a ratio (0.0 to 1.0) or raw percentage (0 to 100) as a percentage string with `%`.
 * If value is <= 1.0 and >= -1.0 and is not zero, or if isRatio is true, it multiplies by 100.
 * @param value - numeric value (e.g. 0.85 or 85)
 * @param digits - decimal places (default 0)
 * @param fallback - fallback string (default "—")
 * @param isRatio - explicitly force ratio treatment (multiply by 100)
 */
export const formatPercent = (
  value: number | string | null | undefined,
  digits: number = 0,
  fallback: string = '—',
  isRatio?: boolean
): string => {
  const num = toNumeric(value);
  if (num === null) return fallback;
  const treatAsRatio = isRatio !== undefined ? isRatio : (Math.abs(num) <= 1.0 && num !== 0);
  const pct = treatAsRatio ? num * 100 : num;
  return `${pct.toFixed(digits)}%`;
};

/**
 * Formats distance in kilometers.
 * @param value - distance in km
 * @param digits - decimal places (default 1)
 * @param fallback - fallback string (default "—")
 */
export const formatDistance = (
  value: number | string | null | undefined,
  digits: number = 1,
  fallback: string = '—'
): string => {
  const num = toNumeric(value);
  if (num === null) return fallback;
  return `${num.toFixed(digits)} km`;
};

/**
 * Formats area in square kilometers.
 * @param value - area in km²
 * @param digits - decimal places (default 2)
 * @param fallback - fallback string (default "—")
 */
export const formatArea = (
  value: number | string | null | undefined,
  digits: number = 2,
  fallback: string = '—'
): string => {
  const num = toNumeric(value);
  if (num === null) return fallback;
  return `${num.toFixed(digits)} km²`;
};

/**
 * Formats population counts with Indian numbering grouping.
 * @param value - population count
 * @param fallback - fallback string (default "—")
 */
export const formatPopulation = (
  value: number | string | null | undefined,
  fallback: string = '—'
): string => {
  const num = toNumeric(value);
  if (num === null) return fallback;
  return Math.round(num).toLocaleString('en-IN');
};

/**
 * Formats decimal score (e.g., riskScore, priorityWeight, shapValue).
 * @param value - score value
 * @param digits - decimal places (default 2)
 * @param fallback - fallback string (default "—")
 */
export const formatScore = (
  value: number | string | null | undefined,
  digits: number = 2,
  fallback: string = '—'
): string => {
  const num = toNumeric(value);
  if (num === null) return fallback;
  return num.toFixed(digits);
};

/**
 * Formats coordinates safely.
 */
export const formatCoordinates = (
  lat: number | string | null | undefined,
  lng: number | string | null | undefined,
  fallback: string = '—'
): string => {
  const numLat = toNumeric(lat);
  const numLng = toNumeric(lng);
  if (numLat === null || numLng === null) return fallback;
  return `${numLat.toFixed(2)}°N, ${numLng.toFixed(2)}°E`;
};
