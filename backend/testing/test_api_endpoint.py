"""
Test the actual API endpoint for question creation
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests
import json

BASE_URL = "http://localhost:5000"

def get_auth_token():
    """Get authentication token for admin user"""
    print("\n1. Authenticating as admin...")
    
    # Try to login with admin credentials
    login_data = {
        "email": "admin@careercompass.com",
        "password": "admin123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data, timeout=5)
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            print(f"   ✓ Authenticated successfully")
            return token
        else:
            print(f"   ⚠ Login failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"   ⚠ Could not authenticate: {e}")
        return None

def test_create_question_api(token):
    """Test the POST /admin/quiz/questions endpoint"""
    print("\n2. Testing POST /admin/quiz/questions endpoint...")
    
    if not token:
        print("   ⚠ No auth token available, skipping API test")
        return False
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Test data matching what the frontend sends
    question_data = {
        "skill_id": 1,
        "question_text": "What is the output of print(2 + 3) in Python?",
        "question_type": "multiple_choice",
        "options": ["5", "23", "Error", "None"],
        "correct_answer": "5",
        "difficulty": "easy",
        "explanation": "The + operator adds the two numbers, resulting in 5."
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/admin/quiz/questions",
            headers=headers,
            json=question_data,
            timeout=10
        )
        
        print(f"   Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✓ Question created successfully!")
            print(f"   Question ID: {data.get('question', {}).get('id')}")
            print(f"   Message: {data.get('message')}")
            return data.get('question', {}).get('id')
        elif response.status_code == 500:
            print(f"   ✗ Server error (500): {response.text}")
            return False
        else:
            print(f"   ⚠ Unexpected status: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"   ✗ Could not connect to server at {BASE_URL}")
        print(f"      Make sure the backend server is running!")
        return False
    except Exception as e:
        print(f"   ✗ Request failed: {e}")
        return False

def test_get_questions_api(token):
    """Test the GET /admin/quiz/questions endpoint"""
    print("\n3. Testing GET /admin/quiz/questions endpoint...")
    
    if not token:
        print("   ⚠ No auth token available, skipping API test")
        return False
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    try:
        response = requests.get(
            f"{BASE_URL}/admin/quiz/questions?limit=5",
            headers=headers,
            timeout=10
        )
        
        print(f"   Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            questions = data.get('questions', [])
            print(f"   ✓ Successfully retrieved {len(questions)} questions")
            if questions:
                print(f"   Sample question: {questions[0].get('question_text', 'N/A')[:50]}...")
                print(f"   Options: {questions[0].get('options', [])}")
            return True
        else:
            print(f"   ⚠ Unexpected status: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ✗ Request failed: {e}")
        return False

def cleanup_test_question(token, question_id):
    """Delete the test question"""
    if not question_id or not token:
        return
    
    print(f"\n4. Cleaning up test question (ID: {question_id})...")
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    try:
        response = requests.delete(
            f"{BASE_URL}/admin/quiz/questions/{question_id}",
            headers=headers,
            timeout=5
        )
        
        if response.status_code == 200:
            print(f"   ✓ Test question deleted")
        else:
            print(f"   ⚠ Could not delete test question: {response.status_code}")
            
    except Exception as e:
        print(f"   ⚠ Cleanup failed: {e}")

if __name__ == "__main__":
    print("=" * 60)
    print("Testing Admin Quiz API Endpoints")
    print("=" * 60)
    
    # Get auth token
    token = get_auth_token()
    
    if not token:
        print("\n⚠ Could not get authentication token.")
        print("   Make sure the backend server is running and admin user exists.")
        print("\n   To create an admin user, run:")
        print("   cd backend && python create_admin.py")
        sys.exit(1)
    
    # Test create question
    question_id = test_create_question_api(token)
    
    # Test get questions
    test_get_questions_api(token)
    
    # Cleanup
    if question_id:
        cleanup_test_question(token, question_id)
        print("\n" + "=" * 60)
        print("✓ API TEST PASSED - Question creation is working!")
        print("=" * 60)
        sys.exit(0)
    else:
        print("\n" + "=" * 60)
        print("✗ API TEST FAILED - Could not create question")
        print("=" * 60)
        sys.exit(1)
