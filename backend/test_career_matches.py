#!/usr/bin/env python3
"""
Test script to verify career matching API returns data correctly.
"""
import requests
import json
import sys

BASE_URL = "http://localhost:8000"
TOKEN = "your-auth-token-here"  # Replace with actual token

def test_career_matches():
    """Test the career matches endpoint."""
    print("=" * 60)
    print("TESTING CAREER MATCHES API")
    print("=" * 60)
    
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }
    
    try:
        # Test career matches endpoint
        print("\n1. Testing GET /career/matches")
        response = requests.get(
            f"{BASE_URL}/career/matches",
            headers=headers,
            timeout=10
        )
        
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Response Keys: {list(data.keys())}")
            
            recommendations = data.get('recommendations', [])
            top_matches = data.get('topMatches', [])
            
            print(f"   Recommendations Count: {len(recommendations)}")
            print(f"   Top Matches Count: {len(top_matches)}")
            
            if recommendations:
                print("\n   First Recommendation:")
                rec = recommendations[0]
                print(f"     - Role ID: {rec.get('role_id')}")
                print(f"     - Title: {rec.get('title')}")
                print(f"     - Match %: {rec.get('match_percentage')}")
                print(f"     - Matched Skills: {len(rec.get('matched_skills', []))}")
                print(f"     - Missing Skills: {len(rec.get('missing_skills', []))}")
            else:
                print("\n   WARNING: No recommendations returned!")
                print("   This could mean:")
                print("   - User has no assessments")
                print("   - No job roles in database")
                print("   - No role skill requirements defined")
        else:
            print(f"   ERROR: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"   ERROR: {str(e)}")
    
    print("\n" + "=" * 60)

def test_career_roles():
    """Test the career roles endpoint."""
    print("TESTING CAREER ROLES API")
    print("=" * 60)
    
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }
    
    try:
        # Test career roles endpoint
        print("\n2. Testing GET /career/roles")
        response = requests.get(
            f"{BASE_URL}/career/roles",
            headers=headers,
            timeout=10
        )
        
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Roles Count: {len(data)}")
            
            if data:
                print("\n   First Role:")
                role = data[0]
                print(f"     - ID: {role.get('id')}")
                print(f"     - Title: {role.get('title')}")
                print(f"     - Level: {role.get('level')}")
            else:
                print("\n   WARNING: No job roles in database!")
        else:
            print(f"   ERROR: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"   ERROR: {str(e)}")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    print("\nMake sure:")
    print("1. Backend server is running on http://localhost:8000")
    print("2. You have a valid auth token")
    print("3. Database has job roles and skill requirements")
    print("\n")
    
    # Update token from command line
    if len(sys.argv) > 1:
        global TOKEN
        TOKEN = sys.argv[1]
    
    test_career_matches()
    test_career_roles()
