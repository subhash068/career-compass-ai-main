import requests
import sys

def test_assessment_endpoint():
    # First, login to get a valid token
    login_url = "http://localhost:5000/auth/login"

    try:
        # Try to login with test credentials
        login_response = requests.post(
            login_url,
            json={"email": "test@example.com", "password": "password123"}
        )
        print(f"Login status: {login_response.status_code}")

        if login_response.status_code == 200:
            token = login_response.json().get("access_token")
            print(f"Got token: {token[:20]}...")
        else:
            print(f"Login failed: {login_response.text}")
            # Try with a different common test user
            login_response = requests.post(
                login_url,
                json={"email": "admin@example.com", "password": "admin123"}
            )
            print(f"Admin login status: {login_response.status_code}")
            if login_response.status_code == 200:
                token = login_response.json().get("access_token")
                print(f"Got admin token: {token[:20]}...")
            else:
                print("Using test token instead")
                token = "test_token"

        # Now test the assessment endpoint
        assessment_url = "http://localhost:5000/api/assessment/start/2"
        headers = {"Authorization": f"Bearer {token}"}

        print(f"\nTesting GET {assessment_url}")
        response = requests.get(assessment_url, headers=headers)

        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:500]}")

        if response.status_code == 500:
            print("\n!!! 500 ERROR - Server issue !!!")
            return False
        elif response.status_code == 200:
            print("\n✓ Endpoint working!")
            return True
        else:
            print(f"\nUnexpected status: {response.status_code}")
            return False

    except requests.exceptions.ConnectionError:
        print("ERROR: Cannot connect to server. Is it running?")
        return False
    except Exception as e:
        print(f"ERROR: {e}")
        return False

if __name__ == "__main__":
    success = test_assessment_endpoint()
    sys.exit(0 if success else 1)
