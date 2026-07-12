# TransitOps API Reference

## Base URL

```
http://localhost:8000/api/v1
```

## Authentication

The API uses JWT tokens for protected routes.

### Login

```
POST /api/v1/auth/login/
Content-Type: application/json
{
  "email": "fleet_manager@demo.com",
  "password": "demopass123"
}
```

Response:

```json
{
  "access": "<jwt-access-token>",
  "refresh": "<jwt-refresh-token>",
  "email": "fleet_manager@demo.com",
  "role": "fleet_manager",
  "user": { ... }
}
```

### Refresh Token

```
POST /api/v1/auth/refresh/
Content-Type: application/json
{
  "refresh": "<refresh-token>"
}
```

Response:

```json
{
  "access": "<new-access-token>"
}
```

### Signup

```
POST /api/v1/auth/signup/
Content-Type: application/json
{
  "email": "new.user@example.com",
  "password": "SecurePass123",
  "full_name": "New User",
  "role": "driver"
}
```

Response:

```json
{
  "id": 12,
  "email": "new.user@example.com",
  "role": "driver",
  "full_name": "New User"
}
```

## Vehicles

### List all vehicles

```
GET /api/v1/vehicles/
Authorization: Bearer <access-token>
```

Supports query parameters such as `status` and `type`.

### Create a vehicle

```
POST /api/v1/vehicles/
Authorization: Bearer <access-token>
Content-Type: application/json
{
  "registration_number": "MH12AB1234",
  "name_model": "Tata Ace Van-05",
  "type": "Van",
  "max_load_capacity": 500.00,
  "odometer": 12500.00,
  "acquisition_cost": 650000.00,
  "status": "Available",
  "region": "Mumbai"
}
```

### List available vehicles

```
GET /api/v1/vehicles/available/
Authorization: Bearer <access-token>
```

### Retrieve or update a vehicle

```
GET /api/v1/vehicles/{id}/
PATCH /api/v1/vehicles/{id}/
Authorization: Bearer <access-token>
```

## Drivers

### List drivers

```
GET /api/v1/drivers/
Authorization: Bearer <access-token>
```

### Create a driver

```
POST /api/v1/drivers/
Authorization: Bearer <access-token>
Content-Type: application/json
{
  "name": "Alex Fernandes",
  "license_number": "DL-MH-2024-99887",
  "license_category": "LMV",
  "license_expiry": "2027-05-01",
  "contact_number": "9876543210",
  "safety_score": 100.0,
  "status": "Available"
}
```

### Driver details and update

```
GET /api/v1/drivers/{id}/
PATCH /api/v1/drivers/{id}/
Authorization: Bearer <access-token>
```

### List available drivers

```
GET /api/v1/drivers/available/
Authorization: Bearer <access-token>
```

### Expiring licenses

```
GET /api/v1/drivers/expiring-licenses/
Authorization: Bearer <access-token>
```

## Trips

### List trips

```
GET /api/v1/trips/?status=Draft
Authorization: Bearer <access-token>
```

Valid `status` values: `Draft`, `Dispatched`, `Completed`, `Cancelled`.

### Create a trip

```
POST /api/v1/trips/
Authorization: Bearer <access-token>
Content-Type: application/json
{
  "vehicle_id": 1,
  "driver_id": 1,
  "source": "Warehouse A",
  "destination": "Outlet B",
  "cargo_weight": 450.00,
  "planned_distance": 120.00
}
```

### Dispatch a trip

```
POST /api/v1/trips/{id}/dispatch/
Authorization: Bearer <access-token>
```

### Complete a trip

```
POST /api/v1/trips/{id}/complete/
Authorization: Bearer <access-token>
Content-Type: application/json
{
  "final_odometer": 12600.00,
  "fuel_consumed": 12.00
}
```

### Cancel a trip

```
POST /api/v1/trips/{id}/cancel/
Authorization: Bearer <access-token>
```

## Maintenance

### List maintenance logs

```
GET /api/v1/maintenance/
Authorization: Bearer <access-token>
```

### Create a maintenance record

```
POST /api/v1/maintenance/
Authorization: Bearer <access-token>
Content-Type: application/json
{
  "vehicle_id": 1,
  "description": "Routine oil change",
  "cost": 150.00
}
```

### Close maintenance

```
POST /api/v1/maintenance/{id}/close/
Authorization: Bearer <access-token>
```

## Finance

### Create a fuel log

```
POST /api/v1/fuel-logs/
Authorization: Bearer <access-token>
Content-Type: application/json
{
  "vehicle_id": 1,
  "trip_id": 2,
  "liters": 12.50,
  "cost": 130.00,
  "log_date": "2026-07-12"
}
```

### Create an expense

```
POST /api/v1/expenses/
Authorization: Bearer <access-token>
Content-Type: application/json
{
  "vehicle_id": 1,
  "category": "Maintenance",
  "amount": 150.00,
  "expense_date": "2026-07-12",
  "note": "Engine oil change"
}
```

### Vehicle cost summary

```
GET /api/v1/vehicles/{id}/cost-summary/
Authorization: Bearer <access-token>
```

## Reports

### Dashboard metrics

```
GET /api/v1/reports/dashboard/
Authorization: Bearer <access-token>
```

### Fuel efficiency

```
GET /api/v1/reports/fuel-efficiency/?vehicle_id=1
Authorization: Bearer <access-token>
```

### ROI report

```
GET /api/v1/reports/roi/?vehicle_id=1
Authorization: Bearer <access-token>
```

### Maintenance alerts

```
GET /api/v1/reports/maintenance-alerts/
Authorization: Bearer <access-token>
```

### Export CSV report

```
GET /api/v1/reports/export/?type=csv
Authorization: Bearer <access-token>
```

## Response Conventions

- `200` / `201`: Success
- `400`: Validation failure or business rule violation
- `401`: Missing or invalid authentication token
- `403`: Permission denied
- `409`: Conflict when a resource state prevents the requested action

## Common Error Behavior

The frontend surfaces backend errors in toast notifications using the API response `message` field where available. Examples:

- `Van-05 is currently unavailable for dispatch.`
- `Driver license has expired.`
- `Vehicle is already in maintenance.`
