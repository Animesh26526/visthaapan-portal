# VISTHAAPAN (विस्थापन)

> **Vulnerability Intelligence and Spatial Transit for Hazard-Affected Population Allocation Network**  
> *A Mathematical Optimization and Geospatial Decision-Support System for Himalayan Disaster Relocation & Evacuation Planning (Chamoli District Pilot, Uttarakhand)*

[![React 19](https://img.shields.io/badge/Frontend-React_19_+_TypeScript-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js_22_+_Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL PostGIS](https://img.shields.io/badge/Database-PostgreSQL_16_+_PostGIS-336791?logo=postgresql&logoColor=white)](https://postgis.net/)
[![Google OR-Tools](https://img.shields.io/badge/Math_Optimization-Google_OR--Tools_SCIP-4285F4?logo=google&logoColor=white)](https://developers.google.com/optimization)
[![Groq Cloud AI](https://img.shields.io/badge/AI_Copilot-Groq_GPT--OSS--20B-F55036?logo=groq&logoColor=white)](https://groq.com/)
[![Tailwind CSS](https://img.shields.io/badge/UI_Styling-Tailwind_CSS_v3-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## ⚠️ Statutory Human-in-the-Loop Disclaimer

> **IMPORTANT STATUTORY NOTICE:**  
> **VISTHAAPAN is strictly an operational decision-support and mathematical scenario-modeling advisory system.**  
> It **DOES NOT** automate executive evacuation orders, statutory land acquisitions, or population displacement. Under the **Disaster Management Act, 2005 (Sections 30 & 34)**, statutory authority remains exclusively vested in the District Magistrate (DM) / District Disaster Management Authority (DDMA), the District Emergency Operations Centre (DEOC), and the State Disaster Management Authority (SDMA). All AI assessments and mathematical allocations are advisory and require review, contextual override, and digital authorization by accredited nodal officers.

---

## 🗺️ The Operational Challenge & Himalayan Context

Chamoli District in Uttarakhand is one of the most vulnerable alpine disaster theaters in India. Situated in **Seismic Zone V**, the district experiences recurrent seismic activity, steep slope instabilities (landslides and rockfalls), flash floods (such as the 2021 Rishi Ganga disaster), glacial lake outburst floods (GLOFs), cloudbursts, and rapid land subsidence (exemplified by the Joshimath crisis).

During crisis onset, emergency responders face critical challenges:
1. **Multi-Hazard Vulnerability**: Habitations face compounding hazards (slope > 35°, heavy precipitation, seismic shear).
2. **Constrained Himalayan Corridors**: Valley roads are narrow, prone to landslides, single-lane, and easily severed.
3. **Site Viability & Overcrowding**: Temporary shelters rapidly fail when population intake exceeds water, sanitation, medical triage, or shelter capacities.
4. **Social & Family Cohesion**: Manual ad-hoc evacuations frequently separate families and disperse village communities across disconnected camps.
5. **Information Overload**: Incident commanders need clear, explainable, and accountable situational intelligence under tight timelines.

**VISTHAAPAN** addresses these challenges by uniting **PostGIS spatial intelligence**, **Google OR-Tools Mixed-Integer Linear Programming (MILP)**, and **Groq Cloud LLM briefings** into a single unified emergency operations center portal.

---

## 🚀 Key Capabilities

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              VISTHAAPAN CORE                                │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│  Spatial & Hazard    │   Capacity & Math    │    Officer Command & AI       │
│  Intelligence        │   Optimization       │    Adjudication               │
├──────────────────────┼──────────────────────┼───────────────────────────────┤
│ • PostGIS Geo Engine │ • SCIP MILP Solver   │ • Human-in-the-Loop Override  │
│ • Elevation Profiles │ • 5-Vector Capacity  │ • SHA-256 Signed Dossiers     │
│ • Road Choke Points  │ • Family Cohesion    │ • Bilingual AI Operational    │
│ • Hazard Susceptibility│ • Transit Risk Min │   Briefings (English & Hindi) │
└──────────────────────┴──────────────────────┴───────────────────────────────┘
```

### 1. Hazard Intelligence & Vulnerability Assessment
- Evaluates multi-hazard risk across Chamoli habitations (e.g., Joshimath, Raini, Helang, Pandukeshwar, Mana, Pipalkoti).
- Integrates slope gradient, seismic zone classification, landslide susceptibility indices, rainfall thresholds, and historical disaster proximity.
- Dynamically assigns priority classifications (Critical P1, High P2, Moderate P3).

### 2. Spatial GIS & Evacuation Corridors
- High-fidelity interactive Leaflet GIS with dark and topographic base maps.
- Real-time corridor vulnerability analysis: identifies critical choke points, high-risk river valley roads, and alternate bypass routes.
- Visualizes elevation profiles, route transit distances, and reception site safety buffers.

### 3. Multi-Resource Carrying Capacity Engine
- Rigorously validates destination sites against five indispensable humanitarian metrics:
  - **Shelter Space** (m² per person per NDMA standards)
  - **Potable Water Supply** (liters/capita/day)
  - **Sanitation Units** (toilets/person)
  - **Medical Support** (beds, trauma triage, medical staff)
  - **Electrical & Backup Power** (generator kW capacity)
- Flags red-line capacity breaches to prevent camp collapse and disease outbreaks.

### 4. Operations Research Mathematical Allocation (MILP)
- Powered by **Google OR-Tools SCIP solver** (`backend/ai/or/solver.py`).
- Solves a formal Mixed-Integer Linear Program minimizing total transit risk and travel time subject to:
  - Hard site carrying capacity bounds
  - Habitation-level evacuation demand
  - Village and family non-fragmentation penalties
  - Road corridor safety thresholds
- Computes provably optimal allocation matrices in sub-second execution time.

### 5. Dynamic Scenario Lab & Stress Testing
- Real-time simulation of emergency events:
  - **Monsoon Cloudburst Surge** (+40% evacuation demand)
  - **Badrinath Highway Choke Point Severance** (disables primary transit route)
  - **Active Landslide / Subsidence Acceleration**
- Instant differential recalculation comparing baseline vs. stress scenarios (unallocated population delta, transit time variance).

### 6. Statutory Officer Adjudication & Audit Trail
- Nodal officers can inspect mathematical recommendations, apply field overrides, and record statutory justifications.
- Generates tamper-evident, SHA-256 hashed **Digital Relocation Dossiers** for administrative record-keeping under the Disaster Management Act, 2005.

### 7. AI Sahayak & Bilingual Operational Briefing
- Integrated with **Groq Cloud LLM** (`openai/gpt-oss-20b`).
- Synthesizes real-time incident commander situation reports in both **English** and **Hindi (हिन्दी)**.
- Integrated browser speech synthesis for audio tactical briefings in DEOC conference rooms.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph Client ["Frontend (Vercel)"]
        UI["React 19 + TypeScript + Vite"]
        TW["Tailwind CSS + Lucide Icons"]
        GIS_UI["Leaflet + OpenStreetMap Layers"]
        STATE["Zustand Store + TanStack React Query"]
    end

    subgraph Server ["Backend API Gateway (Render Docker)"]
        EX["Node.js 22 + Express REST API (/api/v1)"]
        CORS["Configurable Dynamic CORS"]
        ROUTES["Modular Route Controllers"]
        DB_POOL["pg Connection Pool (SSL enabled)"]
    end

    subgraph Optimization ["Math Optimization Engine"]
        PY["Python 3.11 Runtime"]
        OR["Google OR-Tools (SCIP MILP Solver)"]
        SOLVER["ai/or/solver.py IPC via Stdin/Stdout"]
    end

    subgraph Storage ["Spatial Database (Supabase)"]
        PG["PostgreSQL 16 Engine"]
        GIS["PostGIS Spatial Extension"]
        TABLES["Habitations, Sites, Corridors, Dossiers, Migrations"]
    end

    subgraph AI ["AI Intelligence (Groq Cloud)"]
        GROQ["Groq Fast Inference API"]
        MODEL["openai/gpt-oss-20b"]
        BRIEF["Bilingual Strategic Briefings (EN / HI)"]
    end

    UI -->|HTTPS / REST API| EX
    EX -->|Dynamic SQL / Pool| PG
    PG --- GIS
    EX -->|Subprocess IPC| PY
    PY --> OR
    OR --> SOLVER
    EX -->|Inference Requests| GROQ
    GROQ --> MODEL
```

---

## 🖥️ Operational Workspaces

The portal provides 5 purpose-built command workspaces accessible via the top navigation bar:

| Workspace | Routes | Operational Purpose |
|:---|:---|:---|
| **1. Operations** | `/operations/command-center`<br>`/operations/gis`<br>`/operations/habitations`<br>`/operations/risk-intelligence` | Real-time district status overview, multi-layer GIS hazard map, detailed village vulnerability profiles, and seismic/landslide indicators. |
| **2. Planning** | `/planning/capacity`<br>`/planning/allocation`<br>`/planning/why-this-plan`<br>`/planning/relocation-plan` | Reception camp carrying capacities, OR-Tools mathematical allocation runner, mathematical explainability matrix, and finalized transit plan. |
| **3. Scenario Lab** | `/scenario/planner`<br>`/scenario/gis`<br>`/scenario/results` | Dynamic hazard simulation (monsoon surge, road blockages), spatial scenario impact mapping, and comparative delta analytics. |
| **4. Decisions** | `/decisions/review`<br>`/decisions/current-plan`<br>`/decisions/previous-plans`<br>`/decisions/audit` | Statutory officer override workspace, reason logging, historical plan archive, and SHA-256 digital dossier verification. |
| **5. Intelligence** | `/intelligence/analytics`<br>`/intelligence/evidence`<br>`/intelligence/quality`<br>`/intelligence/system-overview` | District macro trends, Chamoli DDMP 2026-27 evidence and provenance registry, data quality validation, and technical architecture explainer. |

---

## ⚡ Quick Deployment Guide

### Architecture Overview
- **Frontend**: Hosted on **Vercel** (Global CDN, fast client routing)
- **Backend**: Hosted on **Render** using Docker (`backend/Dockerfile` with Node.js 22 + Python 3 + Google OR-Tools)
- **Database**: Hosted on **Supabase** (Managed PostgreSQL 16 + PostGIS)
- **AI Engine**: **Groq Cloud API** (`openai/gpt-oss-20b` for ultra-fast generation)

---

### Step 1: Database Setup (Supabase)
1. Sign up at [supabase.com](https://supabase.com) and create a new project.
2. In your Supabase dashboard, open the **SQL Editor** and enable the PostGIS extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```
3. Copy your project connection string from **Project Settings > Database > Connection String (URI)**:
   ```
   postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
   ```
4. Run the schema migrations from your local machine to populate the database:
   ```bash
   cd backend
   DATABASE_URL="<your-supabase-connection-string>" npm run db:migrate
   ```
   *(Note: The backend also has full built-in canonical Chamoli datasets for all planning entities, ensuring zero-interruption demonstration even if database connectivity is offline).*

---

### Step 2: Backend Deployment (Render Docker)
1. Sign up at [render.com](https://render.com) and click **New > Web Service**.
2. Connect your GitHub repository.
3. Configure the service settings:
   - **Name**: `visthaapan-api`
   - **Root Directory**: `backend`
   - **Language / Environment**: `Docker`
   - **Dockerfile Path**: `Dockerfile`
4. Set the Environment Variables:
   | Variable | Value | Description |
   |:---|:---|:---|
   | `NODE_ENV` | `production` | Production mode |
   | `PORT` | `5000` | Render port (auto-mapped) |
   | `FRONTEND_ORIGIN` | `https://your-frontend.vercel.app,http://localhost:5173` | Allowed origins for CORS |
   | `DATABASE_URL` | `<your-supabase-db-url>` | PostgreSQL connection string |
   | `GROQ_API_KEY` | `<your-groq-api-key>` | Key from console.groq.com |
   | `GROQ_MODEL` | `openai/gpt-oss-20b` | Groq high-speed model |
5. Click **Create Web Service**. Render will build the Docker container (Node 22 + Python 3 + OR-Tools), start the server, and assign a URL: `https://visthaapan-api.onrender.com`.

---

### Step 3: Frontend Deployment (Vercel)
1. Sign up at [vercel.com](https://vercel.com) and click **Add New > Project**.
2. Import your GitHub repository.
3. In project configuration:
   - **Root Directory**: Click edit and select `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add the Environment Variable:
   | Variable | Value | Description |
   |:---|:---|:---|
   | `VITE_API_URL` | `https://visthaapan-api.onrender.com/api/v1` | Points to your deployed Render backend |
5. Click **Deploy**. Vercel will build the frontend and provide your production URL.
6. Copy your Vercel URL (e.g., `https://visthaapan.vercel.app`) and ensure it is included in your Render backend `FRONTEND_ORIGIN` environment variable.

---

## 🛠️ Local Development Setup

### Prerequisites
- **Node.js**: v20.x or v22.x
- **Python**: v3.10+ (for Google OR-Tools optimization engine)
- **Git**
- *(Optional)* **PostgreSQL with PostGIS** extension (or use Supabase connection string)

### 1. Clone the Repository
```bash
git clone https://github.com/Animesh26526/visthaapan-portal.git
cd visthaapan-portal
```

### 2. Backend Setup
```bash
cd backend

# Install Node dependencies
npm install

# Setup Python virtual environment & install OR-Tools
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and supply your GROQ_API_KEY and DATABASE_URL if available

# Run database migrations (if PostgreSQL is running)
npm run db:migrate

# Start backend development server (watches on port 5000)
npm run dev
```

### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Ensure VITE_API_URL=http://localhost:5000/api/v1

# Start Vite development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Verification & Automated Testing

The repository contains an end-to-end test suite verifying database integration, GIS calculations, carrying capacity formulas, OR-Tools optimization, and API controllers.

```bash
cd backend

# Run the complete test suite
npm run test:all

# Run specific domain tests
npm run test:gis          # Spatial corridor and choke point tests
npm run test:capacity     # 5-vector carrying capacity constraint tests
npm run test:optimization # OR-Tools SCIP solver mathematical test
npm run test:ai           # Groq LLM integration and deterministic fallback
npm run test:operations   # PS 26191 Chamoli relocation plan contract tests
```

---

## 📡 API Reference Summary

All API endpoints are prefixed with `/api/v1`.

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/health` | System health check, PostgreSQL status, Python OR-Tools status, Groq status |
| `GET` | `/operations/plan` | Active Chamoli operational relocation plan, habitations, sites, corridors |
| `GET` | `/operations/habitations` | Chamoli habitations with vulnerability scores and census demographics |
| `GET` | `/operations/sites` | Relocation reception sites with 5-vector carrying capacity metrics |
| `GET` | `/gis/layers` | PostGIS spatial layers, hazard polygons, and evacuation corridors |
| `GET` | `/gis/choke-points` | Road bottleneck and landslide blockage risk ratings |
| `GET` | `/capacity/summary` | Aggregate district carrying capacity vs. total displaced population |
| `POST`| `/optimization/run` | Triggers Google OR-Tools SCIP solver for constrained optimal allocation |
| `GET` | `/scenarios` | Pre-configured disaster simulation scenarios (Monsoon surge, Choke severance) |
| `POST`| `/scenarios/run` | Runs dynamic re-optimization under simulated hazard constraints |
| `POST`| `/decisions/override` | Records officer manual override with mandatory statutory justification |
| `GET` | `/decisions/dossier/:id`| Generates SHA-256 hashed digital adjudication dossier for DM review |
| `POST`| `/ai/briefing` | Generates bilingual (English/Hindi) tactical operational brief via Groq |
| `POST`| `/ai/chat` | Incident commander AI Sahayak situational copilot query |
| `GET` | `/evidence/registry` | Chamoli DDMP 2026-27 statutory evidence references & provenance data |

---

## 📂 Project Directory Structure

```text
visthaapan-portal/
├── .env.example                     # Unified environment template
├── render.yaml                      # Render Blueprint infrastructure-as-code
├── README.md                        # Authoritative project documentation
├── backend/
│   ├── Dockerfile                   # Production multi-stage Dockerfile (Node + Python OR-Tools)
│   ├── requirements.txt             # Python dependencies (ortools, numpy, scipy)
│   ├── package.json                 # Node scripts & dependencies
│   ├── migrations/                  # 15 SQL schema migrations (PostGIS, Demographics, Audit)
│   ├── ai/
│   │   └── or/
│   │       └── solver.py            # Google OR-Tools SCIP mathematical solver
│   ├── src/
│   │   ├── server.ts                # Express server listener (0.0.0.0 host binding)
│   │   ├── app.ts                   # Express middleware & dynamic CORS
│   │   ├── config/                  # Environment variable configuration
│   │   ├── controllers/             # Business logic controllers
│   │   ├── db/                      # PostgreSQL connection pool & migration runner
│   │   ├── or/                      # Node.js <-> Python OR-Tools IPC bridge
│   │   ├── routes/                  # Express REST router definitions
│   │   └── services/                # Spatial, capacity, scenario & Groq AI services
│   └── test/                        # Comprehensive automated test suite
└── frontend/
    ├── vercel.json                  # Vercel SPA routing configuration
    ├── package.json                 # Frontend dependencies (React 19, Tailwind, Leaflet)
    ├── vite.config.ts               # Vite configuration
    ├── src/
    │   ├── App.tsx                  # 5-Workspace routing architecture & AuthGate
    │   ├── components/              # Modular UI components (GIS Map, Cards, AppShell)
    │   ├── i18n/                    # English & Hindi localization dictionaries
    │   ├── pages/                   # Operational views (Command Center, Allocation, Review)
    │   ├── services/                # Centralized Axios API client & Groq integration
    │   └── stores/                  # Zustand client state management
```

---

## 📜 Statutory Alignment & Literature

VISTHAAPAN's architectural design and mathematical constraints align with:
- **Disaster Management Act, 2005**: Sections 30 & 34 (Powers of District Authority during disaster).
- **National Disaster Management Authority (NDMA)**: *National Disaster Management Guidelines — Evacuation and Temporary Shelter Management*.
- **Sphere Standards**: Minimum Standards in Humanitarian Response for water supply, sanitation, and shelter space.
- **Chamoli District Disaster Management Plan (DDMP 2026–27)**: Spatial vulnerability data for border and mountain habitations.

---

## 👥 Contributors & Acknowledgements

Developed by the **VISTHAAPAN Team** for the advancement of disaster risk reduction, operational research, and humanitarian safety in vulnerable mountain ecosystems.

- **Primary Developer & Repository Maintainer**: [@Animesh26526](https://github.com/Animesh26526)
- **Disaster Management Research Target**: Chamoli District Disaster Management Authority (DDMA), Gopeshwar, Uttarakhand.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
