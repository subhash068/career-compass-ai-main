import requests
import json

# First, login to get token
login_url = 'http://localhost:5000/auth/login'
login_data = {
    'email': 'test@example.com',
    'password': 'password123'
}

print("Step 1: Logging in...")
login_response = requests.post(login_url, json=login_data)
if login_response.status_code != 200:
    print(f"✗ Login failed: {login_response.status_code}")
    exit(1)

token = login_response.json()['access_token']
print(f"✓ Got token: {token[:30]}...")

# Test assessment start endpoint
assessment_url = 'http://localhost:5000/api/assessment/start/2'
headers = {
    'Authorization': f'Bearer {token}'
}

print(f"\nStep 2: Testing assessment start at {assessment_url}")
response = requests.get(assessment_url, headers=headers)
print(f"Status: {response.status_code}")
print(f"Response: {response.text[:500]}")

if response.status_code == 200:
    print("✓ Assessment start successful!")
    data = response.json()
    print(f"Questions count: {len(data.get('questions', []))}")
else:
    print(f"✗ Assessment start failed: {response.status_code}")
