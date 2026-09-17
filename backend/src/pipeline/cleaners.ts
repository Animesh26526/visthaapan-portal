/**
 * VISTHAAPAN Data Cleaning & Semantic Type Conversion Engine.
 * Enforces strict Null vs Zero semantics and geographic canonicalization.
 */

// Canonical State Normalization Map
const STATE_CANONICAL_MAP: Record<string, string> = {
  'andaman and nicobar islands': 'Andaman and Nicobar Islands',
  'andhra pradesh': 'Andhra Pradesh',
  'arunachal pradesh': 'Arunachal Pradesh',
  assam: 'Assam',
  bihar: 'Bihar',
  chandigarh: 'Chandigarh',
  chhattisgarh: 'Chhattisgarh',
  'dadra and nagar haveli and daman and diu': 'Dadra and Nagar Haveli and Daman and Diu',
  delhi: 'Delhi',
  goa: 'Goa',
  gujarat: 'Gujarat',
  haryana: 'Haryana',
  'himachal pradesh': 'Himachal Pradesh',
  'jammu and kashmir': 'Jammu and Kashmir',
  jharkhand: 'Jharkhand',
  karnataka: 'Karnataka',
  kerala: 'Kerala',
  ladakh: 'Ladakh',
  lakshadweep: 'Lakshadweep',
  'madhya pradesh': 'Madhya Pradesh',
  maharashtra: 'Maharashtra',
  manipur: 'Manipur',
  meghalaya: 'Meghalaya',
  mizoram: 'Mizoram',
  nagaland: 'Nagaland',
  odisha: 'Odisha',
  puducherry: 'Puducherry',
  punjab: 'Punjab',
  rajasthan: 'Rajasthan',
  sikkim: 'Sikkim',
  'tamil nadu': 'Tamil Nadu',
  telangana: 'Telangana',
  tripura: 'Tripura',
  'uttar pradesh': 'Uttar Pradesh',
  uttarakhand: 'Uttarakhand',
  'west bengal': 'West Bengal',
};

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validates and normalizes date strings (YYYY-MM-DD).
 * Returns string if valid date, or null if invalid, summary row, or malformed.
 */
export function parseDate(rawDate: string | null | undefined): string | null {
  if (!rawDate) return null;
  const trimmed = rawDate.trim();

  // Reject summary footer rows or emoji prefixes
  if (!DATE_REGEX.test(trimmed)) return null;

  const [yearStr, monthStr, dayStr] = trimmed.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  // Ensure calendar validity
  const dateObj = new Date(Date.UTC(year, month - 1, day));
  if (
    dateObj.getUTCFullYear() !== year ||
    dateObj.getUTCMonth() !== month - 1 ||
    dateObj.getUTCDate() !== day
  ) {
    return null;
  }

  return trimmed;
}

/**
 * Canonicalizes State names (stripping whitespace, applying canonical title casing).
 */
export function normalizeState(rawState: string | null | undefined): string {
  if (!rawState) return 'Unknown State';
  const clean = rawState.trim();
  const lower = clean.toLowerCase();
  return STATE_CANONICAL_MAP[lower] ?? clean;
}

/**
 * Canonicalizes District names (stripping whitespace, normalizing multiple spaces).
 */
export function normalizeDistrict(rawDistrict: string | null | undefined): string {
  if (!rawDistrict) return 'Unknown District';
  const clean = rawDistrict.trim().replace(/\s+/g, ' ');
  if (!clean || clean === '0' || clean.toLowerCase() === 'all') {
    return 'Statewide / Unspecified';
  }
  return clean;
}

/**
 * Parses integer fields strictly preserving NULL semantics:
 * - Empty string, whitespace, 'null', 'na', 'n/a' -> returns NULL.
 * - '0' -> returns 0 (Explicit zero).
 * - Numeric string -> returns parsed integer.
 * - Invalid non-numeric -> returns NULL.
 */
export function parseOptionalInt(rawValue: string | null | undefined): number | null {
  if (rawValue === undefined || rawValue === null) return null;
  const trimmed = rawValue.trim();
  if (
    trimmed === '' ||
    trimmed.toLowerCase() === 'null' ||
    trimmed.toLowerCase() === 'na' ||
    trimmed.toLowerCase() === 'n/a' ||
    trimmed.toLowerCase() === 'none'
  ) {
    return null;
  }

  const num = parseInt(trimmed, 10);
  return isNaN(num) ? null : num;
}

/**
 * Parses numeric/float fields strictly preserving NULL semantics:
 * - Empty string, whitespace, 'null', 'na' -> returns NULL.
 * - '0.00' or '0' -> returns 0.0 (Explicit zero).
 * - Numeric string -> returns parsed float.
 * - Invalid non-numeric -> returns NULL.
 */
export function parseOptionalFloat(rawValue: string | null | undefined): number | null {
  if (rawValue === undefined || rawValue === null) return null;
  const trimmed = rawValue.trim();
  if (
    trimmed === '' ||
    trimmed.toLowerCase() === 'null' ||
    trimmed.toLowerCase() === 'na' ||
    trimmed.toLowerCase() === 'n/a' ||
    trimmed.toLowerCase() === 'none'
  ) {
    return null;
  }

  const num = parseFloat(trimmed);
  return isNaN(num) ? null : num;
}
