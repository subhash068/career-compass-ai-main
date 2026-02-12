import requests

# Test the assessment endpoint
assessment_url = 'http://localhost:5000/api/assessment/start/2'
headers = {'Authorization': 'Bearer test_token'}

print(f"Testing {assessment_url}")
response = requests.get(assessment_url, headers=headers)

print(f"Status: {response.status_code}")
print(f"Response: {response.text}")

if response.status_code == 500:
    print("❌ 500 Internal Server Error - still broken")
elif response.status_code == 401:
    print("✅ Authentication required (expected)")
elif response.status_code == 200:
    print("✅ Endpoint working!")
else:
    print(f"⚠️  Unexpected status: {response.status_code}")
