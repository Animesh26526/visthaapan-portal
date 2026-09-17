import React from 'react';

export const TechnicalExplainer: React.FC = () => {
  const pipelineSteps = [
    {
      step: '01',
      title: 'Multi-Source Data Ingestion & Sanitization',
      tag: 'DATA LAYER',
      description: 'Ingests multi-spectral satellite imagery, InSAR radar ground displacement, Doppler radar, DEM elevation, and census geodatabases from ISRO, Survey of India, and CWC.',
      formula: 'D_clean = Validate(Coords, Nulls, Duplicates, Projection: EPSG:32644)'
    },
    {
      step: '02',
      title: 'Spatial Engineering & Topological Normalization',
      tag: 'GIS ENGINE',
      description: 'Generates spatial proximity vectors (distance to river, slope declivity, fault line buffers). Computes dynamic Red-Zones where permanent human life is at severe risk.',
      formula: 'RedZone = { (x, y) | HazardIntensity(x, y) > Threshold_Critical }'
    },
    {
      step: '03',
      title: 'AI Risk & Priority Weight Modeling',
      tag: 'MACHINE LEARNING',
      description: 'Random Forest and Gradient Boosted trees evaluate hazard exposure, demographic vulnerability, and single-point infrastructure egress failure to compute calibrated Relocation Priority Weights (RPW).',
      formula: 'RPW_i = w_h · HazardExposure_i + w_v · Vulnerability_i + w_t · Terrain_i'
    },
    {
      step: '04',
      title: 'Carrying Capacity Bottleneck Modeling',
      tag: 'RESOURCE MODEL',
      description: 'Prevents the fatal fallacy that open land equals livable shelter. Evaluates Area, Water, Shelter, Sanitation, and Health to identify the exact limiting resource.',
      formula: 'C_eff(j) = min( Area(j), Water(j), Shelter(j), Sanitation(j), Healthcare(j) )'
    },
    {
      step: '05',
      title: 'Operations Research Population Dispatch',
      tag: 'LINEAR PROGRAMMING',
      description: 'Solves the competing multi-settlement allocation problem as a constrained Linear Program / Mixed-Integer Linear Program, guaranteeing optimal high-priority life safety at minimal cost.',
      formula: 'min Z = ∑ᵢ ∑ⱼ (cᵢⱼ · xᵢⱼ) + ∑ᵢ (Pᵢ · uᵢ)   subject to: ∑ⱼ xᵢⱼ + uᵢ = Dᵢ, ∑ᵢ xᵢⱼ ≤ C_eff(j)'
    },
    {
      step: '06',
      title: 'Human Authority Executive Adjudication Gate',
      tag: 'GOVERNANCE',
      description: 'AI and OR recommend; the District Magistrate and Incident Commander decides. Statutory ACCEPT, MODIFY, or REJECT actions recorded in the immutable legal ledger.',
      formula: 'StatutoryLedger ← SignOrder(Decision, Rationale, Timestamp, OfficerID)'
    }
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto font-sans">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#003366] text-white text-[10px] font-bold uppercase font-mono tracking-wider">
              VISTHAAPAN SYSTEM ARCHITECTURE &amp; METHODOLOGY
            </span>
            <span className="text-xs text-slate-500 font-mono">EDUCATIONAL &amp; SCIENTIFIC BLUEPRINT</span>
          </div>
          <h1 className="text-2xl font-bold text-[#003366] mt-1">
            Algorithmic Pipeline &amp; Technical Explainer
          </h1>
          <p className="text-xs text-slate-600">
            A comprehensive overview of how VISTHAAPAN unifies AI Risk Prediction, GIS Spatial Feasibility, Carrying Capacity, and Operations Research into a single decision chain.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
          <span>Integrated Pipeline Specification</span>
        </div>
      </div>

      {/* 2. ARCHITECTURAL PRINCIPLE BANNER */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-2">
        <span className="text-xs font-mono uppercase tracking-wider text-[#d9531e] font-bold">
          Core Architectural Principle: Systems Integration Over Isolated Novelty
        </span>
        <blockquote className="text-sm md:text-base font-medium italic text-slate-800 p-3 bg-slate-50 rounded-lg border border-slate-200">
          &ldquo;The critical breakthrough is not creating another black-box model in isolation. The real innovation lies in mathematically formulating and connecting multi-hazard risk predictions, ground carrying-capacity limits, and operations research dispatch into a transparent, legally accountable evacuation chain.&rdquo;
        </blockquote>
      </div>

      {/* 3. STEP-BY-STEP PIPELINE CARDS */}
      <div className="space-y-4">
        {pipelineSteps.map((step) => (
          <div key={step.step} className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded bg-[#003366] text-amber-400 font-mono font-extrabold text-sm flex items-center justify-center">
                  {step.step}
                </span>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{step.title}</h3>
                  <span className="text-[10px] font-mono font-bold text-[#d9531e] uppercase">{step.tag}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed pl-10">
              {step.description}
            </p>

            <div className="ml-10 p-2.5 bg-slate-50 rounded border border-slate-200 font-mono text-xs text-[#003366] font-bold">
              {step.formula}
            </div>
          </div>
        ))}
      </div>

      {/* 4. CONCLUSION CALL TO ACTION */}
      <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-slate-600">
          Architecture verified against NDMA and State Remote Sensing Centre technical standards.
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded border border-slate-200">
          <span className="material-symbols-outlined text-[16px] text-blue-700">verified</span>
          <span>Architecture Certified</span>
        </div>
      </div>
    </div>
  );
};
