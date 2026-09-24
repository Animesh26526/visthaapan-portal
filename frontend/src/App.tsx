import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from './i18n';
import { AppShell } from './components/layout/AppShell';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import './App.css';

// Public Landing & Auth Pages
import { Home } from './pages/Home';
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';

// 1. Operations Workspace Pages
import { CommandCenter } from './pages/CommandCenter';
import { RiskGIS } from './pages/RiskGIS';
import { HabitationDetail } from './pages/HabitationDetail';
import { RiskIntelligence } from './pages/RiskIntelligence';

// 2. Planning Workspace Pages
import { RelocationCapacity } from './pages/RelocationCapacity';
import { OptimalAllocation } from './pages/OptimalAllocation';
import { AllocationExplainability } from './pages/AllocationExplainability';
import { RelocationPlan } from './pages/RelocationPlan';

// 3. Scenario Workspace Pages
import { ScenarioLab } from './pages/ScenarioLab';
import { ScenarioGIS } from './pages/ScenarioGIS';
import { ScenarioResults } from './pages/ScenarioResults';

// 4. Decisions Workspace Pages
import { OfficerReview } from './pages/OfficerReview';
import { PreviousPlans } from './pages/PreviousPlans';
import { DecisionHistory } from './pages/DecisionHistory';

// 5. Intelligence Workspace Pages
import { Analytics } from './pages/Analytics';
import { DataEvidence } from './pages/DataEvidence';
import { DataQuality } from './pages/DataQuality';
import { TechnicalExplainer } from './pages/TechnicalExplainer';

