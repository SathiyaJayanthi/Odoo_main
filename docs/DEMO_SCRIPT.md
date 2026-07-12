# TransitOps Demo Script

This script walks through a 4-minute operational tour of the TransitOps platform.

---

## 1. Problem Framing (30s)
Transit fleet managers and financial analysts struggle with fragmented operations, leading to overloaded vehicles, double-dispatched drivers, expired license compliance risks, and hidden maintenance leakages. **TransitOps** solves this by unifying vehicle registries, driver compliance, route dispatches, maintenance lifecycles, and ROI analytics into a single responsive portal. By enforcing strict state constraints, transactional locking, and live compliance calculations, TransitOps guarantees fleet safety and maximizes operational profitability.

---

## 2. Dashboard Tour (45s)
1. Log in to the application using the **Fleet Manager** demo account profile selection card on the login screen.
2. The landing view is the **Dashboard**, showing four operational KPI cards:
   - **Available Vehicles**: Lists the count of available vehicles out of the active fleet (excluding Retired ones).
   - **Active Trips**: Shows the count of dispatched trips and draft route plans in the queue.
   - **Vehicles in Shop**: Shows the current count of vehicles undergoing active maintenance.
   - **Fleet Utilization**: Computes the percentage of active vehicles that are currently dispatched on trips.
3. In the sidebar navigation menu on the left, we have direct access to **Dashboard**, **Vehicles**, **Drivers**, **Trips**, **Maintenance**, and **Finance** management pages.

---

## 3. Core Flow: Route Planning & Dispatch (60s)
1. Click **Vehicles** in the sidebar. Locate vehicle **Tata Ace Van-05** (`MH12AB1234`), which has a maximum capacity of **500.00 kg** and is currently **Available**.
2. Click **Drivers** in the sidebar. Locate driver **Alex Fernandes**, who is currently **Available** and has a valid commercial driver's license.
3. Click **Trips** in the sidebar and click the **Plan New Trip** button in the top-right corner.
4. In the **Plan New Route Trip** modal form:
   - Select **Tata Ace Van-05** from the Vehicle dropdown list.
   - Select **Alex Fernandes** from the Driver dropdown list.
   - Input Source: `Warehouse A` and Destination: `Outlet B`.
   - Input Cargo Weight: `550`. A live real-time warning message immediately appears: *"Warning: Weight exceeds vehicle capacity (500 kg) and will be blocked on submit!"*
   - Change Cargo Weight to `450` (complying with capacity limits) and input Planned Distance: `60`.
   - Click the **Create Draft Trip** button. The trip is registered in **Draft** status.
5. In the Trips table grid, locate the newly created Draft trip and click the **Dispatch** button.
6. Check the **Dashboard** in the sidebar: the **Active Trips** count increases, **Available Vehicles** decreases, and **Fleet Utilization** flips upwards, reflecting that both the vehicle and driver statuses have transitioned to **On Trip**.

---

## 4. Business Rule Proof: Race Conditions & Compliance (45s)
1. Go back to the **Trips** screen and click **Plan New Trip**.
2. Create another Draft trip, but attempt to select **Tata Ace Van-05** or **Alex Fernandes**. Notice they are **excluded** from the dropdown options since their current status is **On Trip** (preventing accidental scheduling overlap).
3. **Concurrency Lock Demonstration**: If two dispatchers open separate browser tabs and click **Dispatch** at the exact same moment for the same vehicle, the backend's database row lock (`select_for_update()`) will ensure only one dispatcher succeeds, while the second gets rejected with a clean `409 Conflict` error toast: *"Vehicle is currently On Trip and unavailable."*
4. **License Expiry Compliance**: Go to the **Drivers** screen. Notice that any driver whose license is expiring within 30 days displays an warning alert triangle icon. If a driver's license is fully expired or their status is **Suspended**, any attempt to dispatch them will trigger a validation block: *"Driver license has expired"* or *"Driver is Suspended and unavailable."*

---

## 5. Complete the Loop: Completion & Maintenance (45s)
1. On the **Trips** list view, locate the active dispatched trip and click the **Complete** button.
2. In the **Complete Trip Dispatch** modal, the final odometer is prefilled as `12560.00` (original `12500` + `60` planned distance). Input Fuel Consumed: `12` Liters, and click **Complete Trip**. The vehicle and driver are immediately restored to **Available**.
3. Now, click **Maintenance** in the sidebar and click **Log Vehicle Maintenance**:
   - Select **Tata Ace Van-05** from the dropdown.
   - Input Description: `Routine engine oil change` and Estimated Cost: `150.00`.
   - Click **Submit Log**.
4. The vehicle's status is automatically changed to **In Shop**. If you navigate to **Trips** and open **Plan New Trip**, Tata Ace Van-05 no longer appears in the vehicle selection list.
5. In the **Maintenance** log list, click the **Complete Maintenance** icon for Tata Ace Van-05, enter the final cost, and confirm. The vehicle is immediately restored to **Available** status.

---

## 6. Reports & Closing (30s)
1. Navigate to the **Dashboard** (or **Finance** if logged in as **Financial Analyst**).
2. Look at the **Reports Center** widget and click **Export CSV Report**. This downloads `transitops_operations_report.csv` to your computer.
3. If logged in as the **Financial Analyst**, view the **Vehicle Return on Investment (ROI)** performance summary table directly on the Dashboard, showcasing live computed revenue ($2,000 per completed trip) versus cost (fuel logs and maintenance log totals) to assess asset yield.
4. **Closing**: TransitOps locks down the operational loop—ensuring strict regulatory compliance, race-condition immunity, and instant reporting visibility.

---

## Judge FAQ

### Q1: How does the system handle concurrent dispatch requests for the same vehicle?
**Answer:** The backend uses pessimistic database locking (`select_for_update()`) wrapped in a transaction block. When a dispatch request is received, it locks the vehicle and driver records. If a second request tries to dispatch the same vehicle concurrently, it will block until the first transaction commits. Once unblocked, it detects that the vehicle status is now `On Trip`, fails the validation check, and returns a `409 Conflict` error to the client, preventing double dispatches.

### Q2: Where is the cargo weight validation performed, and how are edge cases handled?
**Answer:** Cargo weight is validated both client-side and server-side. In the frontend modal, a live alert is displayed if the cargo weight exceeds the selected vehicle's maximum capacity. In the backend, the serializer enforces that `cargo_weight <= vehicle.max_load_capacity`. It allows boundary cases where the cargo exactly matches the capacity while blocking any loads that exceed it with a `400 Bad Request`.

### Q3: What logic determines if a driver's license is expired or warning-eligible?
**Answer:** Driver license checking happens in two areas. Client-side, the Drivers page computes the date difference relative to the current date and displays an warning icon if the license expires within 30 days. Server-side, when dispatching a trip, the backend blocks the transition and returns a `400 Bad Request` if the driver's license expiry date is less than the current date (expired).

### Q4: How does the maintenance workflow affect vehicle availability and trip dispatches?
**Answer:** When a vehicle enters maintenance, its status is changed to `In Shop`. In this state, it is excluded from all vehicle select dropdowns in the trips planner. Additionally, if the vehicle is currently `On Trip`, attempts to open a maintenance log will be rejected with a `409 Conflict` showing that the vehicle is currently active. Once maintenance is closed, the vehicle status is automatically restored to `Available` (unless `Retired`), making it immediately selectable for new trips.
