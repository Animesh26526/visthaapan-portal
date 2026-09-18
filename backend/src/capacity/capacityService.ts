/**
 * VISTHAAPAN Phase 7 Capacity Assessment & Resource Bottleneck Engine
 * 
 * Objectives:
 * 1. Computes effective capacity = min(physical, water, shelter, sanitation, healthcare, electricity, access)
 * 2. Identifies limiting bottleneck resource, severity, and plain-language explanation
 * 3. Enforces hard hazard exclusions from Phase 6 GIS Red Zones (ST_Intersects -> capacity usable = 0)
 * 4. Preserves healthcare bed quarantine (flags HEALTHCARE_BED_DATA_QUARANTINED)
 * 5. Preserves terrain raster limits (flags TERRAIN_ELEVATION_UNAVAILABLE for non-Gujarat coordinates)
 * 6. Seeds and evaluates explicit relocation demand nodes with full provenance
 */

import { pool, getClient } from '../db/pool.js';
import { logger } from '../utils/logger.js';

export interface SiteCapacityAssessment {
  siteId: string;
  siteName: string;
  district: string;
  siteType: string;
  insideRedZone: boolean;
  hardHazardExclusion: boolean;
  nominalCapacity: number;
  effectiveCapacity: number;
  usableCapacity: number; // 0 if hardHazardExclusion is true, else effectiveCapacity
  availableCapacity: number;
  currentOccupancy: number;
  utilizationPercent: number;
  bottleneckDimension: string;
  bottleneckValue: number;
  limitingFactor: string;
  capacityStatus: 'ADEQUATE' | 'BOTTLENECK_CONSTRAINED' | 'CRITICALLY_LIMITED' | 'RESTRICTED_BY_HAZARD';
  resourceBreakdown: {
    physical: number;
    water: number;
    shelter: number;
    sanitation: number;
    healthcare: number;
    electricity: number;
    access: number;
  };
  suitabilityScore: number;
  suitabilityTier: string;
  safetyScore: number;
  dataOrigin: 'SIMULATED';
  confidence: number;
  uncertaintyFlags: string[];
}

export interface RelocationDemandNode {
  id?: string;
  demandNodeId: string;
  habitationId?: string | null;
  canonicalDistrictId?: string | null;
  nodeName: string;
  districtName: string;
  stateName: string;
  totalPopulation: number;
  relocationDemand: number;
  priorityWeight: number;
  operationalTier: 'immediate' | 'short-term' | 'medium-term';
  demandDerivationMethod: string;
  dataOrigin: 'REAL' | 'DERIVED' | 'SIMULATED';
  populationSource: 'CENSUS_2011' | 'BENCHMARK_CENSUS' | 'STATE_AVERAGE_ESTIMATE' | 'UNAVAILABLE';
  hazardExposureStatus: string;
  uncertaintyFlags: string[];
  latitude?: number;
  longitude?: number;
}

export interface CapacitySummary {
  totalDemandPopulation: number;
  totalSafeEffectiveCapacity: number;
  totalNominalCapacity: number;
  totalRestrictedCapacity: number;
  netCapacityBalance: number;
  isDeficit: boolean;
  siteCount: number;
  safeSiteCount: number;
  restrictedSiteCount: number;
  bottleneckDistribution: Record<string, number>;
  operationalTierDemand: {
    immediate: number;
    shortTerm: number;
    mediumTerm: number;
  };
  dataOrigin: 'SIMULATED_BENCHMARK';
  uncertaintyNotes: string[];
}

/**
 * Recalculates effective capacity and resource bottlenecks for all candidate sites,
 * synchronizing with Phase 6 GIS Red Zone spatial intersections.
 */
