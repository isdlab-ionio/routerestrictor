# RouteRestrictor

Municipal street restriction management system for Corfu. Allows managing road segments, defining traffic restrictions (closures, weight limits, pedestrian zones, etc.), and visualizing them on an interactive map.

## Features

- **Interactive Map** — Leaflet-based map with color-coded road segments and route planning
- **Restriction Management** — Create, edit, and track restrictions with status workflows (draft → active → expired)
- **Dashboard** — Overview statistics and summaries
- **Data Export** — Export restrictions for external feeds

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React 19, TypeScript, Tailwind CSS, Leaflet, React Query, Vite |
| Backend | Python, FastAPI, SQLAlchemy, SQLite |

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+

### Setup

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
```

### Run

```bash
# Quick start (both servers + open browser)
./start.sh

# Or manually:
# Terminal 1 — backend
cd backend && source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Terminal 2 — frontend
cd frontend
npm run dev -- --port 5173
```

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Project Structure

```
backend/
  app/
    main.py          # FastAPI app, CORS, router registration
    models.py        # SQLAlchemy models (RoadSegment, Restriction, FeedExportLog)
    schemas.py       # Pydantic schemas
    database.py      # DB engine & session
    routers/         # API endpoints (segments, restrictions, dashboard, exports, seed)
frontend/
  src/
    pages/           # MapPage, RestrictionsPage, DashboardPage, ExportPage
    components/      # MapView, RestrictionCard, SegmentPanel, Layout
    lib/             # API client, types, utilities
start.sh             # Launch script
```

## API

All endpoints are under `/api`. Full interactive documentation is available at `/docs` when the backend is running.

| Endpoint | Description |
|----------|-------------|
| `GET /api/segments` | List road segments |
| `GET /api/restrictions` | List restrictions |
| `POST /api/restrictions` | Create restriction |
| `GET /api/dashboard/stats` | Dashboard statistics |
| `POST /api/export` | Export data |
| `POST /api/seed` | Seed sample data |
