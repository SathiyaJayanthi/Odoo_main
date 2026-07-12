# TransitOps API Reference

## Base URL

```
http://localhost:8000/api/v1
```

## Authentication

JWT-based. Obtain tokens via:

```
POST /api/v1/auth/token/
{
  "email": "fleet_manager@demo.com",
  "password": "demopass123"
}
```

Returns:
```json
{
  "access": "<jwt-access-token>",
  "refresh": "<jwt-refresh-token>"
}
```

Attach as `Authorization: Bearer <access_token>` header.

Refresh via:
```
POST /api/v1/auth/token/refresh/
{ "refresh": "<refresh-token>" }
```

## Endpoints

TODO — Will be filled in as features are implemented.

| Module | Base Path |
|---|---|
| Auth | `/api/v1/auth/` |
| Vehicles | `/api/v1/vehicles/` |
| Drivers | `/api/v1/drivers/` |
| Trips | `/api/v1/trips/` |
| Maintenance | `/api/v1/maintenance/` |
| Finance | `/api/v1/finance/` |
| Reports | `/api/v1/reports/` |
