import requests
import json

# Test login endpoint
url = 'http://localhost:5000/auth/login'
data = {
    'email': 'test@example.com',
    'password': 'password123'
}

print(f'Testing login at {url}')
print(f'Request data: {json.dumps(data, indent=2)}')

response = requests.post(url, json=data)
print(f'Status: {response.status_code}')
print(f'Response: {response.text}')

if response.status_code == 200:
    print('✓ Login successful!')
    resp_data = response.json()
    print(f'User: {resp_data.get("user", {})}')
    print(f'Token: {resp_data.get("access_token", "N/A")[:20]}...')
else:
    print('✗ Login failed')
