# TransitOps Database Schema

This document summarizes the core data model used by the TransitOps platform. The schema is intentionally normalized to support fleet state tracking, auditability of trips, and financial reconciliation while keeping the dispatch workflow explicit.

## Entity Relationship Overview

- `accounts.User` manages authentication and role assignment.
- `drivers.Driver` stores driver profiles, license details, and operational status.
- `vehicles.Vehicle` stores fleet inventory, capacity, and status.
- `trips.Trip` represents planned or active route assignments.
- `maintenance.MaintenanceLog` tracks vehicle shop work and service lifecycle.
- `finance.FuelLog` and `finance.Expense` capture consumables and operational cost data.

## Primary Tables

### accounts.User

Extends Django's user model and uses email-based authentication.

| Column       | Type           | Notes                                                            |
| ------------ | -------------- | ---------------------------------------------------------------- |
| `id`         | BigAutoField   | Primary key                                                      |
| `email`      | EmailField     | Unique login identifier                                          |
| `password`   | CharField      | Hashed password                                                  |
| `role`       | CharField(30)  | `fleet_manager`, `driver`, `safety_officer`, `financial_analyst` |
| `full_name`  | CharField(150) | Display name                                                     |
| `is_active`  | BooleanField   | Active user flag                                                 |
| `created_at` | DateTimeField  | auto_now_add                                                     |
| `last_login` | DateTimeField  | inherited                                                        |

### vehicles.Vehicle

| Column                | Type               | Notes                                        |
| --------------------- | ------------------ | -------------------------------------------- |
| `id`                  | BigAutoField       | Primary key                                  |
| `registration_number` | CharField(20)      | Unique fleet identifier                      |
| `name_model`          | CharField(100)     | Vehicle model text                           |
| `type`                | CharField(50)      | Vehicle category                             |
| `max_load_capacity`   | DecimalField(10,2) | Maximum cargo weight capacity                |
| `odometer`            | DecimalField(10,2) | Current odometer reading                     |
| `acquisition_cost`    | DecimalField(12,2) | Original purchase cost                       |
| `status`              | CharField(20)      | `Available`, `On Trip`, `In Shop`, `Retired` |
| `region`              | CharField(60)      | Optional region metadata                     |
| `created_at`          | DateTimeField      | auto_now_add                                 |

### drivers.Driver

| Column             | Type                       | Notes                                           |
| ------------------ | -------------------------- | ----------------------------------------------- |
| `id`               | BigAutoField               | Primary key                                     |
| `user_id`          | ForeignKey → accounts.User | Optional link to auth user                      |
| `name`             | CharField(120)             | Driver name                                     |
| `license_number`   | CharField(40)              | Unique license number                           |
| `license_category` | CharField(20)              | License class                                   |
| `license_expiry`   | DateField                  | Expiry date for compliance checks               |
| `contact_number`   | CharField(20)              | Phone or contact text                           |
| `safety_score`     | DecimalField(4,1)          | Operational safety rating                       |
| `status`           | CharField(20)              | `Available`, `On Trip`, `Off Duty`, `Suspended` |
| `created_at`       | DateTimeField              | auto_now_add                                    |

### trips.Trip

| Column             | Type                          | Notes                                           |
| ------------------ | ----------------------------- | ----------------------------------------------- |
| `id`               | BigAutoField                  | Primary key                                     |
| `vehicle_id`       | ForeignKey → vehicles.Vehicle | Protected vehicle association                   |
| `driver_id`        | ForeignKey → drivers.Driver   | Protected driver association                    |
| `created_by_id`    | ForeignKey → accounts.User    | Optional trip creator                           |
| `source`           | CharField(120)                | Trip start location                             |
| `destination`      | CharField(120)                | Trip end location                               |
| `cargo_weight`     | DecimalField(10,2)            | Cargo weight for capacity validation            |
| `planned_distance` | DecimalField(10,2)            | Expected trip distance                          |
| `final_odometer`   | DecimalField(10,2)            | Optional odometer at completion                 |
| `fuel_consumed`    | DecimalField(10,2)            | Optional fuel consumption record                |
| `status`           | CharField(20)                 | `Draft`, `Dispatched`, `Completed`, `Cancelled` |
| `dispatched_at`    | DateTimeField                 | Nullable dispatch timestamp                     |
| `completed_at`     | DateTimeField                 | Nullable completion timestamp                   |
| `created_at`       | DateTimeField                 | auto_now_add                                    |

### maintenance.MaintenanceLog

| Column        | Type                          | Notes                             |
| ------------- | ----------------------------- | --------------------------------- |
| `id`          | BigAutoField                  | Primary key                       |
| `vehicle_id`  | ForeignKey → vehicles.Vehicle | Protected maintenance association |
| `description` | CharField(255)                | Maintenance summary               |
| `cost`        | DecimalField(10,2)            | Service cost estimate/actual      |
| `status`      | CharField(20)                 | `Open`, `Closed`                  |
| `opened_at`   | DateTimeField                 | auto_now_add                      |
| `closed_at`   | DateTimeField                 | Nullable close date               |

### finance.FuelLog

| Column       | Type                          | Notes                       |
| ------------ | ----------------------------- | --------------------------- |
| `id`         | BigAutoField                  | Primary key                 |
| `vehicle_id` | ForeignKey → vehicles.Vehicle | Linked vehicle              |
| `trip_id`    | ForeignKey → trips.Trip       | Nullable optional trip link |
| `liters`     | DecimalField(8,2)             | Fuel quantity               |
| `cost`       | DecimalField(10,2)            | Fuel cost                   |
| `log_date`   | DateField                     | Entry date                  |

### finance.Expense

| Column         | Type                          | Notes            |
| -------------- | ----------------------------- | ---------------- |
| `id`           | BigAutoField                  | Primary key      |
| `vehicle_id`   | ForeignKey → vehicles.Vehicle | Linked vehicle   |
| `category`     | CharField(50)                 | Expense category |
| `amount`       | DecimalField(10,2)            | Expense amount   |
| `expense_date` | DateField                     | Expense date     |
| `note`         | CharField(255)                | Optional note    |

## Database Notes

- `Vehicle.status` drives availability filters and trip dispatch eligibility.
- `Trip.status` controls permitted actions: only `Draft` trips can be dispatched, only `Dispatched` trips can be completed or cancelled.
- `maintenance.MaintenanceLog` transitions vehicles to `In Shop` and excludes them from available vehicle lists.
- Cargo capacity and driver license compliance are validated in code rather than enforced as database-level constraints.
