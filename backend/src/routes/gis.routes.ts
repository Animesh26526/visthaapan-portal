/**
 * VISTHAAPAN Phase 6 GIS Spatial Intelligence Routes
 * API endpoint definitions for GeoJSON layers, model-derived red zones, and site suitability.
 */

import { Router } from 'express';
import {
  getGisDistricts,
  getGisDistrictById,
  getHazardLayers,
  getRedZones,
  getRelocationSites,
  getSiteSuitabilityAudit,
  getGisHospitals,
  getGisCorridors,
  getStateBoundaries,
  getDistrictBoundaries,
  getSubdistrictBoundaries,
  getCensusSettlements,
  getOsmRoads,
  getOsmFacilities,
  getHazardEvidence,
  searchSettlements,
  getSettlementIntelligence,
} from '../controllers/gis.controller.js';

export const gisRouter: Router = Router();

// Phase 10: Settlement Search & Habitation-Level Intelligence Engine
gisRouter.get('/settlements/search', searchSettlements);
gisRouter.get('/settlements/:id/intelligence', getSettlementIntelligence);

// Phase 10: Verified Spatial Hazard Evidence Features (Landslides, Earthquakes, River Corridors, Subsidence)
gisRouter.get('/hazard-evidence', getHazardEvidence);

// Districts GIS layer with Phase 5 AI risk attributions
gisRouter.get('/districts', getGisDistricts);
gisRouter.get('/districts/:id', getGisDistrictById);

// Official Survey of India Administrative Boundaries
gisRouter.get('/boundaries/state', getStateBoundaries);
gisRouter.get('/boundaries/districts', getDistrictBoundaries);
gisRouter.get('/boundaries/subdistricts', getSubdistrictBoundaries);

// Official Census 2011 Settlements (Towns & Villages)
gisRouter.get('/census-settlements', getCensusSettlements);

// OpenStreetMap Transport & Facilities
gisRouter.get('/osm/roads', getOsmRoads);
gisRouter.get('/osm/facilities', getOsmFacilities);

// Active spatial hazard layers (polygons, buffer radius)
gisRouter.get('/hazard-layers', getHazardLayers);

// Model-derived Red Zones (multi-hazard buffer union benchmark)
gisRouter.get('/red-zones', getRedZones);

// Candidate safe relocation sites & suitability
gisRouter.get('/sites', getRelocationSites);
gisRouter.get('/sites/:id/suitability', getSiteSuitabilityAudit);

// Geocoded healthcare infrastructure points
gisRouter.get('/hospitals', getGisHospitals);

// Candidate evacuation transit corridors
gisRouter.get('/corridors', getGisCorridors);
