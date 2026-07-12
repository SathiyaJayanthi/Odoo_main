import requests
import sqlite3
import threading
from datetime import datetime, timedelta
import json
import time

BASE_URL = 'http://127.0.0.1:8000/api/v1'
DB_PATH = 'd:/Odoo_main/backend/db.sqlite3'

def run():
    print("=== STARTING AUDIT ===")
    session = requests.Session()
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    c = conn.cursor()

    def check_error_shape(resp):
        try:
            data = resp.json()
            if 'error' in data and 'code' in data['error'] and 'message' in data['error'] and 'field' in data['error']:
                return True
        except:
            pass
        return False

    ts = str(int(time.time() * 1000))

    print("--- SECTION 1 ---")
    new_email = f'new_{ts}@test.com'
    r = session.post(f'{BASE_URL}/auth/signup/', json={'email': new_email, 'password': 'pass', 'role': 'driver'})
    print(f"Signup new: {r.status_code}")
    c.execute(f"SELECT password FROM accounts_user WHERE email='{new_email}'")
    row = c.fetchone()
    print(f"Hashed pwd check: {row is not None and not str(row[0]).startswith('pass')}")
    r = session.post(f'{BASE_URL}/auth/signup/', json={'email': new_email, 'password': 'pass', 'role': 'driver'})
    print(f"Signup dup: {r.status_code}, error shape: {check_error_shape(r)}")
    r = session.post(f'{BASE_URL}/auth/signup/', json={'email': 'bad@test.com', 'password': 'pass', 'role': 'invalid_role'})
    print(f"Signup invalid role: {r.status_code}, error shape: {check_error_shape(r)}")
    tokens = {}
    for role, email in [('fleet_manager', 'fleet_manager@demo.com'), ('driver', 'driver@demo.com'), ('safety_officer', 'safety_officer@demo.com'), ('financial_analyst', 'financial_analyst@demo.com')]:
        r = session.post(f'{BASE_URL}/auth/login/', json={'email': email, 'password': 'demopass123'})
        print(f"Login {role}: {r.status_code}")
        if r.status_code == 200:
            tokens[role] = r.json().get('access')
    r = session.post(f'{BASE_URL}/auth/login/', json={'email': 'fleet_manager@demo.com', 'password': 'wrong'})
    print(f"Login wrong pwd: {r.status_code}, error shape: {check_error_shape(r)}")
    r = session.post(f'{BASE_URL}/vehicles/', json={})
    print(f"No auth protected: {r.status_code}, error shape: {check_error_shape(r)}")
    r = session.post(f'{BASE_URL}/vehicles/', headers={'Authorization': f'Bearer {tokens.get("driver", "")}'}, json={'registration_number':'XYZ'})
    print(f"Driver post vehicle: {r.status_code}, error shape: {check_error_shape(r)}")
    fm_headers = {'Authorization': f'Bearer {tokens.get("fleet_manager", "")}'}

    print("--- SECTION 2 ---")
    reg1 = f'REG1_{ts}'
    payload = {'registration_number': reg1, 'name_model': 'Model', 'type': 'Van', 'max_load_capacity': 100, 'acquisition_cost': 5000}
    r = session.post(f'{BASE_URL}/vehicles/', headers=fm_headers, json=payload)
    print(f"Vehicle create: {r.status_code}")
    vid1 = r.json().get('id') if r.status_code == 201 else None
    r = session.post(f'{BASE_URL}/vehicles/', headers=fm_headers, json=payload)
    print(f"Vehicle dup reg: {r.status_code}, error shape: {check_error_shape(r)}")
    bad_payload = payload.copy()
    bad_payload.update({'registration_number': f'REG2_{ts}', 'max_load_capacity': -10})
    r = session.post(f'{BASE_URL}/vehicles/', headers=fm_headers, json=bad_payload)
    print(f"Vehicle capacity <= 0: {r.status_code}, error shape: {check_error_shape(r)}")
    r = session.get(f'{BASE_URL}/vehicles/?status=Available', headers=fm_headers)
    all_available = all(v['status'] == 'Available' for v in r.json()) if r.status_code == 200 else False
    print(f"Get available only: {all_available}")
    if vid1:
        c.execute(f"UPDATE vehicles_vehicle SET status='Retired' WHERE id='{vid1}'")
        conn.commit()
        r = session.get(f'{BASE_URL}/vehicles/available/', headers=fm_headers)
        in_available = any(v['id'] == vid1 for v in r.json()) if r.status_code == 200 else False
        print(f"Retired excluded from /available/: {not in_available}")
        r = session.patch(f'{BASE_URL}/vehicles/{vid1}/', headers={'Authorization': f'Bearer {tokens.get("driver", "")}'}, json={'name_model': 'X'})
        print(f"Driver patch vehicle: {r.status_code}, error shape: {check_error_shape(r)}")
        # Verify delete on active trip in sec4

    print("--- SECTION 3 ---")
    lic1 = f'LIC1_{ts}'
    driver_payload = {'name': 'D1', 'license_number': lic1, 'license_category': 'Commercial', 'license_expiry': '2030-01-01', 'contact_number': '123'}
    r1 = session.post(f'{BASE_URL}/drivers/', headers=fm_headers, json=driver_payload)
    print(f"Driver create FM: {r1.status_code}")
    d1 = r1.json().get('id') if r1.status_code == 201 else None
    so_headers = {'Authorization': f'Bearer {tokens.get("safety_officer", "")}'}
    lic2 = f'LIC2_{ts}'
    driver_payload2 = {'name': 'D2', 'license_number': lic2, 'license_category': 'Commercial', 'license_expiry': '2030-01-01', 'contact_number': '123'}
    r2 = session.post(f'{BASE_URL}/drivers/', headers=so_headers, json=driver_payload2)
    print(f"Driver create SO: {r2.status_code}")
    d2 = r2.json().get('id') if r2.status_code == 201 else None
    r3 = session.post(f'{BASE_URL}/drivers/', headers=fm_headers, json=driver_payload)
    print(f"Driver dup license: {r3.status_code}")
    if d1:
        c.execute(f"UPDATE drivers_driver SET license_expiry='2020-01-01' WHERE id='{d1}'")
        conn.commit()
        r = session.get(f'{BASE_URL}/drivers/available/', headers=fm_headers)
        in_available = any(d['id'] == d1 for d in r.json()) if r.status_code == 200 else False
        print(f"Expired excluded from /available/: {not in_available}")
    r = session.get(f'{BASE_URL}/drivers/expiring-licenses/?days=30', headers=so_headers)
    print(f"Expiring licenses SO: {r.status_code}")
    r = session.get(f'{BASE_URL}/drivers/expiring-licenses/', headers={'Authorization': f'Bearer {tokens.get("driver", "")}'})
    print(f"Expiring licenses Driver: {r.status_code}")

    print("--- SECTION 4 ---")
    v2_reg = f'REG_T1_{ts}'
    v2_payload = {'registration_number': v2_reg, 'name_model': 'Model', 'type': 'Van', 'max_load_capacity': 100, 'acquisition_cost': 5000}
    vid2 = session.post(f'{BASE_URL}/vehicles/', headers=fm_headers, json=v2_payload).json().get('id')
    v3_reg = f'REG_T2_{ts}'
    v3_payload = {'registration_number': v3_reg, 'name_model': 'Model', 'type': 'Van', 'max_load_capacity': 100, 'acquisition_cost': 5000}
    vid3 = session.post(f'{BASE_URL}/vehicles/', headers=fm_headers, json=v3_payload).json().get('id')
    
    if vid2 and d2:
        trip_payload = {'vehicle_id': vid2, 'driver_id': d2, 'source': 'A', 'destination': 'B', 'cargo_weight': 150, 'planned_distance': 10}
        r = session.post(f'{BASE_URL}/trips/', headers=fm_headers, json=trip_payload)
        print(f"Trip weight > max: {r.status_code}, error shape: {check_error_shape(r)}")
        trip_payload['cargo_weight'] = 100
        r = session.post(f'{BASE_URL}/trips/', headers=fm_headers, json=trip_payload)
        print(f"Trip weight == max: {r.status_code}")
        tid = r.json().get('id') if r.status_code == 201 else None

        if tid:
            r = session.post(f'{BASE_URL}/trips/{tid}/dispatch/', headers=fm_headers)
            print(f"Trip dispatch: {r.status_code}")
            c.execute(f"SELECT status FROM trips_trip WHERE id={tid}")
            trip_status = c.fetchone()[0]
            c.execute(f"SELECT status FROM vehicles_vehicle WHERE id={vid2}")
            veh_status = c.fetchone()[0]
            c.execute(f"SELECT status FROM drivers_driver WHERE id={d2}")
            drv_status = c.fetchone()[0]
            print(f"States after dispatch: Trip={trip_status}, Veh={veh_status}, Drv={drv_status}")

            trip_payload2 = {'vehicle_id': vid2, 'driver_id': d2, 'source': 'A', 'destination': 'B', 'cargo_weight': 50, 'planned_distance': 10}
            r2_t = session.post(f'{BASE_URL}/trips/', headers=fm_headers, json=trip_payload2)
            tid2 = r2_t.json().get('id') if r2_t.status_code == 201 else None
            if tid2:
                r_disp2 = session.post(f'{BASE_URL}/trips/{tid2}/dispatch/', headers=fm_headers)
                print(f"Dispatch 2nd trip same vehicle: {r_disp2.status_code}")
                # check delete vehicle 409
                r_del_veh = session.delete(f'{BASE_URL}/vehicles/{vid2}/', headers=fm_headers)
                print(f"DELETE vehicle active trip: {r_del_veh.status_code}")

            # expire driver
            trip_payload3 = {'vehicle_id': vid3, 'driver_id': d2, 'source': 'A', 'destination': 'B', 'cargo_weight': 50, 'planned_distance': 10}
            tid3 = session.post(f'{BASE_URL}/trips/', headers=fm_headers, json=trip_payload3).json().get('id')
            c.execute(f"UPDATE drivers_driver SET license_expiry='2020-01-01' WHERE id='{d2}'")
            conn.commit()
            r = session.post(f'{BASE_URL}/trips/{tid3}/dispatch/', headers=fm_headers)
            print(f"Dispatch with expired driver: {r.status_code}")
            c.execute(f"UPDATE drivers_driver SET license_expiry='2030-01-01' WHERE id='{d2}'")
            conn.commit()

            r = session.post(f'{BASE_URL}/trips/{tid}/complete/', headers=fm_headers, json={'final_odometer': 50, 'fuel_consumed': 5})
            print(f"Trip complete: {r.status_code}")
            c.execute(f"SELECT status FROM trips_trip WHERE id={tid}")
            trip_status = c.fetchone()[0]
            c.execute(f"SELECT status, odometer FROM vehicles_vehicle WHERE id={vid2}")
            veh_row = c.fetchone()
            veh_status = veh_row[0]
            veh_odo = veh_row[1]
            c.execute(f"SELECT status FROM drivers_driver WHERE id={d2}")
            drv_status = c.fetchone()[0]
            print(f"States after complete: Trip={trip_status}, Veh={veh_status}, Drv={drv_status}, Odo={veh_odo}")

            tid4 = session.post(f'{BASE_URL}/trips/', headers=fm_headers, json=trip_payload3).json().get('id')
            r = session.post(f'{BASE_URL}/trips/{tid4}/cancel/', headers=fm_headers)
            print(f"Cancel draft: {r.status_code}")
            tid5 = session.post(f'{BASE_URL}/trips/', headers=fm_headers, json=trip_payload3).json().get('id')
            session.post(f'{BASE_URL}/trips/{tid5}/dispatch/', headers=fm_headers)
            r = session.post(f'{BASE_URL}/trips/{tid5}/cancel/', headers=fm_headers)
            print(f"Cancel dispatched: {r.status_code}")
            c.execute(f"SELECT status FROM vehicles_vehicle WHERE id={vid3}")
            veh_status = c.fetchone()[0]
            print(f"Vehicle status after cancel dispatched: {veh_status}")
            r = session.post(f'{BASE_URL}/trips/{tid}/cancel/', headers=fm_headers)
            print(f"Cancel completed: {r.status_code}")

            def do_dispatch(tid, results, i):
                res = session.post(f'{BASE_URL}/trips/{tid}/dispatch/', headers=fm_headers)
                results[i] = res.status_code

            tid6 = session.post(f'{BASE_URL}/trips/', headers=fm_headers, json=trip_payload3).json().get('id')
            res_list = [0, 0]
            t1 = threading.Thread(target=do_dispatch, args=(tid6, res_list, 0))
            t2 = threading.Thread(target=do_dispatch, args=(tid6, res_list, 1))
            t1.start(); t2.start()
            t1.join(); t2.join()
            print(f"Concurrency dispatch: {res_list}")

            print("--- SECTION 5 ---")
            tid7 = session.post(f'{BASE_URL}/trips/', headers=fm_headers, json=trip_payload3).json().get('id')
            session.post(f'{BASE_URL}/trips/{tid7}/dispatch/', headers=fm_headers)
            r = session.post(f'{BASE_URL}/maintenance/', headers=fm_headers, json={'vehicle_id': vid3, 'description': 'desc', 'estimated_cost': 100})
            print(f"Maintenance on On Trip: {r.status_code}")

            r = session.post(f'{BASE_URL}/maintenance/', headers=fm_headers, json={'vehicle_id': vid2, 'description': 'desc', 'estimated_cost': 100})
            print(f"Maintenance on Available: {r.status_code}")
            mid = r.json().get('id') if r.status_code == 201 else None
            r = session.get(f'{BASE_URL}/vehicles/available/', headers=fm_headers)
            in_available = any(v['id'] == vid2 for v in r.json()) if r.status_code == 200 else False
            print(f"In Shop excluded from /available/: {not in_available}")

            if mid:
                r_del_veh2 = session.delete(f'{BASE_URL}/vehicles/{vid2}/', headers=fm_headers)
                print(f"DELETE vehicle open maintenance: {r_del_veh2.status_code}")

                r = session.post(f'{BASE_URL}/maintenance/{mid}/close/', headers=fm_headers, json={'final_cost': 120, 'notes': 'done'})
                print(f"Maintenance close: {r.status_code}")
                c.execute(f"SELECT status FROM vehicles_vehicle WHERE id={vid2}")
                veh_status = c.fetchone()[0]
                print(f"Vehicle status after close: {veh_status}")

                r = session.post(f'{BASE_URL}/maintenance/{mid}/close/', headers=fm_headers, json={'final_cost': 120, 'notes': 'done'})
                print(f"Maintenance close already closed: {r.status_code}")

            print("--- SECTION 6 ---")
            r = session.post(f'{BASE_URL}/fuel-logs/', headers=fm_headers, json={'vehicle_id': vid2, 'trip_id': tid, 'gallons': 5, 'cost': 15})
            print(f"Fuel log create: {r.status_code}")
            r = session.post(f'{BASE_URL}/expenses/', headers=fm_headers, json={'vehicle_id': vid2, 'trip_id': tid, 'amount': 20, 'category': 'Toll'})
            print(f"Expense create: {r.status_code}")

            r = session.get(f'{BASE_URL}/vehicles/{vid2}/cost-summary/', headers=fm_headers)
            print(f"Cost summary: {r.status_code} -> {r.json() if r.status_code == 200 else ''}")

    print("--- SECTION 7 ---")
    r = session.get(f'{BASE_URL}/reports/dashboard/', headers=fm_headers)
    print(f"Dashboard: {r.status_code}")
    
    fa_headers = {'Authorization': f'Bearer {tokens.get("financial_analyst", "")}'}
    r = session.get(f'{BASE_URL}/reports/fuel-efficiency/', headers=fa_headers)
    print(f"Fuel efficiency FA: {r.status_code}")
    
    r = session.get(f'{BASE_URL}/reports/fuel-efficiency/', headers={'Authorization': f'Bearer {tokens.get("driver", "")}'})
    print(f"Fuel efficiency Driver: {r.status_code}")

    r = session.get(f'{BASE_URL}/reports/export/?type=csv', headers=fa_headers)
    print(f"Export CSV: {r.status_code} ({r.headers.get('Content-Type')})")
    
    # alert
    r = session.get(f'{BASE_URL}/reports/maintenance-alerts/', headers=fm_headers)
    print(f"Maintenance alerts: {r.status_code}")
    
    conn.close()

if __name__ == "__main__":
    run()
