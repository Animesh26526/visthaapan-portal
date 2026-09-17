# VISTHAAPAN Portal

**VISTHAAPAN** (Vulnerability Intelligence and Spatial Transit for Hazard Affected Population Allocation Network) is an operations research and AI-driven decision-support platform for disaster management authorities in vulnerable Himalayan regions (e.g., Chamoli District, Uttarakhand).

## Repository Architecture

```text
VISTHAAPAN-PORTAL/
├── docs/       # Authoritative project architecture, frameworks, and database specification
├── frontend/   # React 19 + TypeScript + Vite + Tailwind CSS Operations Center Dashboard
└── backend/    # Node.js + Express REST API Gateway (Foundation)
```

## Workspaces & Components

- **`docs/`**: Master blueprints including mathematical OR formulations, 42-table relational schema, technical implementation plan, and defense proofs.
- **`frontend/`**: Government Emergency Operations Center (EOC) UI interface providing 5 consolidated operational workspaces, interactive Leaflet GIS, and client service adapters.
- **`backend/`**: Node.js + Express REST API (`/api/v1`) orchestrating authentication, request validation, future PostgreSQL/PostGIS persistence, and future Python computational microservices.

## Getting Started

Refer to individual application directories:
- [Frontend README](frontend/README.md)
- [Backend README](backend/README.md)
