import React from 'react';
import { mockDataProvenances } from '../mock/data';

export const DataEvidence: React.FC = () => {
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto font-sans">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-100 border border-blue-300 text-[#003366] text-[10px] font-bold uppercase font-mono">
              NATIONAL GEOSPATIAL DATA PROVENANCE
            </span>
            <span className="text-xs text-slate-500 font-mono">ISRO NRSC • SURVEY OF INDIA • CWC</span>
          </div>
          <h1 className="text-2xl font-bold text-[#003366] mt-1">
            Data Provenance, Sensor Telemetry &amp; Evidence Atlas
          </h1>
          <p className="text-xs text-slate-600">
            Authoritative source tracking for all spatial layers, satellite radars, and hydrological telemetry feeding the AI and OR models.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
          <span>100% Agency Feeds Verified</span>
        </div>
      </div>

      {/* 2. PROVENANCE DATASET CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {mockDataProvenances.map((item) => (
          <div key={item.id} className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#003366] uppercase">
                  {item.sourceAgency} • {item.category}
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">{item.layerName}</h3>
              </div>
              <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded ${
                item.status === 'Verified Authoritative'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-blue-100 text-[#003366]'
              }`}>
                {item.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-50 p-3 rounded border border-slate-200">
              <div>
                <span className="block text-[9px] text-slate-500 uppercase font-bold">Acquisition Stamp:</span>
                <span className="text-slate-900 font-semibold">{item.acquisitionDate}</span>
              </div>
              <div>
                <span className="block text-[9px] text-slate-500 uppercase font-bold">Spatial Resolution:</span>
                <span className="text-slate-900 font-semibold">{item.spatialResolution}</span>
              </div>
              <div>
                <span className="block text-[9px] text-slate-500 uppercase font-bold">Grid Coverage:</span>
                <span className="text-emerald-700 font-bold">{item.coveragePercentage}% Verified</span>
              </div>
              <div>
                <span className="block text-[9px] text-slate-500 uppercase font-bold">Confidence Index:</span>
                <span className="text-emerald-700 font-bold">{(item.confidenceIndex * 100).toFixed(0)}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 font-mono text-slate-500">
              <span className="truncate max-w-[240px]">Checksum: {item.checksum}</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                Fresh: {item.freshness}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 3. AUDIT INTEGRITY FOOTER */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-lg shadow-xs">
        <div className="text-xs text-slate-600">
          All sensor telemetry streams comply with National Spatial Data Infrastructure (NSDI) protocols.
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded border border-slate-200">
          <span className="material-symbols-outlined text-[16px] text-emerald-700">verified</span>
          <span>Provenance Verified</span>
        </div>
      </div>
    </div>
  );
};
