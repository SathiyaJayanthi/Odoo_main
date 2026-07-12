# TransitOps — Smart Transport Operations Platform

TransitOps is a unified enterprise web platform designed for fleet managers, safety officers, and financial analysts to optimize transport workflows, enforce driver licensing compliance, track maintenance life-cycles, and monitor vehicle ROI statistics.

## Problem Statement Summary
Fleet operators often face logistics bottlenecks and compliance risks, such as:
1. **Compliance Gaps:** Dispatched trips assigning drivers with expired or suspended commercial licenses.
2. **Resource Conflicts:** Double-booking or double-dispatching vehicles and drivers due to database race conditions.
3. **Capacity Overload:** Creating trips with cargo weights exceeding a vehicle's maximum load limits.
4. **Maintenance Disconnection:** Sending active transit vehicles to maintenance shops or scheduling trips on vehicles under service.
5. **Cost Fragmentations:** Difficulty consolidating fuel logs, service fees, and trip revenues to view real-time ROI reports.

TransitOps eliminates these issues by implementing a unified React client and Django REST backend that integrates strict database row locks, automated compliance calculations, and live performance metrics.

## Features Implemented
- **Interactive Role Dashboard:** Displays real-time KPIs (Fleet Utilization %, Active Trips, Vehicles in Shop, Available Vehicles) derived dynamically from report views.
- **Unified Vehicle Registry:** Complete CRUD grid supporting vehicle classifications, status controls (Available, On Trip, In Shop, Retired), and odometer tracking. Prevents duplicate registration inputs with field-level highlights.
- **Driver Compliance Tracker:** Monitors active drivers, compliance statuses, and CDL expiry milestones. Computes and flags expiring licenses (<= 30 days) client-side and blocks expired dispatches server-side.
- **Trips Dispatch Engine:** Supports planning routes (Drafts), dispatching trips, completing loops (recording fuel consumption and updating odometers), and cancellations. Implements pessimistic database locks (`select_for_update()`) to prevent race conditions.
- **Service Maintenance Shop:** Logs vehicle maintenance, automatically transitioning vehicles to `In Shop` (which removes them from dispatch selections) and restoring them to `Available` upon service closure. Blocks maintenance tickets on active `On Trip` vehicles.
- **Financial Registry & ROI Analytics:** Tracks fuel logs, operational expenses, and per-vehicle cost summaries. Renders vehicle-by-vehicle ROI grids for the financial analyst.
- **CSV Data Exporter:** Allows downloading consolidated operational reports.

## Tech Stack
- **Backend:** Django 5.2, Django REST Framework 3.17, SQLite, JWT authentication (`djangorestframework-simplejwt`)
- **Frontend:** React 19 (Vite), Tailwind CSS 4, React Router 7, TanStack Query, Axios, Lucide Icons

## Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend Setup
```bash
cd backend
python -m venv .venv
# Activate virtual environment:
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo_data
python manage.py runserver
```
Backend runs at http://localhost:8000

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at http://localhost:5173

## Demo Credentials
| Email | Password | Role |
|---|---|---|
| fleet_manager@demo.com | demopass123 | Fleet Manager |
| driver@demo.com | demopass123 | Driver |
| safety_officer@demo.com | demopass123 | Safety Officer |
| financial_analyst@demo.com | demopass123 | Financial Analyst |

## Known Limitations / Descoped Items
The following features are explicitly out of scope and descoped for the initial version:
- **PDF Report Exporter:** Consolidated reports are exported exclusively in CSV format; PDF print exports are descoped.
- **Email/SMS Reminders:** Automatic notifications for license expiries or service milestones are descoped.
- **Document Management:** Uploading digital copies of vehicle permits, insurances, or driver licenses is out of scope.
- **Dark Mode Theme Support:** The interface features a tailored premium dark-mode sidebar, but full light/dark client toggling is descoped.
- **Multi-Tenant Org Isolation:** Multi-tenant workspace separation is descoped (single system organization).
- **Real-Time Telematics GPS Tracking:** Active map route integrations and live GPS telemetry streams are out of scope.
