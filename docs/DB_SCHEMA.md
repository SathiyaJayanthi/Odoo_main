# TransitOps Database Schema

## ER Overview

```
User (accounts)
  └─< Driver (drivers)              [1:N, optional FK]
  └─< Trip.created_by (trips)       [1:N]

Vehicle (vehicles)
  └─< Driver                       [no direct FK]
  └─< Trip (trips)                  [1:N]
  └─< MaintenanceLog (maintenance)  [1:N]
  └─< FuelLog (finance)             [1:N]
  └─< Expense (finance)             [1:N]

Driver (drivers)
  └─< Trip (trips)                  [1:N]

Trip (trips)
  └─< FuelLog (finance)             [1:N, optional FK]
```

## Tables

### accounts.User

Extends `AbstractUser`. Uses `email` as `USERNAME_FIELD`.

| Column | Type | Constraints |
|---|---|---|
| id | BigAutoField | PK |
| email | EmailField | unique |
| password | CharField | hashed (Django default) |
| role | CharField(30) | choices: fleet_manager, driver, safety_officer, financial_analyst |
| full_name | CharField(150) | |
| is_active | BooleanField | default=True |
| created_at | DateTimeField | auto_now_add |
| last_login | DateTimeField | nullable (inherited) |
| is_staff | BooleanField | default=False (inherited) |
| is_superuser | BooleanField | default=False (inherited) |

### vehicles.Vehicle

| Column | Type | Constraints |
|---|---|---|
| id | BigAutoField | PK |
| registration_number | CharField(20) | unique |
| name_model | CharField(100) | |
| type | CharField(50) | |
| max_load_capacity | DecimalField(10,2) | validators: MinValueValidator(0.01) |
| odometer | DecimalField(10,2) | default=0 |
| acquisition_cost | DecimalField(12,2) | |
| status | CharField(20) | choices: Available [default], On Trip, In Shop, Retired |
| region | CharField(60) | nullable, blank |
| created_at | DateTimeField | auto_now_add |

**Indexes:** status, type, registration_number

### drivers.Driver

| Column | Type | Constraints |
|---|---|---|
| id | BigAutoField | PK |
| user_id | ForeignKey → accounts.User | null=True, blank=True, on_delete=SET_NULL |
| name | CharField(120) | |
| license_number | CharField(40) | unique |
| license_category | CharField(20) | |
| license_expiry | DateField | |
| contact_number | CharField(20) | |
| safety_score | DecimalField(4,1) | default=100 |
| status | CharField(20) | choices: Available [default], On Trip, Off Duty, Suspended |
| created_at | DateTimeField | auto_now_add |

**Indexes:** status, license_expiry

### trips.Trip

| Column | Type | Constraints |
|---|---|---|
| id | BigAutoField | PK |
| vehicle_id | ForeignKey → vehicles.Vehicle | on_delete=PROTECT |
| driver_id | ForeignKey → drivers.Driver | on_delete=PROTECT |
| created_by_id | ForeignKey → accounts.User | null=True, on_delete=SET_NULL |
| source | CharField(120) | |
| destination | CharField(120) | |
| cargo_weight | DecimalField(10,2) | validators: MinValueValidator(0.01) |
| planned_distance | DecimalField(10,2) | |
| final_odometer | DecimalField(10,2) | nullable |
| fuel_consumed | DecimalField(10,2) | nullable |
| status | CharField(20) | choices: Draft [default], Dispatched, Completed, Cancelled |
| dispatched_at | DateTimeField | nullable |
| completed_at | DateTimeField | nullable |
| created_at | DateTimeField | auto_now_add |

**Indexes:** status, vehicle_id, driver_id

**Note:** `cargo_weight <= vehicle.max_load_capacity` is enforced at the service layer, not as a DB constraint.

### maintenance.MaintenanceLog

| Column | Type | Constraints |
|---|---|---|
| id | BigAutoField | PK |
| vehicle_id | ForeignKey → vehicles.Vehicle | on_delete=PROTECT |
| description | CharField(255) | |
| cost | DecimalField(10,2) | default=0 |
| status | CharField(20) | choices: Open [default], Closed |
| opened_at | DateTimeField | auto_now_add |
| closed_at | DateTimeField | nullable |

**Indexes:** vehicle_id, status

### finance.FuelLog

| Column | Type | Constraints |
|---|---|---|
| id | BigAutoField | PK |
| vehicle_id | ForeignKey → vehicles.Vehicle | on_delete=PROTECT |
| trip_id | ForeignKey → trips.Trip | nullable, blank, on_delete=SET_NULL |
| liters | DecimalField(8,2) | validators: MinValueValidator(0.01) |
| cost | DecimalField(10,2) | |
| log_date | DateField | |

### finance.Expense

| Column | Type | Constraints |
|---|---|---|
| id | BigAutoField | PK |
| vehicle_id | ForeignKey → vehicles.Vehicle | on_delete=PROTECT |
| category | CharField(50) | |
| amount | DecimalField(10,2) | |
| expense_date | DateField | |
| note | CharField(255) | nullable, blank |
