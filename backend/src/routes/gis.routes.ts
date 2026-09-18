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
} from '../controllers/gis.controller.js';

export const gisRouter: Router = Router();

// Districts GIS layer with Phase 5 AI risk attributions
gisRouter.get('/districts', getGisDistricts);
gisRouter.get('/districts/:id', getGisDistrictById);

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
