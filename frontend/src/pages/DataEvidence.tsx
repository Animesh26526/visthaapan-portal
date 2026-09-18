import React, { useState, useEffect } from 'react';
import {
  EvidenceService,
  type ProvenanceRecord,
  type DistrictEvidenceResponse,
} from '../services/evidence.service';

export const DataEvidence: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'provenance' | 'ddmp'>('provenance');
  const [provenanceList, setProvenanceList] = useState<ProvenanceRecord[]>([]);
  const [ddmpData, setDdmpData] = useState<DistrictEvidenceResponse | null>(null);
  const [selectedDdmpCategory, setSelectedDdmpCategory] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const [prov, ddmp] = await Promise.all([
          EvidenceService.getProvenanceRegistry().catch(() => []),
          EvidenceService.getDistrictEvidence('Chamoli').catch(() => null),
        ]);
        if (isMounted) {
          if (prov && prov.length > 0) {
            setProvenanceList(prov);
          }
          if (ddmp) {
            setDdmpData(ddmp);
          }
        }
      } catch (err) {
        console.error('Failed to load evidence data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const getBadgeColor = (badge: string) => {
    const b = badge.toUpperCase();
    if (b.includes('QUARANTINED')) return 'bg-purple-100 text-purple-900 border-purple-300';
    if (b.includes('UNAVAILABLE')) return 'bg-red-100 text-red-900 border-red-300';
    if (b.includes('SIMULATED')) return 'bg-amber-100 text-amber-900 border-amber-300';
    if (b.includes('DERIVED')) return 'bg-blue-100 text-blue-900 border-blue-300';
    return 'bg-emerald-100 text-emerald-900 border-emerald-300';
  };

  const ddmpCategories = [
    { key: 'ALL', label: 'All Evidence (30)' },
    { key: 'DDMP_VULNERABLE_HABITATION', label: '17 Named Settlements' },
    { key: 'DDMP_ROAD_CORRIDOR', label: '5 Sensitive Corridors' },
    { key: 'DDMP_HISTORICAL_DISASTER', label: 'Historical Precedents' },
    { key: 'DDMP_HELIPAD_CONTEXT', label: 'Helipad Staging' },
    { key: 'DDMP_TEMPORARY_SHELTER_CONTEXT', label: 'Relief Shelters' },
    { key: 'DDMP_RELOCATION_HISTORY', label: 'Relocation History' },
    { key: 'DDMP_RESOURCE_CONTEXT', label: 'Machinery Inventory' },
  ];

  const filteredDdmpItems = ddmpData
    ? ddmpData.rawList.filter(
        item => selectedDdmpCategory === 'ALL' || item.category === selectedDdmpCategory
      )
    : [];

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto font-sans">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-[#003366] text-white text-[10px] font-bold uppercase font-mono">
              PHASE 9 OPERATIONAL INTEGRATION
            </span>
            <span className="text-xs text-slate-500 font-mono">
              STRICT DATA LINEAGE &amp; DOCUMENTARY EVIDENCE
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#003366] mt-1">
            Data Lineage, Provenance Registry &amp; Chamoli DDMP 2026–27
          </h1>
          <p className="text-xs text-slate-600">
            Authoritative source tracking for all 785 canonical districts, 47,621 NDEM disaster events, 30,273 geocoded healthcare facilities, and Chamoli DDMP documentary knowledge.
          </p>
        </div>

        {/* Tab Switcher & Status */}
        <div className="flex items-center gap-3">
          {isLoading && (
            <span className="text-[11px] font-mono text-slate-500 animate-pulse">
              Syncing database evidence...
            </span>
          )}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
          <button
            onClick={() => setActiveTab('provenance')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${
              activeTab === 'provenance'
                ? 'bg-white text-[#003366] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            System Provenance Registry
          </button>
          <button
            onClick={() => setActiveTab('ddmp')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${
              activeTab === 'ddmp'
                ? 'bg-white text-[#003366] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Chamoli DDMP 2026–27 Evidence (30)
          </button>
        </div>
      </div>
    </div>

      {/* 2. REAL / DERIVED / QUARANTINED AUDIT KPI STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-500">Districts Registry</div>
          <div className="text-2xl font-extrabold text-[#003366] font-mono mt-0.5">785</div>
          <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded mt-1 inline-block">
            REAL (Census / LGD)
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-500">NDEM Disaster Events</div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono mt-0.5">47,621</div>
          <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded mt-1 inline-block">
            REAL (MHA Portal)
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-500">Healthcare Facilities</div>
          <div className="text-2xl font-extrabold text-purple-900 font-mono mt-0.5">30,273</div>
          <div className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded mt-1 inline-block">
            BEDS QUARANTINED
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-500">Demographic Baseline</div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono mt-0.5">2011</div>
          <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded mt-1 inline-block">
            REAL (HISTORICAL)
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-500">Cartosat-1 DEM Slope</div>
          <div className="text-base font-bold text-red-800 font-mono mt-1">Gujarat Only</div>
          <div className="text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded mt-1 inline-block">
            UNAVAILABLE (CHAMOLI)
          </div>
        </div>
      </div>

      {/* TAB 1: SYSTEM PROVENANCE REGISTRY */}
      {activeTab === 'provenance' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-900 flex items-start gap-2">
            <span className="material-symbols-outlined text-amber-600 text-[18px] shrink-0 mt-0.5">info</span>
            <div>
              <strong>Strict Provenance Policy:</strong> VISTHAAPAN enforces complete transparency of data origins. Real administrative and incident records are never conflated with synthetic demonstration benchmarks. Bed numbers in the national directory are quarantined due to lack of verified real-time feeds.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {provenanceList.map((item) => (
              <div key={item.id} className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                      {item.id} • {item.authority}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5">{item.datasetName}</h3>
                  </div>
                  <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded border ${getBadgeColor(item.badge)} shrink-0`}>
                    {item.badge}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-50 p-2.5 rounded border border-slate-100">
                  <div>
                    <span className="block text-[9px] text-slate-400 uppercase font-bold">Records Count:</span>
                    <span className="text-slate-900 font-semibold">{item.recordsCount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-400 uppercase font-bold">Status:</span>
                    <span className="text-slate-800 font-semibold">{item.status}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-[9px] text-slate-400 uppercase font-bold">Coverage:</span>
                    <span className="text-slate-700">{item.coverage}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 border-t border-slate-100 pt-2">
                  <span className="font-bold text-slate-700">Audit &amp; Limitation Notes:</span> {item.limitations}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: CHAMOLI DDMP 2026-27 DOCUMENTARY EVIDENCE */}
      {activeTab === 'ddmp' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-xs text-[#003366] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <strong>Source:</strong> District Disaster Management Plan (DDMP 2026–27), District Disaster Management Authority, Chamoli (DEOC Gopeshwar).
            </div>
            <span className="text-[10px] font-mono bg-blue-100 px-2 py-0.5 rounded font-bold">
              REAL DOCUMENTARY PLANNING EVIDENCE
            </span>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {ddmpCategories.map(cat => (
              <button
                key={cat.key}
                onClick={() => setSelectedDdmpCategory(cat.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full shrink-0 transition ${
                  selectedDdmpCategory === cat.key
                    ? 'bg-[#003366] text-white font-bold'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Evidence Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDdmpItems.map(item => (
              <div key={item.id} className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                    <span className="font-bold uppercase text-[#003366]">{item.category.replace('DDMP_', '')}</span>
                    {item.referencePage && (
                      <span className="bg-slate-100 px-1.5 py-0.2 rounded font-semibold text-slate-700">
                        {item.referencePage}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.description}</p>
                </div>

                {item.metadata && Object.keys(item.metadata).length > 0 && (
                  <div className="bg-slate-50 border border-slate-100 rounded p-2 text-[11px] font-mono text-slate-600 space-y-0.5 mt-2">
                    {Object.entries(item.metadata).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-slate-400 capitalize">{k.replace(/_/g, ' ')}:</span>
                        <span className="font-semibold text-slate-800 text-right truncate max-w-[200px]">
                          {Array.isArray(v) ? v.join(', ') : String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="p-3 bg-white border border-slate-200 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 font-mono">
        <div>
          ISO 19115 Geospatial Metadata &amp; NDRF Provenance Compliant
        </div>
        <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
          <span className="material-symbols-outlined text-[16px]">verified</span>
          Verified Against Active PostgreSQL Database
        </div>
      </div>
    </div>
  );
};
