#!/usr/bin/env python3
"""
Diagnostic script to verify all API routes are registered correctly.
Run this after starting the server to check if routes are available.
"""

import requests
import sys

BASE_URL = "http://localhost:5000"

def check_route(method, path, expected_status=None):
    """Check if a route is accessible"""
    url = f"{BASE_URL}{path}"
    try:
        if method == "GET":
            response = requests.get(url, timeout=5)
        elif method == "POST":
            response = requests.post(url, timeout=5)
        else:
            response = requests.request(method, url, timeout=5)
        
        status = response.status_code
        if expected_status and status == expected_status:
            print(f"✅ {method} {path} - {status} (expected)")
        elif status == 404:
            print(f"❌ {method} {path} - 404 NOT FOUND")
        elif status == 500:
            print(f"⚠️  {method} {path} - 500 SERVER ERROR")
        elif status in [401, 403]:
            print(f"✅ {method} {path} - {status} (protected - good)")
        else:
            print(f"ℹ️  {method} {path} - {status}")
            
    except requests.exceptions.ConnectionError:
        print(f"❌ {method} {path} - SERVER NOT RUNNING")
        sys.exit(1)
    except Exception as e:
        print(f"❌ {method} {path} - ERROR: {e}")

def main():
    print("=" * 60)
    print("Career Compass AI - Route Diagnostics")
    print("=" * 60)
    print()
    
    # Check server is running
    try:
        response = requests.get(f"{BASE_URL}/status", timeout=5)
        if response.status_code == 200:
            print("✅ Server is running")
            print(f"   Status: {response.json()}")
        else:
            print(f"⚠️  Server returned status {response.status_code}")
    except Exception as e:
        print(f"❌ Cannot connect to server at {BASE_URL}")
        print(f"   Error: {e}")
        print()
        print("Please start the server with:")
        print("   cd backend && uvicorn app:app --reload --port 5000")
        sys.exit(1)
    
    print()
    print("-" * 60)
    print("Checking Routes:")
    print("-" * 60)
    
    # Auth routes
    check_route("POST", "/auth/login", 422)  # 422 = missing body (expected)
    check_route("POST", "/auth/register", 422)
    check_route("GET", "/auth/profile", 401)  # 401 = needs auth (expected)
    
    # Skills routes
    check_route("GET", "/skills/", 401)
    check_route("GET", "/skills/assessment", 401)
    check_route("GET", "/skills/analyze", 401)
    
    # Career routes
    check_route("GET", "/career/matches", 401)
    
    # Learning routes
    check_route("GET", "/learning/paths", 401)
    check_route("POST", "/learning/paths", 401)
    
    # Chatbot routes
    check_route("POST", "/chatbot/message", 401)
    
    # Admin routes
    check_route("GET", "/admin/health", 401)
    
    print()
    print("=" * 60)
    print("Legend:")
    print("  ✅ Route exists and is protected (good)")
    print("  ❌ Route not found (404) - needs server restart")
    print("  ⚠️  Server error (500) - check backend logs")
    print("=" * 60)

if __name__ == "__main__":
    main()
