# VISTHAAPAN Backend (Node.js + Express API Gateway)

This service provides the core application and API gateway layer for the **VISTHAAPAN Portal** (Vulnerability Intelligence and Spatial Transit for Hazard Affected Population Allocation Network).

## Architecture & Current Status

This service is currently at **Phase 3: PostgreSQL + PostGIS Database Foundation**.

```text
STATUS BY SUBSYSTEM:
├── REST API Framework:      ✅ OPERATIONAL (Node.js 24 + Express 4 + TypeScript)
├── Standard Response Envs:  ✅ OPERATIONAL (Uniform success & error envelope)
├── Request Logging & ID:    ✅ OPERATIONAL (Pino + X-Request-Id correlation)
├── CORS & Security:         ✅ OPERATIONAL (Bounded to FRONTEND_ORIGIN)
├── Health Verification:     ✅ OPERATIONAL (GET /api/v1/health with Live DB Check)
├── DATABASE (PostgreSQL):   ✅ OPERATIONAL (PostgreSQL 16.4 + PostGIS 3.4.3, 43 Tables)
│
├── AI RISK ENGINE (ML):     ⏳ NOT IMPLEMENTED YET (Phase 5)
├── GIS SPATIAL ENGINE:      ⏳ NOT IMPLEMENTED YET (Phase 6)
├── CARRYING CAPACITY:       ⏳ NOT IMPLEMENTED YET (Phase 7)
└── OR-TOOLS SOLVER:         ⏳ NOT IMPLEMENTED YET (Phase 8)
```

> [!IMPORTANT]
> **No Mock Computation in Backend**: Unlike previous prototypes, this backend does not simulate mathematical optimization using greedy heuristics or static hardcoded arrays. Real optimization will be executed in Phase 8 via a dedicated Python OR-Tools solver. Full schema documentation is available in [database.md](docs/database.md).

## Prerequisites

- **Node.js**: `v20.0.0+` (Tested on `v24.12.0`)
- **npm**: `v10.0.0+`

## Setup & Installation

```bash
cd backend
npm install
```

## Environment Configuration

Copy the sample environment configuration:

```bash
cp .env.example .env
```

Configurable variables:

| Variable | Default | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `development` | Runtime environment (`development`, `production`, `test`) |
| `PORT` | `5000` | HTTP port for the Express server |
| `API_PREFIX` | `/api/v1` | Canonical API prefix matching frontend service boundary |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | Allowed CORS origin (Vite frontend dev server) |
| `LOG_LEVEL` | `info` (or `debug` in dev) | Pino logging verbosity |

## Scripts

```bash
# Start development server with hot reload (tsx)
npm run dev

# Check TypeScript types
npm run typecheck

# Build for production (TypeScript compile to dist/)
npm run build

# Start production server
npm run start
```

## API Surface (Phase 2)

### 1. Root API Information
- **Endpoint**: `GET /api/v1`
- **Description**: Returns service metadata, environment status, and pipeline subsystem readiness.
- **Sample Response**:
  ```json
  {
    "success": true,
    "data": {
      "service": "VISTHAAPAN API",
      "version": "v1",
      "environment": "development",
      "description": "Vulnerability Intelligence and Spatial Transit for Hazard Affected Population Allocation Network",
      "docs": "Authoritative specification in docs/",
      "pipelineStage": "Phase 2: Node.js + Express Backend Foundation",
      "modules": {
        "health": "operational",
        "database": "unconfigured (Phase 3 pending)",
        "ai_risk_engine": "unconfigured (Phase 5 pending)",
        "gis_spatial_engine": "unconfigured (Phase 6 pending)",
        "carrying_capacity": "unconfigured (Phase 7 pending)",
        "or_tools_solver": "unconfigured (Phase 8 pending)"
      }
    }
  }
  ```

### 2. Service Health Check
- **Endpoint**: `GET /api/v1/health`
- **Description**: Confirms that Node.js, Express, routing, and configuration are functioning. Does not fake database health.
- **Sample Response**:
  ```json
  {
    "success": true,
    "service": "VISTHAAPAN API",
    "status": "healthy",
    "version": "v1",
    "timestamp": "2026-09-17T20:28:00.000Z",
    "uptimeSeconds": 14.52,
    "environment": "development"
  }
  ```

## Standard Response Conventions

### Success Format
```json
{
  "success": true,
  "data": { ... },
  "meta": { ... }
}
```

### Error Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description",
    "details": { ... }
  }
}
```
