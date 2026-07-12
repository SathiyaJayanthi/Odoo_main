# TransitOps Demo Script

This demo script is designed to guide reviewers through the TransitOps workflow, highlighting fleet safety, dispatch control, maintenance coordination, and financial reporting.

## Pre-demo Checklist
- Backend server running at `http://localhost:8000`
- Frontend running at `http://localhost:5173`
- Demo accounts seeded
- Use the `fleet_manager@demo.com` account for the main tour

## 1. Opening Summary (30s)
Introduce the platform as a unified solution for fleet operations, compliance, and ROI:
- Trip planning and dispatch control
- Driver license compliance tracking
- Maintenance lifecycle enforcement
- Real-time fleet utilization and ROI reporting

## 2. Dashboard Tour (45s)
1. Log in as `fleet_manager@demo.com`.
2. Observe the KPI cards:
   - `Available Vehicles`
   - `Active Trips`
   - `In Maintenance`
   - `Fleet Utilization %`
3. Point out the attention panel showing vehicles in shop and expiring licenses.
4. Note the sidebar navigation for Vehicles, Drivers, Trips, Maintenance, and Finance.

## 3. Plan and Dispatch a Trip (60s)
1. Open **Vehicles** and verify `Tata Ace Van-05` is `Available`.
2. Open **Drivers** and verify `Alex Fernandes` is `Available`.
3. Open **Trips** and click **Create Trip**.
4. Complete the form with:
   - Vehicle: `Tata Ace Van-05`
   - Driver: `Alex Fernandes`
   - Source: `Warehouse A`
   - Destination: `Outlet B`
   - Cargo Weight: `450`
   - Planned Distance: `120`
5. Save the Draft trip.
6. Dispatch the trip and verify the dashboard updates immediately.

## 4. Demonstrate Risk Protection (45s)
1. Attempt to create a second trip using the same vehicle or driver while they are `On Trip`.
2. Show that the unavailable asset is excluded from the selection lists.
3. Explain the backend locking mechanism preventing double-dispatch conflicts.
4. Open **Drivers** and explain the license expiry warning behavior.

## 5. Complete and Maintain (45s)
1. Complete the active trip and confirm the driver and vehicle return to `Available`.
2. Open **Maintenance** and log new work for `Tata Ace Van-05`.
3. Confirm the vehicle status switches to `In Shop` and is excluded from trip planning.
4. Close the maintenance ticket and verify the vehicle returns to `Available`.

## 6. Reporting and Outcomes (30s)
1. Return to **Dashboard** and highlight updated `Active Trips` and `Fleet Utilization`.
2. If using the Finance role, show ROI summary and the `Export CSV` report capability.
3. Conclude with how TransitOps ensures operational safety, asset visibility, and financial accountability.

## Judge FAQ

### How does TransitOps avoid double-booking vehicles?
Dispatch operations validate asset availability and use transactional locking to prevent race conditions. If a second request attempts to dispatch the same vehicle after the first transaction completes, the backend rejects it with a conflict response.

### How are capacity and compliance enforced?
The frontend shows live capacity warnings, and the backend enforces all business rules before creating or dispatching trips. Driver licenses expiring within 30 days are highlighted, while expired or suspended drivers are blocked from dispatch.

### What happens during maintenance?
A maintenance log sets a vehicle to `In Shop`, removing it from dispatch selection. Closing maintenance reactivates the vehicle as `Available`.
