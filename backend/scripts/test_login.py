import requests
import json

resp = requests.post('http://localhost:8000/api/v1/auth/login/', json={
    'email':'fleet_manager@demo.com',
    'password':'demopass123'
})
print(resp.status_code)
try:
    print(json.dumps(resp.json(), indent=2))
except Exception:
    print(resp.text)
