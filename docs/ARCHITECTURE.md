# TransitOps Architecture

TransitOps is designed as a decoupled full-stack platform with a React SPA frontend communicating with a Django REST backend over JWT-protected JSON APIs.

## System Overview

- **Frontend:** React 19 + Vite client app. Uses Tailwind CSS for styling, React Router for navigation, Axios for HTTP, and TanStack Query for server state and caching.
- **Backend:** Django REST Framework providing authenticated APIs, business validation, transactional trip state transitions, and reporting views.
- **Database:** SQLite in local/demo mode. The app is structured for easier migration to PostgreSQL in production.
- **Authentication:** JWT bearer tokens with refresh support.

## Component Architecture

### Backend

- `accounts/` — Authentication and user role management.
- `vehicles/` — Vehicle inventory, availability, and lifecycle status.
- `drivers/` — Driver records, license expiry tracking, and availability filters.
- `trips/` — Trip planning, dispatch, completion, and cancellation.
- `maintenance/` — Maintenance logs and transitions of vehicles into/out of shop status.
- `finance/` — Fuel logs, expense tracking, and vehicle cost summarization.
- `reports/` — Dashboard metrics, ROI analytics, maintenance alerts, CSV export.
- `common/` — Shared permissions, exceptions, and utility helpers.

### Frontend

- `src/pages/` — Page-level routes for Dashboard, Vehicles, Drivers, Trips, Maintenance, Finance.
- `src/api/` — Axios wrappers around backend endpoints organized by domain.
- `src/components/` — Shared UI atoms and layout components.
- `src/context/` — Auth and toast wrapper providers.
- `src/routes/` — React Router configuration and protected route enforcement.

## Data Flow

1. **User action** triggers a React event (e.g. create trip, dispatch, complete).
2. **Axios API wrapper** sends the request to `/api/v1/...` with the JWT bearer token.
3. Backend validates the payload, applies business rules, and updates models.
4. On success, React Query invalidates related query keys to refresh dashboard, trip, vehicle, and driver state.
5. The UI updates immediately without manual page refresh.

## Business Rules and Safety

- **Trip dispatch locking:** Trip dispatch uses backend validation and database locking to ensure a vehicle and driver are not double-booked.
- **Cargo capacity:** The frontend performs live capacity validation and the backend enforces `cargo_weight <= vehicle.max_load_capacity`.
- **Driver compliance:** Dispatch blocks drivers whose license has expired or whose status is unavailable.
- **Maintenance isolation:** Vehicles in `In Shop` are excluded from dispatch selection and cannot be scheduled until maintenance is closed.

## Security Model

- **JWT Authentication:** All protected endpoints require `Authorization: Bearer <token>`.
- **Role-based access:** Permission classes validate roles for reports and operational APIs.
- **Input validation:** Serializers and view-level validation prevent invalid state transitions.

## Deployment Considerations

- For a production deployment, migrate from SQLite to PostgreSQL.
- Use environment-specific settings for `ALLOWED_HOSTS`, `DEBUG`, and database credentials.
- Serve the frontend as a built static bundle behind Nginx or integrated with Django static files.
- Configure HTTPS for JWT token transport and API security.

## Directory Structure

```text
Odoo_main/
├── backend/
│   ├── accounts/
│   ├── config/
│   ├── drivers/
│   ├── finance/
│   ├── maintenance/
│   ├── reports/
│   ├── trips/
│   ├── vehicles/
│   └── common/
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── docs/
└── README.md
```
