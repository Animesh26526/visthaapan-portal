/**
 * VISTHAAPAN Phase 6 GIS Spatial Utility Library
 * High-performance PostGIS geometry operations, coordinate validation,
 * geodesic distance calculators, and RFC 7946 GeoJSON serializers.
 */

import { Pool, PoolClient } from 'pg';
import type { GeoJsonFeature, GeoJsonFeatureCollection } from '../types/gis.js';

export const INDIA_BBOX = {
  minLat: 6.5,
  maxLat: 37.5,
  minLon: 68.0,
  maxLon: 97.5,
} as const;

/**
 * Validates whether latitude and longitude are valid finite WGS84 coordinates.
 */
export function isValidWgs84(lat: unknown, lon: unknown): boolean {
  if (typeof lat !== 'number' || typeof lon !== 'number') return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

/**
 * Checks if coordinates fall within the India terrestrial geographic bounding box.
 */
export function isWithinIndia(lat: number, lon: number): boolean {
  if (!isValidWgs84(lat, lon)) return false;
  return (
    lat >= INDIA_BBOX.minLat &&
    lat <= INDIA_BBOX.maxLat &&
    lon >= INDIA_BBOX.minLon &&
    lon <= INDIA_BBOX.maxLon
  );
}

/**
 * Computes geodesic distance in kilometers using the Haversine great-circle formula.
 * Fast in-memory calculation (mean Earth radius = 6,371.0088 km).
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371.0088; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180.0;
  const dLon = ((lon2 - lon1) * Math.PI) / 180.0;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180.0) *
      Math.cos((lat2 * Math.PI) / 180.0) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

/**
 * Computes exact geodesic ellipsoidal distance in meters using PostGIS ST_Distance(::geography).
 */
export async function getGeodesicDistancePostGis(
  db: Pool | PoolClient,
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): Promise<number> {
  const query = `
    SELECT ST_Distance(
      ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
      ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography
    ) AS distance_meters;
  `;
  const { rows } = await db.query<{ distance_meters: string }>(query, [lon1, lat1, lon2, lat2]);
  return Math.round(parseFloat(rows[0].distance_meters) * 100) / 100;
}

/**
 * Builds a standardized RFC 7946 GeoJSON Feature.
 */
export function createGeoJsonFeature<P = Record<string, any>>(
  id: string | number,
  geometry: any,
  properties: P
): GeoJsonFeature<P> {
  let parsedGeom = geometry;
  if (typeof geometry === 'string') {
    try {
      parsedGeom = JSON.parse(geometry);
    } catch {
      parsedGeom = null;
    }
  }

  return {
    type: 'Feature',
    id,
    geometry: parsedGeom,
    properties,
  };
}

/**
 * Wraps an array of Features into an RFC 7946 GeoJSON FeatureCollection.
 */
export function createFeatureCollection<P = Record<string, any>>(
  features: GeoJsonFeature<P>[],
  metadata?: Record<string, any>
): GeoJsonFeatureCollection<P> {
  return {
    type: 'FeatureCollection',
    features,
    metadata: {
      count: features.length,
      crs: {
        type: 'name',
        properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' },
      },
      ...metadata,
    },
  };
}

/**
 * Calculates a metric buffer around a WGS84 geometry using PostGIS geography casting.
 * Returns the buffered geometry as standard GeoJSON string.
 */
export async function computeBufferGeoJson(
  db: Pool | PoolClient,
  geomGeoJson: string,
  bufferMeters: number
): Promise<string> {
  const query = `
    SELECT ST_AsGeoJSON(
      ST_Buffer(
        ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography,
        $2
      )::geometry
    ) AS buffered_geom;
  `;
  const { rows } = await db.query<{ buffered_geom: string }>(query, [geomGeoJson, bufferMeters]);
  return rows[0].buffered_geom;
}

/**
 * Determines whether a WGS84 point intersects any polygon in the specified table.
 */
export async function checkPointIntersectsTable(
  db: Pool | PoolClient,
  lon: number,
  lat: number,
  tableName: 'red_zones' | 'hazard_layers'
): Promise<boolean> {
  const query = `
    SELECT EXISTS (
      SELECT 1 FROM ${tableName}
      WHERE ST_Intersects(
        geometry,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)
      )
    ) AS is_intersecting;
  `;
  const { rows } = await db.query<{ is_intersecting: boolean }>(query, [lon, lat]);
  return rows[0].is_intersecting;
}
