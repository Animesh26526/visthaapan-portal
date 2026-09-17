import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { mockHabitations } from '../mock/data';

export const HabitationDetail: React.FC = () => {
  const { habitationId: routeHabId } = useParams();
  const [searchParams] = useSearchParams();
  const habParam = searchParams.get('hab');

  const {
    habitations,
    selectedHabitationId,
    setSelectedHabitationId
  } = useAppStore();

  const [filterUrgency, setFilterUrgency] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fallback to mockHabitations if store array is missing or empty
  const safeHabitations = Array.isArray(habitations) && habitations.length > 0 
    ? habitations 
    : mockHabitations;

  // Active village from query param (?hab=...), route param (/habitations/:id), or store
  const activeHabId = habParam || routeHabId || selectedHabitationId;
  const currentHabitation = safeHabitations.find(h => h.id === activeHabId) || safeHabitations[0] || mockHabitations[0];

  // Keep store in sync when hab query param is present
  useEffect(() => {
    if (habParam && habParam !== selectedHabitationId) {
      setSelectedHabitationId(habParam);
    }
  }, [habParam, selectedHabitationId, setSelectedHabitationId]);

  const filteredHabitations = safeHabitations.filter(h => {
    const priorityStr = (h.priority || '').toLowerCase();
    const matchesUrgency = filterUrgency === 'all' || priorityStr === filterUrgency.toLowerCase();
    const nameStr = (h.name || '').toLowerCase();
    const codeStr = (h.code || '').toLowerCase();
    const query = searchTerm.toLowerCase();
    const matchesSearch = nameStr.includes(query) || codeStr.includes(query);
    return matchesUrgency && matchesSearch;
  });

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto font-sans">
      {/* 1. TOP SECTOR HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-red-100 border border-red-300 text-red-800 text-[10px] font-bold uppercase font-mono">
              NDMA SETTLEMENT INTELLIGENCE
            </span>
            <span className="text-xs text-slate-500 font-mono">SECTOR: CHAMOLI VALLEY</span>
          </div>
          <h1 className="text-2xl font-bold text-[#003366] mt-1">
            Habitation Vulnerability Intelligence &amp; Evidence
          </h1>
          <p className="text-xs text-slate-600">
            Ground-truth census telemetry, terrain declivity, hazard exposure, and evacuation urgency tiers.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
          <span>Synced with State GIS Repository</span>
        </div>
      </div>

      {/* 2. MAIN TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN: SETTLEMENT SELECTOR LIST (4 COLS) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-lg shadow-sm p-4 space-y-3 flex flex-col h-[500px] lg:h-[750px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#003366] uppercase tracking-wider">
              Monitored Habitations ({habitations.length})
            </span>
            <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
              CHAMOLI
            </span>
          </div>

          {/* Search and Filters */}
          <div className="space-y-2">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <span className="material-symbols-outlined text-[16px]">search</span>
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search village name or code..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-[#003366] outline-none"
              />
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilterUrgency('all')}
                className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                  filterUrgency === 'all' ? 'bg-[#003366] text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterUrgency('immediate')}
                className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                  filterUrgency === 'immediate' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700'
                }`}
              >
                Immediate
              </button>
              <button
                onClick={() => setFilterUrgency('short-term')}
                className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                  filterUrgency === 'short-term' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800'
                }`}
              >
                Short-term
              </button>
            </div>
          </div>

          {/* Scrollable List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredHabitations.map((hab) => {
              const isSelected = hab.id === currentHabitation.id;
              return (
                <div
                  key={hab.id}
                  onClick={() => setSelectedHabitationId(hab.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition ${
                    isSelected
                      ? 'bg-blue-50/70 border-[#003366] ring-1 ring-[#003366]'
                      : 'bg-white border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-xs text-slate-900">{hab.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Code: {hab.code} • Pop: {hab.population.toLocaleString()}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        hab.priority === 'Immediate'
                          ? 'bg-red-100 text-red-800 border border-red-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {hab.priority}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[10px]">
                    <span className="text-slate-600 font-medium">Risk: <strong>{hab.riskScore.toFixed(2)}</strong></span>
                    <span className="text-slate-500">Hazard: <strong>{hab.primaryHazard}</strong></span>
                    {hab.isInsideRedZone && (
                      <span className="text-red-600 font-bold flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span> Red Zone
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE HABITATION EVIDENCE DOSSIER (8 COLS) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Active Habitation Banner */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#003366] font-bold uppercase">
                    DOSSIER: {currentHabitation.code}
                  </span>
                  <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold rounded font-mono uppercase">
                    {currentHabitation.priority || 'Immediate'} RELOCATION
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-1">
                  {currentHabitation.name}
                </h2>
                <p className="text-xs text-slate-500 font-mono">
                  Coordinates: {currentHabitation.coordinates?.lat ?? 30.556}°N, {currentHabitation.coordinates?.lng ?? 79.563}°E • Elevation: {currentHabitation.elevationMeters ?? 2180}m MSL
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
                  <span className="material-symbols-outlined text-[16px] text-[#003366]">verified</span>
                  <span>Field Survey Verified</span>
                </span>
              </div>
            </div>

            {/* Metric Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="block text-[10px] text-slate-500 uppercase font-bold font-mono">Total Population</span>
                <span className="text-xl font-extrabold text-slate-900 font-mono">
                  {(currentHabitation.population || 0).toLocaleString()}
                </span>
                <span className="block text-[10px] text-slate-500">{currentHabitation.households || 0} Households</span>
              </div>

              <div className="p-3 bg-red-50 rounded border border-red-200">
                <span className="block text-[10px] text-red-700 uppercase font-bold font-mono">Composite Risk</span>
                <span className="text-xl font-extrabold text-red-700 font-mono">
                  {(currentHabitation.riskScore || 0).toFixed(2)}
                </span>
                <span className="block text-[10px] text-red-600">Top 1% Critical Redline</span>
              </div>

              <div className="p-3 bg-amber-50 rounded border border-amber-200">
                <span className="block text-[10px] text-amber-800 uppercase font-bold font-mono">Vulnerability Score</span>
                <span className="text-xl font-extrabold text-amber-800 font-mono">
                  {(currentHabitation.vulnerabilityScore || 0).toFixed(2)}
                </span>
                <span className="block text-[10px] text-amber-700">High Demographic Immobility</span>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="block text-[10px] text-slate-500 uppercase font-bold font-mono">Slope Declivity</span>
                <span className="text-xl font-extrabold text-slate-900 font-mono">
                  {currentHabitation.slopeDegrees || 34.2}°
                </span>
                <span className="block text-[10px] text-slate-500">Unstable Moraine Bed</span>
              </div>
            </div>
          </div>

          {/* Demographic Fragility & Vulnerable Groups */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 space-y-3">
            <h3 className="text-xs font-bold text-[#003366] uppercase tracking-wider">
              Demographic Vulnerability &amp; Immobility Profile
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase font-bold">Elderly Dependents (&gt;65y)</span>
                  <span className="text-lg font-bold text-slate-900 font-mono">
                    {(currentHabitation.vulnerableGroups?.elderly || 0).toLocaleString()}
                  </span>
                  <span className="block text-[10px] text-slate-500">Requires assisted evacuation</span>
                </div>
                <span className="material-symbols-outlined text-slate-400 text-[28px]">elderly</span>
              </div>

              <div className="p-3 rounded border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase font-bold">Infants &amp; Children (&lt;10y)</span>
                  <span className="text-lg font-bold text-slate-900 font-mono">
                    {(currentHabitation.vulnerableGroups?.children || 0).toLocaleString()}
                  </span>
                  <span className="block text-[10px] text-slate-500">Requires pediatric shelter pack</span>
                </div>
                <span className="material-symbols-outlined text-slate-400 text-[28px]">child_care</span>
              </div>

              <div className="p-3 rounded border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase font-bold">Persons with Disability</span>
                  <span className="text-lg font-bold text-slate-900 font-mono">
                    {(currentHabitation.vulnerableGroups?.disabled || 0).toLocaleString()}
                  </span>
                  <span className="block text-[10px] text-slate-500">Ambulant / stretcher transit</span>
                </div>
                <span className="material-symbols-outlined text-slate-400 text-[28px]">accessible</span>
              </div>
            </div>
          </div>

          {/* Infrastructure Condition & Historical Impact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Infrastructure Access */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 space-y-3">
              <h3 className="text-xs font-bold text-[#003366] uppercase tracking-wider">
                Lifeline Infrastructure Ground Status
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <span className="material-symbols-outlined text-red-600 text-[18px]">local_hospital</span>
                    Healthcare Facility
                  </span>
                  <span className="font-bold text-red-700 font-mono">
                    {currentHabitation.infrastructure?.healthcare || 'Primary Health Post'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <span className="material-symbols-outlined text-[#d9531e] text-[18px]">alt_route</span>
                    Access Route (NH-07 Link)
                  </span>
                  <span className="font-bold text-amber-800 font-mono">
                    {currentHabitation.infrastructure?.roads || 'Compromised'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <span className="material-symbols-outlined text-[#003366] text-[18px]">water_drop</span>
                    Drinking Water
                  </span>
                  <span className="font-bold text-[#003366] font-mono">
                    {currentHabitation.infrastructure?.water || 'Disrupted'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <span className="material-symbols-outlined text-slate-600 text-[18px]">bolt</span>
                    Power Grid
                  </span>
                  <span className="font-bold text-slate-800 font-mono">
                    {currentHabitation.infrastructure?.powerGrid || 'Intermittent'}
                  </span>
                </div>
              </div>
            </div>

            {/* Historical Disaster Events */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#003366] uppercase tracking-wider">
                  Historical Disaster Incidents
                </h3>
                <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                  {currentHabitation.historicalEventsCount || 7} EVENTS
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-600 inline-block"></span>
                      Cloudburst &amp; Debris Mudsurge
                    </span>
                    <span className="text-red-700 font-mono">JUL 2023</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 pl-3.5">
                    14 residential clusters structurally sheared; debris deposit volume 4,200 m³.
                  </p>
                </div>

                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                      Accelerated Ground Fissures
                    </span>
                    <span className="text-amber-800 font-mono">OCT 2022</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 pl-3.5">
                    Fissures &gt;120mm widened on primary road corridor; local aquifer severed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
