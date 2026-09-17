/**
 * VISTHAAPAN Canonical District Identifier & Controlled Alias Normalizer.
 * Maps state + district strings across NDEM, Census 2011, and Hospital Directory
 * to canonical district identities.
 */

export type MappingStatus = 'EXACT' | 'NORMALIZED_EXACT' | 'CONTROLLED_ALIAS' | 'UNMATCHED' | 'AMBIGUOUS';
export type MappingMethod = 'CODE_MATCH' | 'EXACT_NAME' | 'NORMALIZED_NAME' | 'ALIAS_LOOKUP' | 'UNRESOLVED';

export interface DistrictMatchResult {
  canonicalDistrictId?: string;
  canonicalDistrictName?: string;
  canonicalStateName?: string;
  mappingStatus: MappingStatus;
  mappingMethod: MappingMethod;
  confidence: number;
  notes: string;
}

export interface CanonicalDistrictRecord {
  id: string;
  stateCode: string;
  stateName: string;
  stateCensus2011Code: string | null;
  districtCode: string;
  districtName: string;
  districtCensus2011Code: string | null;
}

/**
 * Normalizes string for matching (lowercases, removes brackets, trailing spaces, extra punctuation).
 */
export function normalizeKey(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[()[\]{}]/g, ' ')
    .replace(/[._\-/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Controlled administrative alias lookup table:
 * key: "normalized_state::normalized_source_district"
 * value: "Canonical District Name in District Master"
 */
export const CONTROLLED_DISTRICT_ALIASES: Record<string, string> = {
  // Andhra Pradesh
  'andhra pradesh::anantapur': 'Ananthapuramu',
  'andhra pradesh::anantapuram': 'Ananthapuramu',
  'andhra pradesh::anantapuramu': 'Ananthapuramu',
  'andhra pradesh::cuddapah': 'Y.S.R.',
  'andhra pradesh::kadapa': 'Y.S.R.',
  'andhra pradesh::ysr': 'Y.S.R.',
  'andhra pradesh::ysr kadapa': 'Y.S.R.',
  'andhra pradesh::ysr district': 'Y.S.R.',
  'andhra pradesh::chittoor': 'Chittoor',
  'andhra pradesh::nellore': 'Sri Potti Sriramulu Nellore',
  'andhra pradesh::spsr nellore': 'Sri Potti Sriramulu Nellore',

  // Arunachal Pradesh
  'arunachal pradesh::papumpare': 'Papum Pare',
  'arunachal pradesh::papum pare': 'Papum Pare',
  'arunachal pradesh::lepa rada': 'Leparada',
  'arunachal pradesh::leparada': 'Leparada',

  // Assam
  'assam::marigaon': 'Morigaon',
  'assam::sibsagar': 'Sivasagar',
  'assam::darang': 'Darrang',
  'assam::darrang': 'Darrang',
  'assam::kamrup metro': 'Kamrup Metro',
  'assam::kamrup metropolitan': 'Kamrup Metro',
  'assam::kamrup rural': 'Kamrup',

  // Bihar
  'bihar::pashchimi champaran': 'Pashchim Champaran',
  'bihar::west champaran': 'Pashchim Champaran',
  'bihar::east champaran': 'Purbi Champaran',
  'bihar::jahanabad': 'Jehanabad',
  'bihar::jehanabad': 'Jehanabad',
  'bihar::kaimur': 'Kaimur (Bhabua)',
  'bihar::bhabua': 'Kaimur (Bhabua)',
  'bihar::muzzffarpur': 'Muzaffarpur',

  // Chhattisgarh
  'chhattisgarh::balrampur': 'Balrampur-Ramanujganj',
  'chhattisgarh::balrampur ramanujganj': 'Balrampur-Ramanujganj',
  'chhattisgarh::kanker': 'Uttar Bastar Kanker',
  'chhattisgarh::dantewada': 'Dakshin Bastar Dantewada',
  'chhattisgarh::dakshin bastar dantewara': 'Dakshin Bastar Dantewada',
  'chhattisgarh::janjgir champa': 'Janjgir - Champa',
  'chhattisgarh::koriya': 'Korea',
  'chhattisgarh::korea': 'Korea',
  'chhattisgarh::kabirdham': 'Kabeerdham',
  'chhattisgarh::kawardha kabirdham': 'Kabeerdham',
  'chhattisgarh::kawardha': 'Kabeerdham',
  'chhattisgarh::baloda bazar': 'Balodabazar-Bhatapara',
  'chhattisgarh::baloda bazar bhatapara': 'Balodabazar-Bhatapara',
  'chhattisgarh::manendragarh chirmiri bharatpur': 'Manendragarh-Chirmiri-Bharatpur(M C B)',
  'chhattisgarh::mohla manpur ambagarh chowki': 'Mohla-Manpur-Ambagarh Chouki',
  'chhattisgarh::khairgarh chhuikhadan gandai': 'Khairagarh-Chhuikhadan-Gandai',

  // Delhi
  'delhi::shahadara': 'Shahdara',

  // Gujarat
  'gujarat::panchmahal': 'Panch Mahals',
  'gujarat::panchmahals': 'Panch Mahals',
  'gujarat::ahmedabad': 'Ahmedabad',
  'gujarat::ahmadabad': 'Ahmedabad',
  'gujarat::sabarkantha': 'Sabar Kantha',
  'gujarat::banaskantha': 'Banas Kantha',
  'gujarat::mehsana': 'Mahesana',
  'gujarat::dang': 'Dangs',
  'gujarat::dangs': 'Dangs',

  // Haryana
  'haryana::mewat': 'Nuh',
  'haryana::gurgaon': 'Gurugram',
  'haryana::mohindergarh': 'Mahendragarh',
  'haryana::sonipat': 'Sonipat',

  // Himachal Pradesh
  'himachal pradesh::lahul & spiti': 'Lahaul And Spiti',
  'himachal pradesh::lahul and spiti': 'Lahaul And Spiti',
  'himachal pradesh::lahaul spiti': 'Lahaul And Spiti',

  // Jammu and Kashmir & Ladakh
  'jammu and kashmir::baramula': 'Baramulla',
  'jammu and kashmir::badgam': 'Budgam',
  'jammu and kashmir::punch': 'Poonch',
  'jammu and kashmir::shupiyan': 'Shopian',
  'jammu and kashmir::bandipore': 'Bandipora',
  'jammu and kashmir::bandipura': 'Bandipora',
  'jammu and kashmir::rajauri': 'Rajouri',
  'jammu and kashmir::riasi': 'Reasi',
  'jammu and kashmir::leh(ladakh)': 'Leh Ladakh',
  'jammu and kashmir::leh ladakh': 'Leh Ladakh',
  'ladakh::leh(ladakh)': 'Leh Ladakh',
  'ladakh::leh': 'Leh Ladakh',
  'ladakh::kargil': 'Kargil',

  // Jharkhand
  'jharkhand::east singhbhum': 'East Singhbum',
  'jharkhand::west singhbhum': 'West Singhbhum',
  'jharkhand::saraikela kharsawan': 'Saraikela Kharsawan',
  'jharkhand::seraikela kharsawan': 'Saraikela Kharsawan',
  'jharkhand::seraikella kharsawan': 'Saraikela Kharsawan',
  'jharkhand::hazaribag': 'Hazaribagh',
  'jharkhand::sahibganj': 'Sahebganj',

  // Karnataka
  'karnataka::bagalkot': 'Bagalkote',
  'karnataka::bijapur': 'Vijayapura',
  'karnataka::gulbarga': 'Kalaburagi',
  'karnataka::belgaum': 'Belagavi',
  'karnataka::bellary': 'Ballari',
  'karnataka::mysore': 'Mysuru',
  'karnataka::shimoga': 'Shivamogga',
  'karnataka::chikmagalur': 'Chikkamagaluru',
  'karnataka::chikkamagaluru': 'Chikkamagaluru',
  'karnataka::tumkur': 'Tumakuru',
  'karnataka::davanagere': 'Davangere',
  'karnataka::chamarajanagar': 'Chamarajanagara',
  'karnataka::chamrajnagar': 'Chamarajanagara',
  'karnataka::chikkaballapur': 'Chikkaballapura',
  'karnataka::ramanagar': 'Ramanagara',
  'karnataka::kolara': 'Kolar',
  'karnataka::b dar': 'Bidar',
  'karnataka::b\\dar': 'Bidar',
  'karnataka::vijayanagara': 'Vijayanagar',

  // Lakshadweep
  'lakshadweep::lakshadweep': 'Lakshadweep District',

  // Madhya Pradesh
  'madhya pradesh::khandwa': 'Khandwa (East Nimar)',
  'madhya pradesh::east nimar': 'Khandwa (East Nimar)',
  'madhya pradesh::khargone': 'Khargone (West Nimar)',
  'madhya pradesh::west nimar': 'Khargone (West Nimar)',
  'madhya pradesh::hoshangabad': 'Narmadapuram',
  'madhya pradesh::narsinghpur': 'Narsimhapur',
  'madhya pradesh::narsimhapur': 'Narsimhapur',
  'madhya pradesh::shadol': 'Shahdol',
  'madhya pradesh::burahanpur': 'Burhanpur',

  // Maharashtra
  'maharashtra::ahmednagar': 'Ahmednagar',
  'maharashtra::beed': 'Bid',
  'maharashtra::buldana': 'Buldhana',
  'maharashtra::gondiya': 'Gondia',
  'maharashtra::osmanabad': 'Dharashiv',
  'maharashtra::mumbai suburban': 'Mumbai Suburban',
  'maharashtra::raigarh': 'Raigad',

  // Mizoram
  'mizoram::saiha': 'Siaha',

  // Odisha
  'odisha::angul': 'Anugul',
  'odisha::balasore': 'Baleshwar',
  'odisha::baleswar': 'Baleshwar',
  'odisha::jajpur': 'Jajpur',
  'odisha::jagatsinghpur': 'Jagatsinghapur',
  'odisha::keonjhar': 'Kendujhar',
  'odisha::keonjhar kendujhar': 'Kendujhar',
  'odisha::nabarangpur': 'Nabarangpur',
  'odisha::nabarangapur': 'Nabarangpur',
  'odisha::sonepur': 'Sonepur',
  'odisha::subarnapur': 'Sonepur',
  'odisha::mayurbhanj': 'Mayurbhanj',
  'odisha::nuaparha': 'Nuapada',
  'odisha::rayagarha': 'Rayagada',

  // Puducherry
  'puducherry::pondicherry': 'Puducherry',

  // Punjab
  'punjab::firozpur': 'Ferozepur',
  'punjab::nawanshahr': 'Shahid Bhagat Singh Nagar',
  'punjab::shahid bhagat singh nagar': 'Shahid Bhagat Singh Nagar',
  'punjab::muktsar': 'Sri Muktsar Sahib',
  'punjab::sri muktsar sahib': 'Sri Muktsar Sahib',
  'punjab::tarn taran': 'Tarn Taran',
  'punjab::sas nagar sahibzada ajit singh nagar': 'S.A.S Nagar',
  'punjab::maler kotla': 'Malerkotla',

  // Rajasthan
  'rajasthan::dhaulpur': 'Dholpur',
  'rajasthan::chittaurgarh': 'Chittorgarh',
  'rajasthan::jalor': 'Jalore',
  'rajasthan::jhunjhunun': 'Jhunjhunu',

  // Sikkim
  'sikkim::east sikkim': 'Gangtok',

  // Tamil Nadu
  'tamil nadu::thiruvallur': 'Thiruvallur',
  'tamil nadu::tiruvallur': 'Thiruvallur',
  'tamil nadu::kanyakumari': 'Kanniyakumari',
  'tamil nadu::tirunelveli': 'Tirunelveli',
  'tamil nadu::thanjavur': 'Thanjavur',
  'tamil nadu::kanchipuram': 'Kancheepuram',
  'tamil nadu::tuticorin': 'Thoothukkudi',
  'tamil nadu::villupuram': 'Viluppuram',
  'tamil nadu::tiruvarur': 'Thiruvarur',

  // Telangana
  'telangana::jagtial': 'Jagitial',
  'telangana::suriyapet': 'Suryapet',
  'telangana::jayashankar bhupalpalli': 'Jayashankar Bhupalapally',
  'telangana::medchal': 'Medchal Malkajgiri',
  'telangana::wanparti': 'Wanaparthy',
  'telangana::komarram bheem': 'Kumuram Bheem Asifabad',
  'telangana::komaram bheem': 'Kumuram Bheem Asifabad',

  // Tripura
  'tripura::gomti': 'Gomati',

  // Uttarakhand
  'uttarakhand::rudra prayag': 'Rudra Prayag',
  'uttarakhand::rudraprayag': 'Rudra Prayag',
  'uttarakhand::udam singh nagar': 'Udam Singh Nagar',
  'uttarakhand::udham singh nagar': 'Udam Singh Nagar',
  'uttarakhand::chamoli': 'Chamoli',
  'uttarakhand::pauri garhwal': 'Pauri Garhwal',
  'uttarakhand::tehri garhwal': 'Tehri Garhwal',
  'uttarakhand::uttarkashi': 'Uttar Kashi',
  'uttarakhand::hardwar': 'Haridwar',
  'uttarakhand::haridwar': 'Haridwar',

  // Uttar Pradesh
  'uttar pradesh::allahabad': 'Prayagraj',
  'uttar pradesh::faizabad': 'Ayodhya',
  'uttar pradesh::barabanki': 'Bara Banki',
  'uttar pradesh::raebareli': 'Rae Bareli',
  'uttar pradesh::kushinagar': 'Kushinagar',
  'uttar pradesh::lakhimpur kheri': 'Kheri',
  'uttar pradesh::sant ravidas nagar': 'Bhadohi',
  'uttar pradesh::bhadohi': 'Bhadohi',
  'uttar pradesh::kanpur dehat': 'Kanpur Dehat',
  'uttar pradesh::kanpur nagar': 'Kanpur Nagar',
  'uttar pradesh::siddharth nagar': 'Siddharthnagar',
  'uttar pradesh::maharajganj': 'Mahrajganj',
  'uttar pradesh::shravasti': 'Shrawasti',

  // West Bengal
  'west bengal::darjeeling': 'Darjeeling',
  'west bengal::darjiling': 'Darjeeling',
  'west bengal::bardhaman': 'Purba Bardhaman',
  'west bengal::burdwan': 'Purba Bardhaman',
  'west bengal::purba barddhaman': 'Purba Bardhaman',
  'west bengal::paschim barddhaman': 'Paschim Bardhaman',
  'west bengal::alipur duar': 'Alipurduar',
  'west bengal::cooch behar': 'Cooch Behar',
  'west bengal::koch bihar': 'Cooch Behar',
  'west bengal::malda': 'Malda',
  'west bengal::maldah': 'Malda',
  'west bengal::north 24 parganas': 'North 24 Parganas',
  'west bengal::north twenty four parganas': 'North 24 Parganas',
  'west bengal::north twenty-four parganas': 'North 24 Parganas',
  'west bengal::south 24 parganas': 'South 24 Parganas',
  'west bengal::south 24parganas': 'South 24 Parganas',
  'west bengal::purba medinipur': 'Purba Medinipur',
  'west bengal::medinipur east': 'Purba Medinipur',
  'west bengal::paschim medinipur': 'Paschim Medinipur',
  'west bengal::medinipur west': 'Paschim Medinipur',
  'west bengal::hooghly': 'Hooghly',
  'west bengal::hugli': 'Hooghly',
  'west bengal::howrah': 'Howrah',
  'west bengal::haora': 'Howrah',
  'west bengal::puruliya': 'Purulia',
  'west bengal::dinajpur uttar': 'Uttar Dinajpur',
  'west bengal::dinajpur dakshin': 'Dakshin Dinajpur',
  'west bengal::24 pargs n': 'North 24 Parganas',

  // Andaman & Nicobar
  'andaman and nicobar islands::south andaman': 'South Andamans',
};

/**
 * In-memory index of canonical districts for fast and accurate resolution.
 */
export class CanonicalDistrictIndex {
  private exactMap = new Map<string, CanonicalDistrictRecord>();
  private distOnlyMap = new Map<string, CanonicalDistrictRecord[]>();
  private censusCodeMap = new Map<string, CanonicalDistrictRecord>();

  constructor(districts: CanonicalDistrictRecord[]) {
    for (const d of districts) {
      const stNorm = normalizeKey(d.stateName);
      const dtNorm = normalizeKey(d.districtName);
      this.exactMap.set(`${stNorm}::${dtNorm}`, d);

      if (!this.distOnlyMap.has(dtNorm)) {
        this.distOnlyMap.set(dtNorm, []);
      }
      this.distOnlyMap.get(dtNorm)!.push(d);

      if (d.districtCensus2011Code && d.districtCensus2011Code !== '000') {
        this.censusCodeMap.set(d.districtCensus2011Code.padStart(3, '0'), d);
      }
    }
  }

  /**
   * Match by Census 2011 district code (001-640).
   */
  matchByCensusCode(code: string): CanonicalDistrictRecord | undefined {
    return this.censusCodeMap.get(code.padStart(3, '0'));
  }

  /**
   * Match by State and District names using multi-tier heuristics.
   */
  matchByName(stateName: string, districtName: string): DistrictMatchResult {
    const rawDist = (districtName || '').trim();
    const rawState = (stateName || '').trim();

    // Check for obvious non-districts
    const lowerDist = rawDist.toLowerCase();
    if (
      !rawDist ||
      lowerDist.includes('unknown') ||
      lowerDist.includes('statewide') ||
      lowerDist.includes('unspecified') ||
      lowerDist === 'nazul' ||
      lowerDist === 'muzaffarabad' ||
      lowerDist === 'mirpur'
    ) {
      return {
        mappingStatus: 'UNMATCHED',
        mappingMethod: 'UNRESOLVED',
        confidence: 0.0,
        notes: `Generic, unallocated, or non-district entry: '${rawDist}' in '${rawState}'`,
      };
    }

    const stNorm = normalizeKey(rawState);
    const dtNorm = normalizeKey(rawDist);
    const lookupKey = `${stNorm}::${dtNorm}`;

    // 1. Exact normalized match on state + district
    const directMatch = this.exactMap.get(lookupKey);
    if (directMatch) {
      return {
        canonicalDistrictId: directMatch.id,
        canonicalDistrictName: directMatch.districtName,
        canonicalStateName: directMatch.stateName,
        mappingStatus: 'NORMALIZED_EXACT',
        mappingMethod: 'NORMALIZED_NAME',
        confidence: 0.98,
        notes: `Direct normalized match: ${lookupKey}`,
      };
    }

    // 2. Controlled administrative alias match
    const aliasTarget = CONTROLLED_DISTRICT_ALIASES[lookupKey];
    if (aliasTarget) {
      const aliasDtNorm = normalizeKey(aliasTarget);
      const aliasKey = `${stNorm}::${aliasDtNorm}`;
      const aliasMatch = this.exactMap.get(aliasKey);
      if (aliasMatch) {
        return {
          canonicalDistrictId: aliasMatch.id,
          canonicalDistrictName: aliasMatch.districtName,
          canonicalStateName: aliasMatch.stateName,
          mappingStatus: 'CONTROLLED_ALIAS',
          mappingMethod: 'ALIAS_LOOKUP',
          confidence: 0.95,
          notes: `Mapped via controlled alias: '${lookupKey}' -> '${aliasTarget}'`,
        };
      }

      // If state varied slightly, check if alias target is unique nationwide
      const cands = this.distOnlyMap.get(aliasDtNorm);
      if (cands && cands.length === 1) {
        return {
          canonicalDistrictId: cands[0].id,
          canonicalDistrictName: cands[0].districtName,
          canonicalStateName: cands[0].stateName,
          mappingStatus: 'CONTROLLED_ALIAS',
          mappingMethod: 'ALIAS_LOOKUP',
          confidence: 0.90,
          notes: `Mapped via nationwide alias: '${lookupKey}' -> '${aliasTarget}' (${cands[0].stateName})`,
        };
      }
    }

    // 3. Unique district name nationwide
    const distMatches = this.distOnlyMap.get(dtNorm);
    if (distMatches && distMatches.length === 1) {
      return {
        canonicalDistrictId: distMatches[0].id,
        canonicalDistrictName: distMatches[0].districtName,
        canonicalStateName: distMatches[0].stateName,
        mappingStatus: 'NORMALIZED_EXACT',
        mappingMethod: 'NORMALIZED_NAME',
        confidence: 0.88,
        notes: `Unique district name match nationwide: '${rawDist}' -> ${distMatches[0].districtName} (${distMatches[0].stateName})`,
      };
    }

    // 4. Ambiguous or Unmatched
    if (distMatches && distMatches.length > 1) {
      return {
        mappingStatus: 'AMBIGUOUS',
        mappingMethod: 'UNRESOLVED',
        confidence: 0.2,
        notes: `Ambiguous district name found in multiple states: '${rawDist}' (${distMatches.map((d) => d.stateName).join(', ')})`,
      };
    }

    return {
      mappingStatus: 'UNMATCHED',
      mappingMethod: 'UNRESOLVED',
      confidence: 0.0,
      notes: `Unresolved district: '${rawDist}' in state '${rawState}'`,
    };
  }
}
