import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import { formatPopulation } from '../utils/formatters';

export const ScenarioResults: React.FC = () => {
  const navigate = useNavigate();
  const {
    scenario,
    runScenarioReoptimization,
    applyScenarioToMainPlan,
    activePlanId,
  } = useAppStore();


  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [rationale, setRationale] = useState(
    'Promoting scenario contingency to active operational baseline based on multi-criteria sensitivity assessment.'
  );

  const handleApply = async () => {
    if (!rationale.trim()) {
      alert('Please provide an operational rationale.');
      return;
    }
    await applyScenarioToMainPlan(rationale);
    setApplyModalOpen(false);
    navigate('/decisions/current-plan');
  };

  if (!scenario.scenarioDelta) {
    return (
      <div className="p-6 max-w-4xl mx-auto my-12 text-center space-y-4 font-sans bg-white border border-slate-200 rounded-xl p-8 shadow-xs">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-[32px]">science</span>
        </div>
        <h2 className="text-xl font-bold text-slate-800">No Scenario Run Recorded Yet</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Configure road closures, habitation demand spikes, or shelter capacity overrides in the
          Scenario Planner to generate a Before vs. After optimization comparison.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <button
            onClick={() => navigate('/scenario/planner')}
            className="px-4 py-2 bg-[#003366] text-white font-bold text-xs rounded shadow-xs hover:bg-[#002244]"
          >
            Open Scenario Planner
          </button>
          <button
            onClick={() => runScenarioReoptimization()}
            className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded shadow-xs hover:bg-amber-400"
          >
            Run Default Stress Test
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold uppercase">
              SOLVER COMPARISON DELTA
            </span>
            <span className="text-xs text-slate-500 font-mono">SCIP MILP • 0-GAP OPTIMAL</span>
          </div>
          <h1 className="text-2xl font-bold text-[#003366] mt-1">
            What-If Scenario Re-optimization Results
          </h1>
          <p className="text-xs text-slate-600">
            Contingency: <strong className="text-slate-800">{scenario.scenarioName}</strong> compared against baseline{' '}
            <strong className="text-slate-800">{activePlanId}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/scenario/planner')}
            className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded hover:bg-slate-50 shadow-xs"
          >
            Adjust Parameters
          </button>
          <button
            onClick={() => navigate('/scenario/gis')}
            className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold rounded hover:bg-blue-100 shadow-xs"
          >
            View in Scenario GIS
          </button>
          <button
            onClick={() => setApplyModalOpen(true)}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded shadow-xs transition"
          >
            Apply to Main Plan
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="gov-card p-4">
          <div className="text-[10px] uppercase font-bold text-slate-500 font-mono">Diverted Citizens</div>
          <div className="text-2xl font-black text-amber-700 font-mono mt-1">
            {formatPopulation(scenario.scenarioDelta.divertedCount)}
          </div>
          <div className="text-[10px] text-slate-500">Rerouted from initial corridor</div>
        </div>

        <div className="gov-card p-4">
          <div className="text-[10px] uppercase font-bold text-slate-500 font-mono">Distance Shift</div>
          <div className="text-2xl font-black text-[#003366] font-mono mt-1">
            +{scenario.scenarioDelta.distanceDeltaKm} km
          </div>
          <div className="text-[10px] text-slate-500">Net detour transit</div>
        </div>

        <div className="gov-card p-4">
          <div className="text-[10px] uppercase font-bold text-slate-500 font-mono">Cost Outlay Delta</div>
          <div className="text-2xl font-black text-emerald-700 font-mono mt-1">
            +₹{scenario.scenarioDelta.costDeltaLakhs} L
          </div>
          <div className="text-[10px] text-slate-500">Fleet operations adjustment</div>
        </div>

        <div className="gov-card p-4">
          <div className="text-[10px] uppercase font-bold text-slate-500 font-mono">Solver Latency</div>
          <div className="text-2xl font-black text-indigo-700 font-mono mt-1">
            {scenario.solverExecutionMs} ms
          </div>
          <div className="text-[10px] text-slate-500">OR-Tools SCIP Execution</div>
        </div>
      </div>

      {/* Diverted Table */}
      <div className="gov-card p-4 space-y-3">
        <h3 className="text-xs font-bold text-[#003366] uppercase font-mono tracking-wider">
          HABITATION DISPATCH DIVERSIONS
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-mono text-[10px] uppercase border-b">
              <tr>
                <th className="py-2 px-2.5">Habitation</th>
                <th className="py-2 px-2">Original Destination</th>
                <th className="py-2 px-2">Scenario Re-assignment</th>
                <th className="py-2 px-2 text-right">Citizens Diverted</th>
                <th className="py-2 px-2">Reason for Diversion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {scenario.scenarioDelta.divertedHabitations.map((div, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-2 px-2.5 font-bold text-slate-900">{div.habitationName}</td>
                  <td className="py-2 px-2 font-mono text-slate-500">{div.fromSiteName}</td>
                  <td className="py-2 px-2 font-mono font-bold text-emerald-800">{div.toSiteName}</td>
                  <td className="py-2 px-2 text-right font-black font-mono text-amber-900">
                    {formatPopulation(div.count)}
                  </td>
                  <td className="py-2 px-2 text-slate-600 text-[11px]">
                    Transit corridor optimization / capacity constraint
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Modal */}
      {applyModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[2000] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 font-sans">
            <div className="flex items-center gap-2 text-emerald-800">
              <span className="material-symbols-outlined text-[26px]">gavel</span>
              <h2 className="text-base font-bold text-slate-900">
                Commit Scenario to Operational Baseline
              </h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Applying this scenario commits all recalculated assignments to the authoritative main plan,
              bumps the version to <strong className="text-[#003366]">#VST-2026-CHM-015</strong>, and files
              a permanent entry in the Section 34 Statutory Audit Ledger.
            </p>
            <div>
              <label className="block text-xs font-bold text-[#003366] uppercase mb-1">
                Mandatory Officer Rationale
              </label>
              <textarea
                rows={3}
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#003366]"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setApplyModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="px-5 py-2 text-xs font-bold bg-[#003366] hover:bg-[#002244] text-white rounded-lg shadow-sm"
              >
                Confirm &amp; Commit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
