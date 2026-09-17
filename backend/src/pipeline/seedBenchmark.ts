/**
 * VISTHAAPAN Deterministic Demonstration Benchmark Seeder.
 * Generates reproducible, clearly labeled SIMULATED demonstration fixtures
 * centered on the Chamoli planning area for testing the end-to-end architecture.
 *
 * ALL records created here are explicitly labeled SIMULATED and have
 * source_type = 'SIMULATED' to prevent confusion with official government data.
 */

import { PoolClient } from 'pg';
import { pool, getClient } from '../db/pool.js';
import { logger } from '../utils/logger.js';
import { getOrCreateDataSource, getOrCreateDataset, getOrCreateDatasetVersion } from './provenance.js';

export interface BenchmarkSummary {
  dataSourceId: string;
  datasetVersionId: string;
  regionsCreated: number;
  planningUnitsCreated: number;
  relocationSitesCreated: number;
  routesCreated: number;
  scenariosCreated: number;
  durationMs: number;
}

export async function seedDemonstrationBenchmark(): Promise<BenchmarkSummary> {
  const startTime = Date.now();
  logger.info('Starting VISTHAAPAN deterministic demonstration benchmark seeding...');

  const client: PoolClient = await getClient();

  try {
    await client.query('BEGIN');

    // 1. Register SIMULATED Benchmark Provenance
    const sourceId = await getOrCreateDataSource(client, {
      datasetName: 'Chamoli Demonstration Relocation Benchmark (SIMULATED)',
      sourceOrganization: 'VISTHAAPAN SIH Engineering Team',
      sourceType: 'SIMULATED',
      sourceUrl: 'urn:visthaapan:simulated:benchmark:chamoli-v1',
      coverage: 'Uttarakhand - Chamoli & Transit Corridors',
      confidence: 1.0,
      description: 'Deterministic demonstration fixture for prototype testing. NOT official government data.',
    });

    const datasetId = await getOrCreateDataset(client, {
      sourceId,
      name: 'Chamoli Deterministic Planning Benchmark',
      description: 'Relocation planning entities, safe capacity hubs, candidate routes, and operational scenarios',
      dataType: 'SIMULATED_BENCHMARK',
      format: 'POSTGRES_FIXTURES',
      coverage: 'District Chamoli, Rudraprayag, Pauri Garhwal, Dehradun',
    });

    const { id: datasetVersionId } = await getOrCreateDatasetVersion(client, {
      datasetId,
      versionNumber: 'v1.0.0-BENCHMARK-CHAMOLI',
      recordCount: 35,
      qualityScore: 1.0,
      processingNotes: 'Deterministic benchmark input fixtures for Phase 4-8 testing',
    });

    // Clean up existing benchmark entities for idempotency
    await client.query(`
      DELETE FROM candidate_routes WHERE habitation_id IN (
        SELECT id FROM habitations WHERE name LIKE '%(SIMULATED)%'
      );
      DELETE FROM site_capacities WHERE site_id IN (
        SELECT id FROM relocation_sites WHERE name LIKE '%(SIMULATED)%'
      );
      DELETE FROM site_suitability_assessments WHERE site_id IN (
        SELECT id FROM relocation_sites WHERE name LIKE '%(SIMULATED)%'
      );
      DELETE FROM relocation_sites WHERE name LIKE '%(SIMULATED)%';
      DELETE FROM habitation_populations WHERE habitation_id IN (
        SELECT id FROM habitations WHERE name LIKE '%(SIMULATED)%'
      );
      DELETE FROM habitations WHERE name LIKE '%(SIMULATED)%';
      DELETE FROM scenarios WHERE name LIKE '%(SIMULATED)%';
      DELETE FROM regions WHERE name LIKE '%(SIMULATED)%';
    `);

    // 2. Create Planning Regions (Districts)
    const districtRegions = [
      { name: 'Chamoli District (SIMULATED)', type: 'district', state: 'Uttarakhand', district: 'Chamoli', geom: 'SRID=4326;MULTIPOLYGON(((79.2 30.2, 79.8 30.2, 79.8 30.8, 79.2 30.8, 79.2 30.2)))' },
      { name: 'Rudraprayag District (SIMULATED)', type: 'district', state: 'Uttarakhand', district: 'Rudraprayag', geom: 'SRID=4326;MULTIPOLYGON(((78.8 30.2, 79.2 30.2, 79.2 30.7, 78.8 30.7, 78.8 30.2)))' },
      { name: 'Pauri Garhwal District (SIMULATED)', type: 'district', state: 'Uttarakhand', district: 'Pauri Garhwal', geom: 'SRID=4326;MULTIPOLYGON(((78.5 29.8, 79.1 29.8, 79.1 30.2, 78.5 30.2, 78.5 29.8)))' },
      { name: 'Dehradun District (SIMULATED)', type: 'district', state: 'Uttarakhand', district: 'Dehradun', geom: 'SRID=4326;MULTIPOLYGON(((77.8 30.0, 78.3 30.0, 78.3 30.5, 77.8 30.5, 77.8 30.0)))' },
    ];

    const regionIdMap: Record<string, string> = {};
    for (const reg of districtRegions) {
      const res = await client.query<{ id: string }>(
        `INSERT INTO regions (name, type, state, district, boundary_geometry)
         VALUES ($1, $2, $3, $4, ST_GeomFromEWKT($5))
         RETURNING id;`,
        [reg.name, reg.type, reg.state, reg.district, reg.geom]
      );
      regionIdMap[reg.district] = res.rows[0].id;
    }

    // 3. Create High-Risk Planning Sectors in Chamoli (Habitations)
    const planningUnits = [
      {
        name: 'Joshimath High Risk Sector (SIMULATED)',
        district: 'Chamoli',
        lat: 30.5564,
        lon: 79.5645,
        population: 4800,
        households: 960,
        elderly: 580,
        children: 820,
        disabled: 95,
      },
      {
        name: 'Malari Upper Valley Sector (SIMULATED)',
        district: 'Chamoli',
        lat: 30.6872,
        lon: 79.8891,
        population: 2300,
        households: 440,
        elderly: 290,
        children: 410,
        disabled: 42,
      },
      {
        name: 'Tharali Riverine Sector (SIMULATED)',
        district: 'Chamoli',
        lat: 30.0614,
        lon: 79.5021,
        population: 3600,
        households: 710,
        elderly: 420,
        children: 650,
        disabled: 70,
      },
      {
        name: 'Ghat Lowland Zone (SIMULATED)',
        district: 'Chamoli',
        lat: 30.2541,
        lon: 79.4328,
        population: 2900,
        households: 560,
        elderly: 310,
        children: 510,
        disabled: 55,
      },
      {
        name: 'Gwaldam Valley Slope (SIMULATED)',
        district: 'Chamoli',
        lat: 30.0156,
        lon: 79.5612,
        population: 1850,
        households: 360,
        elderly: 210,
        children: 320,
        disabled: 35,
      },
    ];

    const planningUnitIds: { id: string; name: string; lat: number; lon: number }[] = [];
    for (const pu of planningUnits) {
      const regId = regionIdMap[pu.district];
      const geom = `SRID=4326;POINT(${pu.lon} ${pu.lat})`;
      const habRes = await client.query<{ id: string }>(
        `INSERT INTO habitations (name, region_id, state, district, latitude, longitude, geometry, status)
         VALUES ($1, $2, 'Uttarakhand', $3, $4, $5, ST_GeomFromEWKT($6), 'monitored')
         RETURNING id;`,
        [pu.name, regId, pu.district, pu.lat, pu.lon, geom]
      );
      const habId = habRes.rows[0].id;
      planningUnitIds.push({ id: habId, name: pu.name, lat: pu.lat, lon: pu.lon });

      await client.query(
        `INSERT INTO habitation_populations (
          habitation_id, population, households, elderly_population, children_population, disabled_population, dataset_version_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7);`,
        [habId, pu.population, pu.households, pu.elderly, pu.children, pu.disabled, datasetVersionId]
      );
    }

    // 4. Create Candidate Safe Relocation Sites & Bottleneck Capacities
    const relocationSites = [
      {
        name: 'Pipalkoti Transit Shelter Hub (SIMULATED)',
        district: 'Chamoli',
        type: 'shelter',
        lat: 30.4321,
        lon: 79.4312,
        physical: 3500,
        water: 3200,
        shelter: 3500,
        sanitation: 2800,
        healthcare: 3000,
        electricity: 4000,
        access: 3500,
        bottleneck: 'sanitation',
        suitability: 0.88,
      },
      {
        name: 'Gauchar Strategic Airstrip Hub (SIMULATED)',
        district: 'Chamoli',
        type: 'open-area',
        lat: 30.2854,
        lon: 79.1542,
        physical: 7500,
        water: 6000,
        shelter: 5500,
        sanitation: 5000,
        healthcare: 5800,
        electricity: 7000,
        access: 8000,
        bottleneck: 'shelter',
        suitability: 0.94,
      },
      {
        name: 'Karnaprayag Civil Relief Facility (SIMULATED)',
        district: 'Chamoli',
        type: 'public-building',
        lat: 30.2589,
        lon: 79.2198,
        physical: 4200,
        water: 3800,
        shelter: 4000,
        sanitation: 3500,
        healthcare: 3600,
        electricity: 4500,
        access: 4000,
        bottleneck: 'sanitation',
        suitability: 0.86,
      },
      {
        name: 'Rudraprayag Safe Camp Hub (SIMULATED)',
        district: 'Rudraprayag',
        type: 'shelter',
        lat: 30.2842,
        lon: 78.9812,
        physical: 6000,
        water: 5500,
        shelter: 5200,
        sanitation: 4800,
        healthcare: 5000,
        electricity: 6000,
        access: 5500,
        bottleneck: 'sanitation',
        suitability: 0.91,
      },
      {
        name: 'Srinagar Regional Logistics Haven (SIMULATED)',
        district: 'Pauri Garhwal',
        type: 'school',
        lat: 30.2215,
        lon: 78.7845,
        physical: 12000,
        water: 10500,
        shelter: 9500,
        sanitation: 9000,
        healthcare: 11000,
        electricity: 12000,
        access: 11000,
        bottleneck: 'sanitation',
        suitability: 0.95,
      },
      {
        name: 'Rishikesh State Reserve Terminal (SIMULATED)',
        district: 'Dehradun',
        type: 'camp',
        lat: 30.1032,
        lon: 78.2946,
        physical: 20000,
        water: 18000,
        shelter: 16000,
        sanitation: 15000,
        healthcare: 19000,
        electricity: 20000,
        access: 20000,
        bottleneck: 'sanitation',
        suitability: 0.98,
      },
    ];

    const siteIds: { id: string; name: string; lat: number; lon: number }[] = [];
    for (const site of relocationSites) {
      const regId = regionIdMap[site.district];
      const geom = `SRID=4326;POINT(${site.lon} ${site.lat})`;
      const siteRes = await client.query<{ id: string }>(
        `INSERT INTO relocation_sites (name, type, region_id, latitude, longitude, geometry, inside_red_zone, source_id)
         VALUES ($1, $2, $3, $4, $5, ST_GeomFromEWKT($6), FALSE, $7)
         RETURNING id;`,
        [site.name, site.type, regId, site.lat, site.lon, geom, sourceId]
      );
      const siteId = siteRes.rows[0].id;
      siteIds.push({ id: siteId, name: site.name, lat: site.lat, lon: site.lon });

      // Effective capacity = minimum capacity across all bottleneck dimensions
      const effectiveCapacity = Math.min(
        site.physical,
        site.water,
        site.shelter,
        site.sanitation,
        site.healthcare,
        site.electricity,
        site.access
      );

      await client.query(
        `INSERT INTO site_capacities (
          site_id, physical_capacity, water_capacity, shelter_capacity,
          sanitation_capacity, healthcare_capacity, electricity_capacity, access_capacity,
          effective_capacity, current_occupancy, available_capacity, bottleneck
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, $9, $10);`,
        [
          siteId,
          site.physical,
          site.water,
          site.shelter,
          site.sanitation,
          site.healthcare,
          site.electricity,
          site.access,
          effectiveCapacity,
          site.bottleneck,
        ]
      );

      await client.query(
        `INSERT INTO site_suitability_assessments (
          site_id, safety_score, accessibility_score, infrastructure_score,
          healthcare_score, water_score, sanitation_score, electricity_score,
          shelter_score, suitability_score, confidence, assessment_method
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0.98, 'DETERMINISTIC_BENCHMARK_EVALUATION');`,
        [
          siteId,
          site.suitability,
          site.suitability * 0.95,
          site.suitability * 0.92,
          site.suitability * 0.90,
          site.suitability * 0.91,
          site.suitability * 0.88,
          site.suitability * 0.96,
          site.suitability * 0.94,
          site.suitability,
        ]
      );
    }

    // 5. Create Candidate Feasible Routes (Transit Corridors)
    let routeCount = 0;
    for (const pu of planningUnitIds) {
      for (const site of siteIds) {
        // Calculate rough geodesic distance using Pythagoras on coordinates as demo baseline
        const dx = (site.lon - pu.lon) * 40000 * Math.cos((((pu.lat + site.lat) / 2) * Math.PI) / 180) / 360;
        const dy = (site.lat - pu.lat) * 40000 / 360;
        const straightLineKm = Math.sqrt(dx * dx + dy * dy);
        // Mountain road winding factor ~ 1.6
        const roadDistanceKm = Math.round(straightLineKm * 1.6 * 10) / 10;
        // Average mountain evacuation speed ~ 35 km/h
        const travelTimeMinutes = Math.round((roadDistanceKm / 35) * 60);

        const routeGeom = `SRID=4326;LINESTRING(${pu.lon} ${pu.lat}, ${site.lon} ${site.lat})`;

        await client.query(
          `INSERT INTO candidate_routes (
            habitation_id, site_id, feasible, distance_km, travel_time_minutes,
            road_accessibility, safety_constraint_satisfied, blocked, route_geometry
          ) VALUES ($1, $2, TRUE, $3, $4, 'all-weather', TRUE, FALSE, ST_GeomFromEWKT($5));`,
          [pu.id, site.id, roadDistanceKm, travelTimeMinutes, routeGeom]
        );
        routeCount++;
      }
    }

    // 6. Create Demonstration Scenarios
    const scenarios = [
      {
        name: 'Chamoli Monsoon Peak Landslide Surge (SIMULATED)',
        description: 'Simulated high-intensity rainfall triggering slope instability across Joshimath and Malari',
        category: 'HAZARD_SURGE',
        status: 'draft',
      },
      {
        name: 'Alaknanda Flash Flood Red Alert (SIMULATED)',
        description: 'Simulated upstream glacial lake outburst triggering riverine flooding along Tharali and Ghat',
        category: 'FLOOD_ALERT',
        status: 'draft',
      },
      {
        name: 'Joshimath Highway Severance Emergency (SIMULATED)',
        description: 'Simulated transit bottleneck with primary highway blocked, forcing diversion to southern corridors',
        category: 'NETWORK_BLOCKAGE',
        status: 'draft',
      },
      {
        name: 'Multi-District Concurrent Mass Evacuation (SIMULATED)',
        description: 'Simulated regional disaster requiring high-capacity inter-district allocation to Srinagar and Rishikesh',
        category: 'REGIONAL_SURGE',
        status: 'draft',
      },
    ];

    for (const sc of scenarios) {
      await client.query(
        `INSERT INTO scenarios (name, description, status)
         VALUES ($1, $2, $3);`,
        [sc.name, sc.description, sc.status]
      );
    }

    await client.query('COMMIT');

    const durationMs = Date.now() - startTime;
    logger.info(
      {
        regions: districtRegions.length,
        planningUnits: planningUnits.length,
        sites: relocationSites.length,
        routes: routeCount,
        scenarios: scenarios.length,
        durationMs,
      },
      'Deterministic Chamoli demonstration benchmark seeded successfully.'
    );

    return {
      dataSourceId: sourceId,
      datasetVersionId,
      regionsCreated: districtRegions.length,
      planningUnitsCreated: planningUnits.length,
      relocationSitesCreated: relocationSites.length,
      routesCreated: routeCount,
      scenariosCreated: scenarios.length,
      durationMs,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error({ err }, 'Benchmark seeding failed and rolled back.');
    throw err;
  } finally {
    client.release();
  }
}
