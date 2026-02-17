"""
Test the template download endpoint
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import requests

BASE_URL = "http://localhost:5000"

def test_template_download():
    """Test the GET /admin/quiz/download-template endpoint"""
    print("=" * 60)
    print("Testing Template Download")
    print("=" * 60)
    
    # First, try to authenticate
    print("\n1. Authenticating as admin...")
    login_data = {
        "email": "admin@careercompass.com",
        "password": "admin123"
    }
    
    token = None
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data, timeout=5)
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            print(f"   ✓ Authenticated successfully")
        else:
            print(f"   ⚠ Login failed: {response.status_code}")
    except Exception as e:
        print(f"   ⚠ Could not authenticate: {e}")
    
    if not token:
        print("\n⚠ Cannot test without authentication")
        return False
    
    # Test template download
    print("\n2. Testing template download...")
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    try:
        response = requests.get(
            f"{BASE_URL}/admin/quiz/download-template",
            headers=headers,
            timeout=10
        )
        
        print(f"   Response status: {response.status_code}")
        print(f"   Content-Type: {response.headers.get('Content-Type', 'N/A')}")
        print(f"   Content-Length: {response.headers.get('Content-Length', 'N/A')}")
        
        if response.status_code == 200:
            content = response.content
            print(f"   ✓ Download successful!")
            print(f"   File size: {len(content)} bytes")
            
            # Check if it's a valid Excel file
            if content[:4] == b'PK\x03\x04':
                print("   ✓ Valid Excel file format (ZIP/XLSX)")
            else:
                print(f"   ⚠ Unexpected file format. First bytes: {content[:20]}")
            
            return True
        else:
            print(f"   ✗ Download failed: {response.text[:200]}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"   ✗ Could not connect to server at {BASE_URL}")
        print(f"      Make sure the backend server is running!")
        return False
    except Exception as e:
        print(f"   ✗ Request failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_template_download()
    print("\n" + "=" * 60)
    if success:
        print("✓ TEMPLATE DOWNLOAD TEST PASSED")
    else:
        print("✗ TEMPLATE DOWNLOAD TEST FAILED")
    print("=" * 60)
    sys.exit(0 if success else 1)
