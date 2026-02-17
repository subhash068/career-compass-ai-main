import requests
import json

def test_assessment_start():
    # First, login to get token
    login_url = 'http://localhost:5000/auth/login'
    login_data = {
        'email': 'test@example.com',
        'password': 'password123'
    }

    print("=" * 60)
    print("Testing Assessment Start Fix")
    print("=" * 60)
    
    print("\nStep 1: Logging in...")
    try:
        login_response = requests.post(login_url, json=login_data)
        if login_response.status_code != 200:
            print(f"✗ Login failed: {login_response.status_code}")
            print(f"Response: {login_response.text}")
            return False
    except Exception as e:
        print(f"✗ Login request failed: {e}")
        return False

    token = login_response.json()['access_token']
    print(f"✓ Got token: {token[:30]}...")

    # Test assessment start endpoint
    assessment_url = 'http://localhost:5000/api/assessment/start/2'
    headers = {
        'Authorization': f'Bearer {token}'
    }

    print(f"\nStep 2: Testing assessment start at {assessment_url}")
    try:
        response = requests.get(assessment_url, headers=headers)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✓ Assessment start successful!")
            data = response.json()
            print(f"Skill: {data.get('skill_name')}")
            print(f"Questions count: {len(data.get('questions', []))}")
            print(f"Time limit: {data.get('time_limit')} seconds")
            
            if data.get('questions'):
                print(f"\nFirst question: {data['questions'][0]['question_text'][:60]}...")
            return True
        else:
            print(f"✗ Assessment start failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"✗ Request failed: {e}")
        return False

if __name__ == "__main__":
    success = test_assessment_start()
    print("\n" + "=" * 60)
    if success:
        print("✓ FIX VERIFIED - Assessment start is working!")
    else:
        print("✗ FIX FAILED - Assessment start still has issues")
    print("=" * 60)
