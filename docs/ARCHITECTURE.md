# TransitOps Architecture

TODO

## Overview

- **Backend:** Django REST Framework API with JWT authentication
- **Frontend:** React SPA with Vite, Tailwind CSS, shadcn/ui
- **Database:** SQLite (development/hackathon only)

## Directory Structure

```
transitops/
├── backend/          # Django project
│   ├── config/       # Project settings
│   ├── accounts/     # User management & auth
│   ├── vehicles/     # Fleet vehicle management
│   ├── drivers/      # Driver profiles & scheduling
│   ├── trips/        # Trip planning & tracking
│   ├── maintenance/  # Vehicle maintenance logs
│   ├── finance/      # Fuel logs & expenses
│   ├── reports/      # Analytics & reporting
│   └── common/       # Shared utilities
├── frontend/         # React + Vite SPA
├── docs/             # Documentation
└── .gitignore
```

## API Base URL

All endpoints: `http://localhost:8000/api/v1/`
