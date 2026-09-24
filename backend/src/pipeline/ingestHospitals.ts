/**
 * VISTHAAPAN Hospital Directory & Healthcare Infrastructure Ingestion Service.
 * Ingests 30,000+ facilities, parses geospatial coordinates, enforces bed corruption guards,
 * and generates district-level healthcare profiles.
 */

import fs from 'fs';
import readline from 'readline';
import path from 'path';
import crypto from 'crypto';
import { PoolClient } from 'pg';
import { getClient } from '../db/pool.js';
import { logger } from '../utils/logger.js';
import {
  getOrCreateDataSource,
  getOrCreateDataset,
  getOrCreateDatasetVersion,
  startProcessingRun,
  completeProcessingRun,
  recordDataQuality,
} from './provenance.js';
import { CanonicalDistrictIndex, CanonicalDistrictRecord } from './districtAliases.js';

export interface HospitalIngestionSummary {
  versionNumber: string;
  totalRecordsRead: number;
  hospitalsInserted: number;
  geocodedCount: number;
  suspiciousBedCount: number;
  profilesGenerated: number;
  fileHash: string;
  durationMs: number;
}

interface ParsedHospital {
  srNo: number | null;
  name: string;
  stateRaw: string;
  districtRaw: string;
  category: string | null;
  careType: string | null;
  rawCoords: string | null;
  latitude: number | null;
  longitude: number | null;
  hasValidCoords: boolean;
  hasEmergency: boolean;
  hasAmbulance: boolean;
  rawBedCount: string | null;
  isBedSuspicious: boolean;
  pincode: string | null;
  canonicalDistrictId: string | null;
}