import { useAppStore } from './stores/useAppStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, fetchApiData } = useAppStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchApiData();
    }
  }, [isAuthenticated, fetchApiData]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Exactly ONE Canonical Home destination */}
              <Route
                path="/"
                element={
                  <AuthGate>
                    <AppShell>
                      <Home />
                    </AppShell>
                  </AuthGate>
                }
              />

              {/* Redirect duplicate dashboard to canonical Home */}
              <Route path="/dashboard" element={<Navigate to="/" replace />} />

              {/* ──────────────── 1. OPERATIONS WORKSPACE ──────────────── */}
              <Route
                path="/operations"
                element={<Navigate to="/operations/command-center" replace />}
              />
              <Route
                path="/operations/command-center"
                element={
                  <AuthGate>
                    <AppShell>
                      <CommandCenter />
                    </AppShell>
                  </AuthGate>
                }
              />
              <Route
                path="/operations/gis"
                element={
                  <AuthGate>
                    <AppShell>
                      <RiskGIS />
                    </AppShell>
                  </AuthGate>
                }
              />
              <Route
                path="/operations/habitations"
                element={
                  <AuthGate>
                    <AppShell>
                      <HabitationDetail />
                    </AppShell>
                  </AuthGate>
                }
              />
              <Route
                path="/operations/habitations/:habitationId"
                element={
                  <AuthGate>
                    <AppShell>
                      <HabitationDetail />
                    </AppShell>
                  </AuthGate>
                }
              />
              <Route
                path="/operations/risk-intelligence"
                element={
                  <AuthGate>
                    <AppShell>
                      <RiskIntelligence />
                    </AppShell>
                  </AuthGate>
                }
              />

              {/* ──────────────── 2. PLANNING WORKSPACE ──────────────── */}
              <Route
                path="/planning"
                element={<Navigate to="/planning/capacity" replace />}
              />
              <Route
                path="/planning/capacity"
                element={
                  <AuthGate>
                    <AppShell>
                      <RelocationCapacity />
                    </AppShell>
                  </AuthGate>
                }
              />
              <Route
                path="/planning/allocation"
                element={
                  <AuthGate>
                    <AppShell>
                      <OptimalAllocation />
                    </AppShell>
                  </AuthGate>
                }
              />
              <Route
                path="/planning/why-this-plan"
                element={
                  <AuthGate>
                    <AppShell>
                      <AllocationExplainability />
                    </AppShell>
                  </AuthGate>
                }
              />
              <Route
                path="/planning/relocation-plan"
                element={
                  <AuthGate>
                    <AppShell>
                      <RelocationPlan />
                    </AppShell>
                  </AuthGate>
                }
              />

              {/* ──────────────── 3. SCENARIO WORKSPACE ──────────────── */}
              <Route
                path="/scenario"
                element={<Navigate to="/scenario/planner" replace />}
              />
              <Route
                path="/scenario/planner"
                element={
                  <AuthGate>
                    <AppShell>
                      <ScenarioLab />
                    </AppShell>
                  </AuthGate>
                }
              />
              <Route
                path="/scenario/gis"
                element={
                  <AuthGate>
                    <AppShell>
                      <ScenarioGIS />
                    </AppShell>
                  </AuthGate>
                }
              />
              <Route
                path="/scenario/results"
                element={
                  <AuthGate>
                    <AppShell>
                      <ScenarioResults />
                    </AppShell>
                  </AuthGate>
                }
              />

              {/* ──────────────── 4. DECISIONS WORKSPACE ──────────────── */}
              <Route
                path="/decisions"
                element={<Navigate to="/decisions/review" replace />}
              />
              <Route
                path="/decisions/current-plan"
                element={
                  <AuthGate>
                    <AppShell>
                      <RelocationPlan />
                    </AppShell>
                  </AuthGate>
                }
              />
              <Route
                path="/decisions/review"
                element={
                  <AuthGate>
                    <AppShell>
                      <OfficerReview />
                    </AppShell>
                  </AuthGate>
                }
              />
              <Route
                path="/decisions/previous-plans"
                element={
                  <AuthGate>
                    <AppShell>
                      <PreviousPlans />
                    </AppShell>
                  </AuthGate>
                }
              />
              <Route
                path="/decisions/audit"
                element={
                  <AuthGate>
                    <AppShell>
                      <DecisionHistory />
                    </AppShell>
                  </AuthGate>
                }
              />

              {/* ──────────────── 5. INTELLIGENCE WORKSPACE ──────────────── */}
              <Route
                path="/intelligence"
                element={<Navigate to="/intelligence/analytics" replace />}
              />
              <Route
                path="/intelligence/analytics"
                element={
                  <AuthGate>
                    <AppShell>
                      <Analytics />
                    </AppShell>
                  </AuthGate>
                }
              />
              <Route
                path="/intelligence/evidence"
                element={
                  <AuthGate>
                    <AppShell>
                      <DataEvidence />
                    </AppShell>
                  </AuthGate>
                }
              />
              <Route
                path="/intelligence/quality"
                element={
                  <AuthGate>
                    <AppShell>
                      <DataQuality />
                    </AppShell>
                  </AuthGate>
                }
              />
              <Route
                path="/intelligence/system-overview"
                element={
                  <AuthGate>
                    <AppShell>
                      <TechnicalExplainer />
                    </AppShell>
                  </AuthGate>
                }
              />

              {/* ──────────────── COMPATIBILITY ALIASES ──────────────── */}
              {/* Workspace 1 aliases */}
              <Route path="/risk-gis" element={<Navigate to="/operations/gis" replace />} />
              <Route path="/habitations" element={<Navigate to="/operations/habitations" replace />} />
              <Route path="/habitations/:habitationId" element={<Navigate to="/operations/habitations" replace />} />

              {/* Workspace 2 aliases */}
              <Route path="/capacity" element={<Navigate to="/planning/capacity" replace />} />
              <Route path="/relocation-sites" element={<Navigate to="/planning/capacity" replace />} />
              <Route path="/risk-intelligence" element={<Navigate to="/operations/risk-intelligence" replace />} />
              <Route path="/operations-research" element={<Navigate to="/intelligence/system-overview" replace />} />
              <Route path="/optimal-allocation" element={<Navigate to="/planning/allocation" replace />} />
              <Route path="/capacity-intelligence" element={<Navigate to="/planning/capacity" replace />} />
              <Route path="/allocation-engine" element={<Navigate to="/planning/allocation" replace />} />

              {/* Workspace 3 aliases */}
              <Route path="/scenario-lab" element={<Navigate to="/scenario/planner" replace />} />

              {/* Workspace 4 aliases */}
              <Route path="/relocation-plan" element={<Navigate to="/decisions/current-plan" replace />} />
              <Route path="/officer-review" element={<Navigate to="/decisions/review" replace />} />
              <Route path="/decision-history" element={<Navigate to="/decisions/audit" replace />} />
              <Route path="/adjudication" element={<Navigate to="/decisions/review" replace />} />

              {/* Workspace 5 aliases */}
              <Route path="/analytics" element={<Navigate to="/intelligence/analytics" replace />} />
              <Route path="/data-evidence" element={<Navigate to="/intelligence/evidence" replace />} />
              <Route path="/data-quality" element={<Navigate to="/intelligence/quality" replace />} />
              <Route path="/system-intelligence" element={<Navigate to="/intelligence/analytics" replace />} />

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