export async function evaluateAllSiteCapacities(): Promise<SiteCapacityAssessment[]> {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Query sites joined with capacities, suitability assessments, and red zone intersections
    const sitesQuery = `
      SELECT 
        s.id AS site_id,
        s.name AS site_name,
        s.type AS site_type,
        r.district,
        s.inside_red_zone,
        sc.physical_capacity,
        sc.water_capacity,
        sc.shelter_capacity,
        sc.sanitation_capacity,
        sc.healthcare_capacity,
        sc.electricity_capacity,
        sc.access_capacity,
        sc.current_occupancy,
        ssa.suitability_score,
        ssa.suitability_tier,
        ssa.safety_score,
        ssa.terrain_status,
        -- Check live PostGIS intersection with any active red zone
        EXISTS (
          SELECT 1 FROM red_zones rz 
          WHERE ST_Intersects(s.geometry, rz.geometry)
        ) AS postgis_red_zone_intersect
      FROM relocation_sites s
      LEFT JOIN regions r ON r.id = s.region_id
      LEFT JOIN site_capacities sc ON sc.site_id = s.id
      LEFT JOIN site_suitability_assessments ssa ON ssa.site_id = s.id
      ORDER BY s.name ASC;
    `;

    const { rows } = await client.query(sitesQuery);
    const assessments: SiteCapacityAssessment[] = [];

    for (const row of rows) {
      const physical = Number(row.physical_capacity) || 0;
      const water = Number(row.water_capacity) || 0;
      const shelter = Number(row.shelter_capacity) || 0;
      const sanitation = Number(row.sanitation_capacity) || 0;
      const healthcare = Number(row.healthcare_capacity) || 0;
      const electricity = Number(row.electricity_capacity) || 0;
      const access = Number(row.access_capacity) || 0;
      const currentOccupancy = Number(row.current_occupancy) || 0;

      const resourceMap: Record<string, number> = {
        physical,
        water,
        shelter,
        sanitation,
        healthcare,
        electricity,
        access,
      };

      // Effective capacity = minimum across all limiting resources
      const effectiveCap = Math.min(...Object.values(resourceMap));

      // Identify the limiting bottleneck resource
      let bottleneckDim = 'sanitation';
      let bottleneckVal = effectiveCap;

      for (const [dim, val] of Object.entries(resourceMap)) {
        if (val === effectiveCap) {
          bottleneckDim = dim;
          bottleneckVal = val;
          break;
        }
      }

      // Check red zone exclusion: either DB flag, PostGIS spatial intersection, or RESTRICTED suitability
      const isHardExcluded = Boolean(
        row.inside_red_zone || 
        row.postgis_red_zone_intersect || 
        row.suitability_tier === 'RESTRICTED' ||
        (row.safety_score !== null && Number(row.safety_score) < 0.5)
      );

      // Usable capacity for Phase 8 allocation is 0 if inside red zone
      const usableCap = isHardExcluded ? 0 : effectiveCap;
      const availableCap = isHardExcluded ? 0 : Math.max(0, effectiveCap - currentOccupancy);
      const utilPercent = effectiveCap > 0 ? Number(((currentOccupancy / effectiveCap) * 100).toFixed(2)) : 0.0;

      let status: 'ADEQUATE' | 'BOTTLENECK_CONSTRAINED' | 'CRITICALLY_LIMITED' | 'RESTRICTED_BY_HAZARD';
      let limitingFactorText = '';

      if (isHardExcluded) {
        status = 'RESTRICTED_BY_HAZARD';
        limitingFactorText = `GIS-DERIVED HARD HAZARD EXCLUSION: Site intersects active hazard exclusion envelope (safety score: ${Number(row.safety_score || 0).toFixed(2)}). Decision-support model enforces zero usable capacity after hazard exclusion.`;
      } else if (bottleneckVal < physical * 0.6) {
        status = 'CRITICALLY_LIMITED';
        limitingFactorText = `Critical bottleneck in ${bottleneckDim}: Safe capacity limited to ${bottleneckVal} souls (${Math.round((bottleneckVal / physical) * 100)}% of ${physical} physical capacity).`;
      } else if (bottleneckVal < physical) {
        status = 'BOTTLENECK_CONSTRAINED';
        limitingFactorText = `Constrained by ${bottleneckDim}: Effective capacity is ${bottleneckVal} vs ${physical} physical capacity.`;
      } else {
        status = 'ADEQUATE';
        limitingFactorText = `Balanced infrastructure: Capacity supports nominal threshold of ${effectiveCap} souls.`;
      }

      const uncertaintyFlags: string[] = [
        'SIMULATED_BENCHMARK_FACILITY',
        'HEALTHCARE_BED_DATA_QUARANTINED',
      ];
      if (row.terrain_status === 'UNAVAILABLE') {
        uncertaintyFlags.push('TERRAIN_ELEVATION_UNAVAILABLE');
      }

      // Update database row in site_capacities
      await client.query(`
        UPDATE site_capacities
        SET 
          nominal_capacity = $1,
          effective_capacity = $2,
          available_capacity = $3,
          utilization_percent = $4,
          bottleneck = $5,
          bottleneck_dimension = $5,
          bottleneck_value = $6,
          limiting_factor = $7,
          capacity_status = $8,
          hard_hazard_exclusion = $9,
          data_origin = 'SIMULATED',
          confidence = 0.98,
          uncertainty_flags = $10,
          calculated_at = NOW()
        WHERE site_id = $11;
      `, [
        physical,
        effectiveCap,
        availableCap,
        utilPercent,
        bottleneckDim,
        bottleneckVal,
        limitingFactorText,
        status,
        isHardExcluded,
        uncertaintyFlags,
        row.site_id,
      ]);

      assessments.push({
        siteId: row.site_id,
        siteName: row.site_name,
        district: row.district || 'Chamoli',
        siteType: row.site_type,
        insideRedZone: Boolean(row.inside_red_zone || row.postgis_red_zone_intersect),
        hardHazardExclusion: isHardExcluded,
        nominalCapacity: physical,
        effectiveCapacity: effectiveCap,
        usableCapacity: usableCap,
        availableCapacity: availableCap,
        currentOccupancy,
        utilizationPercent: utilPercent,
        bottleneckDimension: bottleneckDim,
        bottleneckValue: bottleneckVal,
        limitingFactor: limitingFactorText,
        capacityStatus: status,
        resourceBreakdown: {
          physical,
          water,
          shelter,
          sanitation,
          healthcare,
          electricity,
          access,
        },
        suitabilityScore: Number(row.suitability_score || 0),
        suitabilityTier: row.suitability_tier || 'CONDITIONALLY_SUITABLE',
        safetyScore: Number(row.safety_score || 0),
        dataOrigin: 'SIMULATED',
        confidence: 0.98,
        uncertaintyFlags,
      });
    }

    await client.query('COMMIT');
    logger.info({ sitesEvaluated: assessments.length }, 'Phase 7 Site Capacity assessment completed.');
    return assessments;
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error({ err }, 'Failed to evaluate site capacities.');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Seeds and synchronizes relocation demand nodes.
 * Explicitly links REAL district AI priorities (Chamoli RPW = 0.7109)
 * with SIMULATED benchmark planning sector demand nodes.
 */
export async function synchronizeRelocationDemands(): Promise<RelocationDemandNode[]> {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Fetch Chamoli canonical district and AI priority weight
    const districtRes = await client.query(`
      SELECT 
        cd.id AS district_id,
        cd.district_name,
        cd.state_name,
        rp.priority_weight,
        rp.tier AS operational_tier,
        ra.calibrated_risk_probability,
        ra.vulnerability_score,
        ra.urgency_score
      FROM canonical_districts cd
      LEFT JOIN relocation_priorities rp ON rp.canonical_district_id = cd.id
      LEFT JOIN risk_assessments ra ON ra.canonical_district_id = cd.id
      WHERE cd.district_name ILIKE '%Chamoli%'
      LIMIT 1;
    `);

    const districtRow = districtRes.rows[0];
    const baseRpw = districtRow ? Number(districtRow.priority_weight || 0.7109) : 0.7109;
    const baseTier = (districtRow?.operational_tier as 'immediate' | 'short-term' | 'medium-term') || 'immediate';
    const canonicalDistrictId = districtRow?.district_id || null;

    // Fetch simulated habitations
    const habsRes = await client.query(`
      SELECT 
        h.id,
        h.name,
        h.district,
        h.state,
        h.latitude,
        h.longitude,
        hp.population,
        hp.households,
        hp.elderly_population,
        hp.children_population,
        hp.disabled_population
      FROM habitations h
      LEFT JOIN habitation_populations hp ON hp.habitation_id = h.id
      WHERE h.name LIKE '%(SIMULATED)%'
      ORDER BY h.name;
    `);

    // Specific local hazard vulnerabilities for Chamoli benchmark sectors
    const localProfiles: Record<string, { code: string; hazardDesc: string; weightOffset: number }> = {
      'Joshimath High Risk Sector (SIMULATED)': {
        code: 'DEMAND-JOSHIMATH-01',
        hazardDesc: 'Joshimath Active Subsidence Core Zone (High land depression risk)',
        weightOffset: 0.05, // 0.7109 + 0.05 = 0.7609
      },
      'Malari Upper Valley Sector (SIMULATED)': {
        code: 'DEMAND-MALARI-02',
        hazardDesc: 'Malari Upper Valley Debris Flow & Avalanche Corridor',
        weightOffset: 0.03, // 0.7109 + 0.03 = 0.7409
      },
      'Tharali Riverine Sector (SIMULATED)': {
        code: 'DEMAND-THARALI-03',
        hazardDesc: 'Alaknanda & Pindar River Flash Flood Inundation Setback',
        weightOffset: 0.00, // 0.7109
      },
      'Ghat Lowland Zone (SIMULATED)': {
        code: 'DEMAND-GHAT-04',
        hazardDesc: 'Nandakini River Lowland Siltation & Flash Washout Area',
        weightOffset: -0.02, // 0.6909
      },
      'Gwaldam Valley Slope (SIMULATED)': {
        code: 'DEMAND-GWALDAM-05',
        hazardDesc: 'Kumaon Border Valley Mountain Slope Instability',
        weightOffset: -0.04, // 0.6709
      },
    };

    const demandNodes: RelocationDemandNode[] = [];

    for (const hab of habsRes.rows) {
      const profile = localProfiles[hab.name] || {
        code: `DEMAND-${hab.name.substring(0, 8).toUpperCase()}`,
        hazardDesc: 'Identified Mountain Hazard Corridor',
        weightOffset: 0.0,
      };

      const pop = Number(hab.population) || 2500;
      const nodeRpw = Math.min(1.0, Math.max(0.0, Number((baseRpw + profile.weightOffset).toFixed(4))));
      const demandNodeId = profile.code;

      const uncertaintyFlags = [
        'MICRO_PLANNING_SECTOR_SIMULATED',
        'CENSUS_MICRO_EXTRAPOLATION',
        'BENCHMARK_DEMAND_NOT_STATUTORY_ORDER',
      ];

      const geomWkt = `SRID=4326;POINT(${hab.longitude} ${hab.latitude})`;

      // Insert or Update relocation_demands
      await client.query(`
        INSERT INTO relocation_demands (
          demand_node_id, habitation_id, canonical_district_id, node_name,
          district_name, state_name, total_population, relocation_demand,
          priority_weight, operational_tier, demand_derivation_method,
          data_origin, population_source, hazard_exposure_status,
          uncertainty_flags, geometry, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, ST_GeomFromEWKT($16), NOW()
        )
        ON CONFLICT (demand_node_id) DO UPDATE SET
          habitation_id = EXCLUDED.habitation_id,
          canonical_district_id = EXCLUDED.canonical_district_id,
          node_name = EXCLUDED.node_name,
          total_population = EXCLUDED.total_population,
          relocation_demand = EXCLUDED.relocation_demand,
          priority_weight = EXCLUDED.priority_weight,
          operational_tier = EXCLUDED.operational_tier,
          demand_derivation_method = EXCLUDED.demand_derivation_method,
          data_origin = EXCLUDED.data_origin,
          population_source = EXCLUDED.population_source,
          hazard_exposure_status = EXCLUDED.hazard_exposure_status,
          uncertainty_flags = EXCLUDED.uncertainty_flags,
          geometry = EXCLUDED.geometry,
          updated_at = NOW();
      `, [
        demandNodeId,
        hab.id,
        canonicalDistrictId,
        hab.name,
        hab.district || 'Chamoli',
        hab.state || 'Uttarakhand',
        pop,
        pop, // 100% of benchmark high-risk sector is designated for planned relocation
        nodeRpw,
        baseTier,
        'BENCHMARK_HABITATION',
        'SIMULATED',
        'BENCHMARK_CENSUS',
        profile.hazardDesc,
        uncertaintyFlags,
        geomWkt,
      ]);

      demandNodes.push({
        demandNodeId,
        habitationId: hab.id,
        canonicalDistrictId,
        nodeName: hab.name,
        districtName: hab.district || 'Chamoli',
        stateName: hab.state || 'Uttarakhand',
        totalPopulation: pop,
        relocationDemand: pop,
        priorityWeight: nodeRpw,
        operationalTier: baseTier,
        demandDerivationMethod: 'BENCHMARK_HABITATION',
        dataOrigin: 'SIMULATED',
        populationSource: 'BENCHMARK_CENSUS',
        hazardExposureStatus: profile.hazardDesc,
        uncertaintyFlags,
        latitude: Number(hab.latitude),
        longitude: Number(hab.longitude),
      });
    }

    await client.query('COMMIT');
    logger.info({ demandNodesCount: demandNodes.length }, 'Phase 7 Relocation Demand nodes synchronized.');
    return demandNodes;
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error({ err }, 'Failed to synchronize relocation demand nodes.');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Returns all active relocation demand nodes from the database.
 */
export async function getRelocationDemandNodes(): Promise<RelocationDemandNode[]> {
  const result = await pool.query(`
    SELECT 
      id,
      demand_node_id AS "demandNodeId",
      habitation_id AS "habitationId",
      canonical_district_id AS "canonicalDistrictId",
      node_name AS "nodeName",
      district_name AS "districtName",
      state_name AS "stateName",
      total_population AS "totalPopulation",
      relocation_demand AS "relocationDemand",
      priority_weight AS "priorityWeight",
      operational_tier AS "operationalTier",
      demand_derivation_method AS "demandDerivationMethod",
      data_origin AS "dataOrigin",
      population_source AS "populationSource",
      hazard_exposure_status AS "hazardExposureStatus",
      uncertainty_flags AS "uncertaintyFlags",
      ST_Y(geometry) AS latitude,
      ST_X(geometry) AS longitude
    FROM relocation_demands
    ORDER BY priority_weight DESC;
  `);

  if (result.rowCount === 0) {
    // If table empty, synchronize first
    return await synchronizeRelocationDemands();
  }

  return result.rows;
}

/**
 * Returns complete capacity assessment for all candidate sites.
 */
export async function getSiteCapacityAssessments(): Promise<SiteCapacityAssessment[]> {
  const result = await pool.query(`
    SELECT 
      s.id AS "siteId",
      s.name AS "siteName",
      r.district,
      s.type AS "siteType",
      sc.hard_hazard_exclusion AS "insideRedZone",
      sc.hard_hazard_exclusion AS "hardHazardExclusion",
      sc.nominal_capacity AS "nominalCapacity",
      sc.effective_capacity AS "effectiveCapacity",
      CASE WHEN sc.hard_hazard_exclusion THEN 0 ELSE sc.effective_capacity END AS "usableCapacity",
      sc.available_capacity AS "availableCapacity",
      sc.current_occupancy AS "currentOccupancy",
      sc.utilization_percent AS "utilizationPercent",
      sc.bottleneck_dimension AS "bottleneckDimension",
      sc.bottleneck_value AS "bottleneckValue",
      sc.limiting_factor AS "limitingFactor",
      sc.capacity_status AS "capacityStatus",
      sc.physical_capacity AS "physical",
      sc.water_capacity AS "water",
      sc.shelter_capacity AS "shelter",
      sc.sanitation_capacity AS "sanitation",
      sc.healthcare_capacity AS "healthcare",
      sc.electricity_capacity AS "electricity",
      sc.access_capacity AS "access",
      ssa.suitability_score AS "suitabilityScore",
      ssa.suitability_tier AS "suitabilityTier",
      ssa.safety_score AS "safetyScore",
      sc.data_origin AS "dataOrigin",
      sc.confidence,
      sc.uncertainty_flags AS "uncertaintyFlags"
    FROM relocation_sites s
    LEFT JOIN regions r ON r.id = s.region_id
    JOIN site_capacities sc ON sc.site_id = s.id
    LEFT JOIN site_suitability_assessments ssa ON ssa.site_id = s.id
    ORDER BY s.name ASC;
  `);

  if (result.rowCount === 0) {
    return await evaluateAllSiteCapacities();
  }

  return result.rows.map(r => ({
    siteId: r.siteId,
    siteName: r.siteName,
    district: r.district || 'Chamoli',
    siteType: r.siteType,
    insideRedZone: Boolean(r.insideRedZone),
    hardHazardExclusion: Boolean(r.hardHazardExclusion),
    nominalCapacity: Number(r.nominalCapacity || r.physical),
    effectiveCapacity: Number(r.effectiveCapacity),
    usableCapacity: Number(r.usableCapacity),
    availableCapacity: Number(r.availableCapacity),
    currentOccupancy: Number(r.currentOccupancy),
    utilizationPercent: Number(r.utilizationPercent),
    bottleneckDimension: r.bottleneckDimension || 'sanitation',
    bottleneckValue: Number(r.bottleneckValue || r.effectiveCapacity),
    limitingFactor: r.limitingFactor,
    capacityStatus: r.capacityStatus,
    resourceBreakdown: {
      physical: Number(r.physical),
      water: Number(r.water),
      shelter: Number(r.shelter),
      sanitation: Number(r.sanitation),
      healthcare: Number(r.healthcare),
      electricity: Number(r.electricity),
      access: Number(r.access),
    },
    suitabilityScore: Number(r.suitabilityScore || 0),
    suitabilityTier: r.suitabilityTier || 'CONDITIONALLY_SUITABLE',
    safetyScore: Number(r.safetyScore || 0),
    dataOrigin: 'SIMULATED',
    confidence: Number(r.confidence || 0.98),
    uncertaintyFlags: r.uncertaintyFlags || [],
  }));
}

/**
 * Returns comprehensive aggregate capacity metrics.
 */
export async function getCapacitySummary(): Promise<CapacitySummary> {
  const demands = await getRelocationDemandNodes();
  const sites = await getSiteCapacityAssessments();

  const totalDemand = demands.reduce((acc, d) => acc + d.relocationDemand, 0);
  const totalNominal = sites.reduce((acc, s) => acc + s.nominalCapacity, 0);
  const totalSafeEffective = sites
    .filter(s => !s.hardHazardExclusion)
    .reduce((acc, s) => acc + s.effectiveCapacity, 0);
  const totalRestricted = sites
    .filter(s => s.hardHazardExclusion)
    .reduce((acc, s) => acc + s.effectiveCapacity, 0);

  const netBalance = totalSafeEffective - totalDemand;
  const isDeficit = netBalance < 0;

  const bottleneckDist: Record<string, number> = {};
  for (const s of sites) {
    bottleneckDist[s.bottleneckDimension] = (bottleneckDist[s.bottleneckDimension] || 0) + 1;
  }

  const tierDemand = {
    immediate: 0,
    shortTerm: 0,
    mediumTerm: 0,
  };
  for (const d of demands) {
    if (d.operationalTier === 'immediate') tierDemand.immediate += d.relocationDemand;
    else if (d.operationalTier === 'short-term') tierDemand.shortTerm += d.relocationDemand;
    else tierDemand.mediumTerm += d.relocationDemand;
  }

  return {
    totalDemandPopulation: totalDemand,
    totalSafeEffectiveCapacity: totalSafeEffective,
    totalNominalCapacity: totalNominal,
    totalRestrictedCapacity: totalRestricted,
    netCapacityBalance: netBalance,
    isDeficit,
    siteCount: sites.length,
    safeSiteCount: sites.filter(s => !s.hardHazardExclusion).length,
    restrictedSiteCount: sites.filter(s => s.hardHazardExclusion).length,
    bottleneckDistribution: bottleneckDist,
    operationalTierDemand: tierDemand,
    dataOrigin: 'SIMULATED_BENCHMARK',
    uncertaintyNotes: [
      'All candidate sites are simulated benchmark facilities for Chamoli planning demonstration (SIMULATED_BENCHMARK).',
      'Healthcare bed numbers in national directory are quarantined; candidate sites use simulated benchmark disaster triage capacities (SIMULATED_BENCHMARK), not observed facility bed counts.',
      'Cartosat-1 DEM terrain slope is unavailable for Chamoli; neutral heuristic slope factor applied with TERRAIN_ELEVATION_UNAVAILABLE audit flag.',
      'Pipalkoti Transit Shelter Hub is inside GIS-derived active hazard zone; decision-support model enforces hard hazard exclusion (usable capacity after hazard exclusion = 0). This is a decision-support calculation, not a statutory legal designation.',
    ],
  };
}
