# Manual QA Checklist: TransitOps Screens

## Authentication
- [ ] Login succeeds for valid demo users
- [ ] Invalid credentials show a clear error message
- [ ] Token refresh works without requiring re-login

## Dashboard
- [ ] Dashboard KPI cards refresh after dispatch, completion, or maintenance changes
- [ ] `Fleet Utilization %` reflects dispatched vehicles divided by active vehicles
- [ ] Vehicles in shop appear in the attention panel when status is `In Shop`
- [ ] Drivers with license expiry within 30 days appear in the expiring licenses list

## Vehicles
- [ ] Creating a vehicle with duplicate registration number returns a field-specific error
- [ ] Available vehicles endpoint excludes vehicles with status `On Trip`, `In Shop`, or `Retired`
- [ ] Status filters and table search operate correctly

## Drivers
- [ ] Drivers with expired or suspended status are not selectable for trip dispatch
- [ ] Available drivers list contains only `Available` records
- [ ] Expiring licenses endpoint returns drivers with license dates within the next 30 days

## Trips
- [ ] Trip creation requires vehicle, driver, source, destination, cargo weight, and planned distance
- [ ] Cargo weight validation blocks submission when capacity is exceeded
- [ ] Draft trips can be dispatched, and dispatch updates vehicle/driver status
- [ ] Dispatched trips can be completed with final odometer and fuel consumed
- [ ] Cancelled and completed trips do not expose dispatch or complete actions
- [ ] Trip filters show all status categories and preserve selection state

## Maintenance
- [ ] Maintenance creation transitions the vehicle to `In Shop`
- [ ] Vehicles in `In Shop` disappear from available dispatch selections
- [ ] Closing maintenance returns the vehicle to `Available`
- [ ] Maintenance close action requires confirming the final cost and closing date

## Finance
- [ ] Fuel logs and expenses save correctly for the selected vehicle
- [ ] Vehicle cost summary aggregates fuel and maintenance costs accurately
- [ ] Export CSV report includes all expected fields and downloads successfully

## Regression / Acceptance
- [ ] Backend API returns structured JSON for success and error states
- [ ] React Query invalidation refreshes dashboard and list pages automatically after mutations
- [ ] UI toast messages show backend error messages without swallowing details
- [ ] Live demo flow works from trip creation to dispatch to completion with no manual refresh required
