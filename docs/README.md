# TransitOps — Smart Transport Operations Platform

TransitOps is a full-stack fleet operations management platform that helps transportation teams safely plan trips, manage vehicle maintenance, enforce driver licensing compliance, and monitor fleet ROI in a single responsive web interface.

## Documentation

This repository maintains a structured docs suite inside the `docs/` folder:

- `docs/README.md` — Documentation index and navigation
- `docs/SETUP.md` — Local development and deployment setup
- `docs/ARCHITECTURE.md` — System architecture and component design
- `docs/API.md` — REST API reference
- `docs/DB_SCHEMA.md` — Data model and schema overview
- `docs/DEMO_SCRIPT.md` — Guided demo flow for reviewers
- `docs/TEST_CHECKLIST.md` — Manual QA checklist and acceptance criteria

## Project Summary

- **Backend:** Django REST Framework, JWT authentication, transactional trip dispatch, maintenance lifecycle enforcement, finance analytics
- **Frontend:** React 19, Vite, Tailwind CSS 4, React Router 7, TanStack Query, Axios
- **Database:** SQLite for local development and demo usage
- **Key modules:** Vehicles, Drivers, Trips, Maintenance, Finance, Reports

## Quick Start

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo_data
python manage.py runserver 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

### Access

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000/api/v1`

## Demo Users

| Email                      | Password    | Role              |
| -------------------------- | ----------- | ----------------- |
| fleet_manager@demo.com     | demopass123 | Fleet Manager     |
| driver@demo.com            | demopass123 | Driver            |
| safety_officer@demo.com    | demopass123 | Safety Officer    |
| financial_analyst@demo.com | demopass123 | Financial Analyst |

## Repository Layout

```text
Odoo_main/
├── backend/          # Django REST backend application
├── frontend/         # React + Vite frontend SPA
├── docs/             # Project documentation
└── README.md         # Project landing page and quick start
```

## Notes

- The frontend expects the backend API at `http://localhost:8000/api/v1`
- The app uses JWT authorization for all protected API requests
- `docs/SETUP.md` contains more detailed environment and local run instructions
