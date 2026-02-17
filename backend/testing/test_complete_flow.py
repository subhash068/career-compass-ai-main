#!/usr/bin/env python3
"""
Test complete authentication and assessment flow
"""
import requests
import json

BASE_URL = "http://localhost:5000"

def test_login():
    """Test login endpoint"""
    print("\n=== Testing Login ===")
    url = f"{BASE_URL}/auth/login"
    data = {
        "email": "test@example.com",
        "password": "password123"
    }
    
    response = requests.post(url, json=data)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        resp_data = response.json()
        print(f"✓ Login successful!")
        print(f"  User: {resp_data['user']['name']} ({resp_data['user']['email']})")
        print(f"  Role: {resp_data['user']['role']}")
        return resp_data['access_token']
    else:
        print(f"✗ Login failed: {response.text}")
        return None

def test_skills_endpoint(token):
    """Test skills endpoint"""
    print("\n=== Testing Skills Endpoint ===")
    url = f"{BASE_URL}/skills/"
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(url, headers=headers)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        skills = response.json()
        print(f"✓ Got {len(skills)} skills")
        if skills:
            print(f"  First skill: {skills[0]['name']} (ID: {skills[0]['id']})")
        return skills
    else:
        print(f"✗ Skills endpoint failed: {response.text}")
        return None

def test_career_matches(token):
    """Test career matches endpoint"""
    print("\n=== Testing Career Matches ===")
    url = f"{BASE_URL}/career/matches"
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(url, headers=headers)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        recommendations = data.get('recommendations', [])
        print(f"✓ Got {len(recommendations)} career recommendations")
        return data
