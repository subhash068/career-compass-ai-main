import requests
import json

# Login as user 26 (innovative@gmail.com)
login_url = 'http://localhost:5000/auth/login'
login_data = {
    'email': 'innovative@gmail.com',
    'password': 'Subh@sh12345'
}

print('Step 1: Logging in as innovative@gmail.com...')
login_response = requests.post(login_url, json=login_data)
if login_response.status_code != 200:
    print(f'✗ Login failed: {login_response.status_code}')
    print(f'Response: {login_response.text}')
    exit(1)

token = login_response.json()['access_token']
user = login_response.json().get('user', {})
print(f'✓ Got token for user {user.get("id")}: {token[:30]}...')

# Test the completed assessments endpoint
completed_url = 'http://localhost:5000/api/assessment/completed'
headers = {
    'Authorization': f'Bearer {token}'
}

print(f'\nStep 2: Testing completed assessments endpoint...')
response = requests.get(completed_url, headers=headers)
print(f'Status: {response.status_code}')
print(f'Response: {response.text[:2000]}')

if response.status_code == 200:
    data = response.json()
    assessments = data.get('assessments', [])
    print(f'\n✓ Success! Found {len(assessments)} completed assessments')
    for assessment in assessments[:10]:
        print(f'  - {assessment["skill_name"]}: {assessment["score"]:.1f}% ({assessment["level"]})')
elif response.status_code == 404:
    print(f'✗ No completed assessments found (404)')
else:
    print(f'✗ Failed: {response.status_code}')
    print(f'Error: {response.text}')