export async function ingestHospitals(csvPath?: string): Promise<HospitalIngestionSummary> {
  const startTime = Date.now();
  const filePath = csvPath ?? path.resolve(process.cwd(), 'data/hospital_directory.csv');

  if (!fs.existsSync(filePath)) {
    throw new Error(`Hospital Directory CSV not found: ${filePath}`);
  }

  logger.info({ filePath }, 'Starting Hospital Directory ingestion...');

  const fileBuffer = fs.readFileSync(filePath);
  const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  const versionNumber = `v2026-HOSPITAL-DIR-${fileHash.slice(0, 8)}`;

  const client: PoolClient = await getClient();

  try {
    await client.query('BEGIN');

    // 1. Provenance Registration
    const sourceId = await getOrCreateDataSource(client, {
      datasetName: 'National Hospital Directory',
      sourceOrganization: 'National Health Portal / Ministry of Health and Family Welfare (MoHFW)',
      sourceType: 'GOVERNMENT_HEALTH_FACILITY_DIRECTORY',
      sourceUrl: 'https://data.gov.in',
      coverage: 'All India Public and Private Healthcare Facilities',
      confidence: 0.90,
      description: 'Authoritative national directory of healthcare institutions, categories, and locations',
    });

    const datasetId = await getOrCreateDataset(client, {
      sourceId,
      name: 'National Healthcare Facility Directory',
      description: 'Hospital directory records with geocodes, facility types, and infrastructure indicators',
      dataType: 'HEALTHCARE_INFRASTRUCTURE',
      format: 'CSV',
      coverage: 'National Facility Level',
    });

    const { id: datasetVersionId } = await getOrCreateDatasetVersion(client, {
      datasetId,
      versionNumber,
      recordCount: 30273,
      qualityScore: 0.88,
      processingNotes: 'Hospital directory ingested with corrupted bed counts quarantined and coordinates validated',
    });

    const runId = await startProcessingRun(client, {
      datasetVersionId,
      processType: 'hospital-directory-ingestion',
      recordsInput: 30273,
    });

    // Enforce idempotency: clear prior records for this dataset version if re-running
    await client.query('DELETE FROM hospitals WHERE dataset_version_id = $1', [datasetVersionId]);

    // 2. Load Canonical District Index
    const cdRes = await client.query(`
      SELECT id, state_code AS "stateCode", state_name AS "stateName",
             state_census2011_code AS "stateCensus2011Code",
             district_code AS "districtCode", district_name AS "districtName",
             district_census2011_code AS "districtCensus2011Code"
      FROM canonical_districts
    `);
    const canonicalIndex = new CanonicalDistrictIndex(cdRes.rows as CanonicalDistrictRecord[]);

    // 3. Stream & Parse CSV
    const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let lineCount = 0;
    let headerFields: string[] = [];
    const batch: ParsedHospital[] = [];
    const BATCH_SIZE = 500;

    let totalInserted = 0;
    let geocodedCount = 0;
    let suspiciousBedCount = 0;

    // Track identity mappings per distinct (State, District) pair
    const identityMappings = new Map<string, {
      sourceState: string;
      sourceDistrict: string;
      canonicalDistrictId: string | null;
      mappingStatus: string;
      mappingMethod: string;
      confidence: number;
      notes: string;
    }>();

    // Helper to insert a batch into hospitals table
    const flushBatch = async (items: ParsedHospital[]) => {
      if (items.length === 0) return;

      const valueRows: string[] = [];
      const values: any[] = [];
      let paramIdx = 1;

      for (const h of items) {
        const geomWkt = h.hasValidCoords && h.longitude !== null && h.latitude !== null
          ? `POINT(${h.longitude} ${h.latitude})`
          : null;

        const rowParams = [
          h.canonicalDistrictId,
          datasetVersionId,
          h.srNo,
          h.name,
          h.stateRaw,
          h.districtRaw,
          h.category,
          h.careType,
          h.rawCoords,
          h.latitude,
          h.longitude,
          geomWkt,
          h.hasValidCoords,
          h.hasEmergency,
          h.hasAmbulance,
          h.rawBedCount,
          h.isBedSuspicious,
          h.pincode,
        ];

        const placeholders: string[] = [];
        for (let p = 0; p < rowParams.length; p++) {
          if (p === 11) {
            // geometry slot
            placeholders.push(`ST_GeomFromText($${paramIdx++}, 4326)`);
          } else {
            placeholders.push(`$${paramIdx++}`);
          }
        }
        values.push(...rowParams);
        valueRows.push(`(${placeholders.join(', ')})`);
      }

      const sql = `
        INSERT INTO hospitals (
          canonical_district_id, dataset_version_id, source_sr_no, hospital_name,
          state_raw, district_raw, hospital_category, hospital_care_type,
          raw_location_coordinates, latitude, longitude, geometry,
          has_valid_coordinates, has_emergency_services, has_ambulance,
          raw_bed_count, is_bed_count_suspicious, pincode
        ) VALUES ${valueRows.join(', ')}
      `;

      await client.query(sql, values);
      totalInserted += items.length;
    };

    // Helper to parse CSV line preserving quotes and embedded commas
    const parseCsvLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    for await (const rawLine of rl) {
      lineCount++;
      const line = rawLine.replace(/^\ufeff/, '').trim();
      if (!line) continue;

      if (lineCount === 1) {
        headerFields = parseCsvLine(line).map((h) => h.replace(/^"|"$/g, ''));
        continue;
      }

      const cols = parseCsvLine(line).map((c) => c.replace(/^"|"$/g, ''));
      if (cols.length < 5) continue;

      const row: Record<string, string> = {};
      for (let i = 0; i < headerFields.length; i++) {
        row[headerFields[i]] = cols[i] || '';
      }

      const stateRaw = row['State'] || '';
      const distRaw = row['District'] || '';
      const pairKey = `${stateRaw.toLowerCase().trim()}::${distRaw.toLowerCase().trim()}`;

      let matchRes = identityMappings.get(pairKey);
      if (!matchRes) {
        const resolved = canonicalIndex.matchByName(stateRaw, distRaw);
        matchRes = {
          sourceState: stateRaw,
          sourceDistrict: distRaw,
          canonicalDistrictId: resolved.canonicalDistrictId || null,
          mappingStatus: resolved.mappingStatus,
          mappingMethod: resolved.mappingMethod,
          confidence: resolved.confidence,
          notes: resolved.notes,
        };
        identityMappings.set(pairKey, matchRes);
      }

      // Parse coordinates
      const coordStr = row['Location_Coordinates'] || '';
      let lat: number | null = null;
      let lon: number | null = null;
      let hasValidCoords = false;

      if (coordStr && coordStr.includes(',')) {
        const parts = coordStr.split(',');
        const pLat = parseFloat(parts[0].trim());
        const pLon = parseFloat(parts[1].trim());

        if (
          !isNaN(pLat) &&
          !isNaN(pLon) &&
          pLat >= -90 &&
          pLat <= 90 &&
          pLon >= -180 &&
          pLon <= 180 &&
          (pLat !== 0 || pLon !== 0)
        ) {
          lat = Number(pLat.toFixed(6));
          lon = Number(pLon.toFixed(6));
          hasValidCoords = true;
          geocodedCount++;
        }
      }

      // Emergency & Ambulance services
      const emgSrv = row['Emergency_Services']?.trim();
      const emgNum = row['Emergency_Num']?.trim();
      const hasEmergency = (emgSrv && emgSrv !== '0') || (emgNum && emgNum !== '0');

      const ambPhone = row['Ambulance_Phone_No']?.trim();
      const hasAmbulance =
        Boolean(ambPhone) &&
        ambPhone !== '0' &&
        ambPhone.toLowerCase() !== 'no' &&
        ambPhone.toLowerCase() !== 'na';

      // Bed count analysis: flag corrupt beds (> 5000 / 0 / blank / non-numeric)
      const rawBeds = row['Total_Num_Beds']?.trim();
      let isBedSuspicious = true;
      if (rawBeds && rawBeds !== '0') {
        const numBeds = parseFloat(rawBeds);
        if (!isNaN(numBeds) && numBeds > 0 && numBeds <= 5000) {
          isBedSuspicious = false;
        }
      }
      if (isBedSuspicious) {
        suspiciousBedCount++;
      }

      const srNoVal = parseInt(row['Sr_No'] || '0', 10);

      batch.push({
        srNo: !isNaN(srNoVal) && srNoVal > 0 ? srNoVal : null,
        name: (row['Hospital_Name'] || 'Unnamed Facility').slice(0, 255),
        stateRaw: stateRaw.slice(0, 100),
        districtRaw: distRaw.slice(0, 100),
        category: row['Hospital_Category'] ? row['Hospital_Category'].slice(0, 100) : null,
        careType: row['Hospital_Care_Type'] ? row['Hospital_Care_Type'].slice(0, 100) : null,
        rawCoords: coordStr ? coordStr.slice(0, 100) : null,
        latitude: lat,
        longitude: lon,
        hasValidCoords,
        hasEmergency: Boolean(hasEmergency),
        hasAmbulance: Boolean(hasAmbulance),
        rawBedCount: rawBeds ? rawBeds.slice(0, 50) : null,
        isBedSuspicious,
        pincode: row['Pincode'] ? row['Pincode'].slice(0, 20) : null,
        canonicalDistrictId: matchRes.canonicalDistrictId,
      });

      if (batch.length >= BATCH_SIZE) {
        await flushBatch(batch);
        batch.length = 0;
      }
    }

    if (batch.length > 0) {
      await flushBatch(batch);
      batch.length = 0;
    }

    // 4. Save distinct identity mappings into district_identity_mappings
    for (const mapping of identityMappings.values()) {
      if (!mapping.sourceState && !mapping.sourceDistrict) continue;
      await client.query(
        `INSERT INTO district_identity_mappings (
          source_dataset, source_state, source_district, canonical_district_id,
          mapping_status, mapping_method, confidence, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (source_dataset, source_state, source_district) DO UPDATE SET
          canonical_district_id = EXCLUDED.canonical_district_id,
          mapping_status = EXCLUDED.mapping_status,
          mapping_method = EXCLUDED.mapping_method,
          confidence = EXCLUDED.confidence,
          notes = EXCLUDED.notes;`,
        [
          'HOSPITAL_DIRECTORY',
          mapping.sourceState,
          mapping.sourceDistrict,
          mapping.canonicalDistrictId,
          mapping.mappingStatus,
          mapping.mappingMethod,
          mapping.confidence,
          mapping.notes,
        ]
      );
    }

    // 5. Aggregate into district_healthcare_profiles
    const profileRes = await client.query(
      `INSERT INTO district_healthcare_profiles (
        canonical_district_id, dataset_version_id,
        hospital_count, geocoded_hospital_count,
        government_hospital_count, private_hospital_count,
        emergency_service_hospital_count, ambulance_available_hospital_count,
        geocoded_hospital_share, emergency_hospital_share, ambulance_hospital_share
      )
      SELECT
        cd.id AS canonical_district_id,
        $1::uuid AS dataset_version_id,
        COUNT(h.id)::int AS hospital_count,
        COUNT(h.id) FILTER (WHERE h.has_valid_coordinates = true)::int AS geocoded_hospital_count,
        COUNT(h.id) FILTER (WHERE h.hospital_category ILIKE '%government%' OR h.hospital_category ILIKE '%public%')::int AS government_hospital_count,
        COUNT(h.id) FILTER (WHERE h.hospital_category ILIKE '%private%')::int AS private_hospital_count,
        COUNT(h.id) FILTER (WHERE h.has_emergency_services = true)::int AS emergency_service_hospital_count,
        COUNT(h.id) FILTER (WHERE h.has_ambulance = true)::int AS ambulance_available_hospital_count,
        CASE WHEN COUNT(h.id) > 0 THEN ROUND((COUNT(h.id) FILTER (WHERE h.has_valid_coordinates = true))::numeric / COUNT(h.id), 4) ELSE NULL END AS geocoded_hospital_share,
        CASE WHEN COUNT(h.id) > 0 THEN ROUND((COUNT(h.id) FILTER (WHERE h.has_emergency_services = true))::numeric / COUNT(h.id), 4) ELSE NULL END AS emergency_hospital_share,
        CASE WHEN COUNT(h.id) > 0 THEN ROUND((COUNT(h.id) FILTER (WHERE h.has_ambulance = true))::numeric / COUNT(h.id), 4) ELSE NULL END AS ambulance_hospital_share
      FROM canonical_districts cd
      JOIN hospitals h ON h.canonical_district_id = cd.id AND h.dataset_version_id = $1::uuid
      GROUP BY cd.id
      ON CONFLICT (canonical_district_id, dataset_version_id) DO UPDATE SET
        hospital_count = EXCLUDED.hospital_count,
        geocoded_hospital_count = EXCLUDED.geocoded_hospital_count,
        government_hospital_count = EXCLUDED.government_hospital_count,
        private_hospital_count = EXCLUDED.private_hospital_count,
        emergency_service_hospital_count = EXCLUDED.emergency_service_hospital_count,
        ambulance_available_hospital_count = EXCLUDED.ambulance_available_hospital_count,
        geocoded_hospital_share = EXCLUDED.geocoded_hospital_share,
        emergency_hospital_share = EXCLUDED.emergency_hospital_share,
        ambulance_hospital_share = EXCLUDED.ambulance_hospital_share;`,
      [datasetVersionId]
    );

    const profilesGenerated = profileRes.rowCount || 0;

    // 6. Complete Processing Run and Data Quality
    await completeProcessingRun(client, runId, {
      recordsOutput: totalInserted,
      recordsRejected: lineCount - 1 - totalInserted,
      errorCount: 0,
      processingLog: `Ingested ${totalInserted} hospitals (${geocodedCount} geocoded, ${suspiciousBedCount} suspicious bed counts flagged). Generated ${profilesGenerated} district healthcare profiles.`,
    });

    await recordDataQuality(client, {
      datasetVersionId,
      completenessPercent: (totalInserted / 30273) * 100.0,
      spatialCoveragePercent: (geocodedCount / totalInserted) * 100.0,
      invalidRecords: 0,
      duplicateRecords: 0,
      overallConfidence: 0.90,
      missingFields: ['corrupted_total_num_beds'],
    });

    await client.query('COMMIT');

    const durationMs = Date.now() - startTime;
    logger.info(
      { totalInserted, geocodedCount, suspiciousBedCount, profilesGenerated, durationMs },
      'Hospital Directory ingested successfully.'
    );

    return {
      versionNumber,
      totalRecordsRead: lineCount - 1,
      hospitalsInserted: totalInserted,
      geocodedCount,
      suspiciousBedCount,
      profilesGenerated,
      fileHash,
      durationMs,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error }, 'Failed to ingest Hospital Directory');
    throw error;
  } finally {
    client.release();
  }
}
