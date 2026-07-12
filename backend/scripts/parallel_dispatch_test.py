import requests
import threading
import time
import json

BASE = 'http://localhost:8000/api/v1'
creds = {'email':'fleet_manager@demo.com','password':'demopass123'}

s = requests.Session()
login = s.post(f'{BASE}/auth/login/', json=creds, timeout=10)
if login.status_code != 200:
    print(json.dumps({'error':'login_failed','status':login.status_code,'text':login.text}))
    raise SystemExit(1)

token = login.json().get('access')
headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

# pick first available vehicle and driver
vs = s.get(f'{BASE}/vehicles/available/', headers=headers, timeout=10).json()
ds = s.get(f'{BASE}/drivers/available/', headers=headers, timeout=10).json()
if not vs or not ds:
    print(json.dumps({'error':'no_vehicle_or_driver','vehicles':vs,'drivers':ds}))
    raise SystemExit(1)

payload = {
    'vehicle_id': vs[0]['id'],
    'driver_id': ds[0]['id'],
    'source': 'parallel test src',
    'destination': 'parallel test dst',
    'cargo_weight': 10,
    'planned_distance': 5
}
create = s.post(f'{BASE}/trips/', json=payload, headers=headers, timeout=10)
if create.status_code not in (200,201):
    print(json.dumps({'error':'create_failed','status':create.status_code,'text':create.text}))
    raise SystemExit(1)
trip = create.json()
trip_id = trip['id']

results = []

def dispatch_thread(name):
    try:
        r = s.post(f'{BASE}/trips/{trip_id}/dispatch/', headers=headers, timeout=10)
        try:
            body = r.json()
        except:
            body = r.text
        results.append({'thread': name, 'status': r.status_code, 'body': body})
    except Exception as e:
        results.append({'thread': name, 'error': str(e)})

# start two threads nearly simultaneously
t1 = threading.Thread(target=dispatch_thread, args=('t1',))
t2 = threading.Thread(target=dispatch_thread, args=('t2',))

# small sleep to align
t1.start()
time.sleep(0.05)
t2.start()

t1.join()
t2.join()

print(json.dumps({'trip_id':trip_id, 'results': results}, default=str))
