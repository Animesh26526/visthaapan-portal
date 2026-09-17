import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from './components/layout/AppShell';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import './App.css';

// Public Landing Page & Auth
import { Home } from './pages/Home';
import { LandingHome } from './pages/LandingHome';
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';

// 5 Consolidated Operational Workspaces
import { OperationsWorkspace } from './pages/workspaces/OperationsWorkspace';
import { CapacityIntelligenceWorkspace } from './pages/workspaces/CapacityIntelligenceWorkspace';
import { AllocationEngineWorkspace } from './pages/workspaces/AllocationEngineWorkspace';
import { AdjudicationWorkspace } from './pages/workspaces/AdjudicationWorkspace';
import { SystemIntelligenceWorkspace } from './pages/workspaces/SystemIntelligenceWorkspace';

import { useAppStore } from './stores/useAppStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

import { useEffect } from 'react';

import { useLocation } from 'react-router-dom';

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
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Primary Portal Routes Protected by AuthGate */}
          <Route
            path="/"
            element={
              <AuthGate>
                <AppShell>
                  <LandingHome />
                </AppShell>
              </AuthGate>
            }
          />
          <Route
            path="/dashboard"
            element={
              <AuthGate>
                <AppShell>
                  <Home />
                </AppShell>
              </AuthGate>
            }
          />

          {/* 5 Primary Consolidated Workspaces in Universal AppShell */}
          <Route
            path="/operations"
            element={
              <AuthGate>
                <AppShell>
                  <OperationsWorkspace />
                </AppShell>
              </AuthGate>
            }
          />
          <Route
            path="/capacity-intelligence"
            element={
              <AuthGate>
                <AppShell>
                  <CapacityIntelligenceWorkspace />
                </AppShell>
              </AuthGate>
            }
          />
          <Route
            path="/allocation-engine"
            element={
              <AuthGate>
                <AppShell>
                  <AllocationEngineWorkspace />
                </AppShell>
              </AuthGate>
            }
          />
          <Route
            path="/adjudication"
            element={
              <AuthGate>
                <AppShell>
                  <AdjudicationWorkspace />
                </AppShell>
              </AuthGate>
            }
          />
          <Route
            path="/system-intelligence"
            element={
              <AuthGate>
                <AppShell>
                  <SystemIntelligenceWorkspace />
                </AppShell>
              </AuthGate>
            }
          />

          {/* Compatibility Routes for Seamless Interoperability */}
          {/* Workspace 1 aliases */}
          <Route path="/risk-gis" element={<Navigate to="/operations?tab=gis" replace />} />
          <Route path="/habitations" element={<Navigate to="/operations?tab=dossier" replace />} />
          <Route path="/habitations/:habitationId" element={<Navigate to="/operations?tab=dossier" replace />} />

          {/* Workspace 2 aliases */}
          <Route path="/capacity" element={<Navigate to="/capacity-intelligence?tab=capacity" replace />} />
          <Route path="/relocation-sites" element={<Navigate to="/capacity-intelligence?tab=capacity" replace />} />
          <Route path="/risk-intelligence" element={<Navigate to="/capacity-intelligence?tab=risk" replace />} />
          <Route path="/operations-research" element={<Navigate to="/capacity-intelligence?tab=benchmark" replace />} />

          {/* Workspace 3 aliases */}
          <Route path="/optimal-allocation" element={<Navigate to="/allocation-engine?tab=solver" replace />} />
          <Route path="/allocation/:allocationId" element={<Navigate to="/allocation-engine?tab=solver" replace />} />
          <Route path="/allocation/:allocationId/why" element={<Navigate to="/allocation-engine?tab=why" replace />} />
          <Route path="/scenario-lab" element={<Navigate to="/allocation-engine?tab=stress" replace />} />

          {/* Workspace 4 aliases */}
          <Route path="/relocation-plan" element={<Navigate to="/adjudication?tab=phased" replace />} />
          <Route path="/officer-review" element={<Navigate to="/adjudication?tab=review" replace />} />
          <Route path="/decision-history" element={<Navigate to="/adjudication?tab=audit" replace />} />

          {/* Workspace 5 aliases */}
          <Route path="/analytics" element={<Navigate to="/system-intelligence?tab=analytics" replace />} />
          <Route path="/data-evidence" element={<Navigate to="/system-intelligence?tab=evidence" replace />} />
          <Route path="/data-quality" element={<Navigate to="/system-intelligence?tab=quality" replace />} />
          <Route path="/intelligence" element={<Navigate to="/system-intelligence?tab=architecture" replace />} />

          {/* Fallback to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>
  );
}

export default App;
