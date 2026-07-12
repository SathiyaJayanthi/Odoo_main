# TransitOps — Smart Transport Operations Platform

## Problem Statement Summary

TODO

## Features Implemented

TODO

## Tech Stack

- **Backend:** Django 5.2, Django REST Framework 3.17, SQLite, JWT (simplejwt)
- **Frontend:** React 19 (Vite), Tailwind CSS 4, React Router, TanStack Query, Axios, Lucide Icons

## Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo_data
python manage.py runserver
```

Backend runs at http://localhost:8000

### Frontend

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

## Known Limitations

TODO
