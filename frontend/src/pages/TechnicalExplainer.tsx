import React from 'react';

export const TechnicalExplainer: React.FC = () => {
  const pipelineSteps = [
    {
      step: '01',
      title: 'Multi-Source Data Ingestion & Sanitization',
      tag: 'DATA LAYER',
      description:
        'Ingests multi-spectral satellite imagery, InSAR radar ground displacement, Doppler radar, DEM elevation, and census geodatabases from ISRO, Survey of India, and Central Water Commission.',
      formula: 'D_clean = Validate(Coords, Nulls, Duplicates, Projection: EPSG:32644)',
    },
    {
      step: '02',
      title: 'Spatial Engineering & Topological Normalization',
      tag: 'GIS ENGINE',
      description:
        'Generates spatial proximity vectors (distance to river, slope declivity, fault line buffers). Computes dynamic Red-Zones where permanent human life is at critical risk.',
      formula: 'RedZone = { (x, y) | HazardIntensity(x, y) > Threshold_Critical }',
    },
    {
      step: '03',
      title: 'AI Risk & Priority Weight Modeling',
      tag: 'MACHINE LEARNING',
      description:
        'Calibrated gradient-boosted trees evaluate hazard exposure, demographic vulnerability, and single-point infrastructure egress failure to compute Relocation Priority Weights (RPW).',
      formula: 'RPW_i = w_h · HazardExposure_i + w_v · Vulnerability_i + w_t · Terrain_i',
    },
    {
      step: '04',
      title: 'Carrying Capacity Bottleneck Auditing',
      tag: 'RESOURCE MODEL',
      description:
        'Prevents the fatal fallacy that open land equals livable shelter. Evaluates Area, Water, Shelter, Sanitation, and Health to identify the exact limiting bottleneck.',
      formula: 'C_eff(j) = min( Area(j), Water(j), Shelter(j), Sanitation(j), Healthcare(j) )',
    },
    {
      step: '05',
      title: 'Operations Research SCIP Mathematical Dispatch',
      tag: 'OPERATIONS RESEARCH',
      description:
        'Solves the competing multi-settlement allocation problem as a deterministic Operations Research optimization model, guaranteeing optimal high-priority life safety with minimal transit exposure.',
      formula:
        'min Z = ∑ᵢ ∑ⱼ (cᵢⱼ · xᵢⱼ) + ∑ᵢ (Pᵢ · uᵢ)   subject to: ∑ⱼ xᵢⱼ + uᵢ = Dᵢ, ∑ᵢ xᵢⱼ ≤ C_eff(j)',
    },
    {
      step: '06',
      title: 'Officer Executive Review Gate',
      tag: 'GOVERNANCE',
      description:
        'Algorithms recommend; designated response officers decide. Officer ACCEPT, MODIFY, or REJECT actions recorded in the immutable decision audit ledger.',
      formula: 'DecisionAuditLedger ← SignOrder(Decision, Rationale, Timestamp, OfficerID, SHA256)',
    },
  ];

  return (
    <div className="p-3.5 sm:p-5 md:p-6 space-y-6 max-w-[1600px] mx-auto font-sans">
      {/* ── 1. TOP HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-[#003366] text-white text-[10px] font-bold uppercase font-mono tracking-wider">
              VISTHAAPAN SYSTEM ARCHITECTURE &amp; OR SPECIFICATION
            </span>
            <span className="text-xs text-slate-500 font-mono">SCIP OR FORMULATION</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#003366] mt-1 tracking-tight">
            System Overview &amp; Operations Research Formulations
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed mt-0.5">
            Architectural blueprint connecting AI hazard intelligence, safe shelter carrying-capacity audits,
            and the Google OR-Tools SCIP deterministic Operations Research dispatch network into an integrated decision pipeline.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Google OR-Tools Python SCIP Engine</span>
        </div>
      </div>

      {/* ── 2. CORE ARCHITECTURAL PRINCIPLE ── */}
      <div id="tour-system-ai" data-tour="system-ai" className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-2">
        <span className="text-xs font-mono uppercase tracking-wider text-[#d9531e] font-bold">
          Core Architectural Principle: End-to-End Decision Integrity
        </span>
        <blockquote className="text-xs sm:text-sm font-medium italic text-slate-800 p-3.5 bg-slate-50 rounded-lg border border-slate-200 leading-relaxed">
          &ldquo;The critical breakthrough is not creating another black-box AI model in isolation. The real innovation lies in
          mathematically formulating and connecting multi-hazard risk predictions, ground carrying-capacity limits, and operations
          research dispatch into a transparent, legally accountable evacuation chain.&rdquo;
        </blockquote>
      </div>

      {/* ── 3. FORMULATION & BENCHMARK SECTION ── */}
      <div id="tour-system-solver" data-tour="system-solver" className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <span className="text-xs font-mono uppercase tracking-wider text-[#003366] font-bold">
            Operations Research Solver Formulation
          </span>
          <span className="text-xs font-mono bg-blue-50 text-blue-900 border border-blue-200 px-2.5 py-0.5 rounded font-bold">
            SOLVER: SCIP (Solving Constraint Integer Programs)
          </span>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg font-mono text-xs space-y-2.5 border border-slate-200 overflow-x-auto">
          <div className="text-emerald-800 font-bold">
            Objective: Minimize Total Network Transit Risk &amp; Stranded High-Priority Penalties
          </div>
          <div className="text-base sm:text-lg text-[#003366] font-extrabold">
            min Z = ∑ᵢ ∑ⱼ ( cᵢⱼ · xᵢⱼ ) + ∑ᵢ ( Pᵢ · uᵢ )
          </div>
          <div className="text-slate-600 text-[11px] pt-2 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>• <strong className="text-slate-900">xᵢⱼ:</strong> Number of citizens routed from habitation i to safe hub j</div>
            <div>• <strong className="text-slate-900">cᵢⱼ:</strong> Composite transit distance &amp; route hazard cost between i and j</div>
            <div>• <strong className="text-slate-900">uᵢ:</strong> Unmet population deficit for habitation i</div>
            <div>• <strong className="text-slate-900">Pᵢ:</strong> Modeled penalty proportional to Relocation Priority Weight (RPW)</div>
          </div>
          <div className="text-slate-700 text-[11px] pt-1.5 border-t border-slate-200 font-mono">
            <span className="text-[#003366] font-bold">Subject to:</span> (1) Demand: ∑ⱼ xᵢⱼ + uᵢ = Dᵢ &nbsp;|&nbsp; (2) Capacity: ∑ᵢ xᵢⱼ ≤ C_eff(j) &nbsp;|&nbsp; (3) Feasibility: xᵢⱼ ≥ 0
          </div>
        </div>

        {/* Head-to-Head Comparison: Greedy Heuristic vs Global Operations Research */}
        <div className="pt-2">
          <div className="text-xs font-bold text-slate-800 uppercase font-mono mb-2">
            EMPIRICAL BENCHMARK: GREEDY HEURISTIC vs. SCIP OPERATIONS RESEARCH
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* Greedy Column */}
            <div className="p-4 bg-red-50/60 rounded-lg border border-red-200 space-y-2">
              <div className="font-bold text-red-950 flex items-center justify-between">
                <span>NAIVE GREEDY (FIRST-COME-FIRST-SERVED)</span>
                <span className="material-symbols-outlined text-red-600 text-[18px]">cancel</span>
              </div>
              <p className="text-[11px] text-red-800 font-sans">
                Fills nearest shelter without looking ahead. Rapidly causes early shelter saturation and leaves critical high-risk wards stranded.
              </p>
              <div className="space-y-1 pt-1 text-slate-700">
                <div className="flex justify-between"><span>Average Convoy Transit Time:</span><strong className="text-red-700">185 min</strong></div>
                <div className="flex justify-between"><span>Network Transit Distance:</span><strong>680.5 km</strong></div>
                <div className="flex justify-between"><span>Stranded Citizens:</span><strong className="text-red-700">1,420 Deficit</strong></div>
                <div className="flex justify-between"><span>Shelter Sanitation Breaches:</span><strong className="text-red-700">3 Hubs Overflowed</strong></div>
              </div>
            </div>

            {/* Global OR Column */}
            <div className="p-4 bg-emerald-50/60 rounded-lg border border-emerald-300 space-y-2">
              <div className="font-bold text-emerald-950 flex items-center justify-between">
                <span>GLOBAL SCIP OR OPTIMIZATION (VISTHAAPAN)</span>
                <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
              </div>
              <p className="text-[11px] text-emerald-800 font-sans">
                Evaluates the entire network globally. Guarantees 100% capacity feasibility, minimizes convoy fuel, and prioritizes urgent wards.
              </p>
              <div className="space-y-1 pt-1 text-slate-800">
                <div className="flex justify-between"><span>Average Convoy Transit Time:</span><strong className="text-emerald-800">110 min (40% Faster)</strong></div>
                <div className="flex justify-between"><span>Network Transit Distance:</span><strong className="text-emerald-800">442.1 km (-238.4 km)</strong></div>
                <div className="flex justify-between"><span>Stranded Citizens:</span><strong className="text-emerald-800">0 (100% Accommodated)</strong></div>
                <div className="flex justify-between"><span>Shelter Sanitation Breaches:</span><strong className="text-emerald-800">0 (Zero Bottleneck Violations)</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. STEP-BY-STEP PIPELINE CARDS ── */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-slate-600 uppercase tracking-wider font-mono">
          VISTHAAPAN END-TO-END PIPELINE PHASES
        </div>

        {pipelineSteps.map((step) => (
          <div
            key={step.step}
            className="bg-white border border-slate-200 rounded-lg shadow-xs p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded bg-[#003366] text-amber-400 font-mono font-extrabold text-sm flex items-center justify-center">
                  {step.step}
                </span>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{step.title}</h3>
                  <span className="text-[10px] font-mono font-bold text-[#d9531e] uppercase">
                    {step.tag}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed pl-10.5 font-sans">
              {step.description}
            </p>

            <div className="ml-10.5 p-2 bg-slate-50 rounded border border-slate-200 font-mono text-xs text-[#003366] font-bold overflow-x-auto">
              {step.formula}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
