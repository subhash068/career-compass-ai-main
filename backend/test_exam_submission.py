#!/usr/bin/env python3
"""
Test script to verify exam submission and results storage
"""
import requests
import json

BASE_URL = "http://localhost:5000"

def test_exam_submission():
    """Test the complete exam submission flow"""
    
    # Step 1: Login to get token
    print("=" * 60)
    print("STEP 1: Login")
    print("=" * 60)
    
    login_data = {
        "email": "test@example.com",
        "password": "testpassword123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        print(f"Login Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"Login failed: {response.text}")
            # Try to create a test user if login fails
            print("\nAttempting to create test user...")
            register_data = {
                "email": "test@example.com",
                "password": "testpassword123",
                "name": "Test User"
            }
            response = requests.post(f"{BASE_URL}/auth/register", json=register_data)

            print(f"Register Status: {response.status_code}")
            
            if response.status_code not in [200, 201]:
                print("Could not create test user. Please ensure backend is running.")
                return False
            
            # Try login again
            response = requests.post(f"{BASE_URL}/auth/login", json=login_data)

            if response.status_code != 200:
                print("Login still failed after registration")
                return False
        
        token = response.json().get("access_token")
        print(f"✓ Got token: {token[:20]}...")
        
    except Exception as e:
        print(f"Error during login: {e}")
        return False
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Step 2: Start a quiz for a skill
    print("\n" + "=" * 60)
    print("STEP 2: Start Quiz")
    print("=" * 60)
    
    skill_id = 2  # HTML skill
    try:
        response = requests.get(
            f"{BASE_URL}/api/assessment/start/{skill_id}",
            headers=headers
        )
        print(f"Start Quiz Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"Failed to start quiz: {response.text}")
            return False
        
        quiz_data = response.json()
        print(f"✓ Got {len(quiz_data['questions'])} questions for skill: {quiz_data['skill_name']}")
        
        # Show first question
        if quiz_data['questions']:
            q = quiz_data['questions'][0]
            print(f"  Sample question: {q['question_text'][:50]}...")
        
    except Exception as e:
        print(f"Error starting quiz: {e}")
        return False
    
    # Step 3: Submit quiz answers
    print("\n" + "=" * 60)
    print("STEP 3: Submit Quiz")
    print("=" * 60)
    
    # Create mock answers (select first option for each question)
    answers = {}
    for q in quiz_data['questions']:
        answers[q['id']] = q['options'][0]  # Select first option
    
    submit_data = {
        "skill_id": skill_id,
        "answers": answers,
        "time_taken": 300  # 5 minutes
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/assessment/submit",
            headers=headers,
            json=submit_data
        )
        print(f"Submit Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"Failed to submit quiz: {response.text}")
            return False
        
        result = response.json()
        print(f"✓ Quiz submitted successfully!")
        print(f"  Assessment ID: {result.get('assessment_id')}")
        print(f"  Overall Score: {result.get('overall_score')}%")
        print(f"  Overall Level: {result.get('overall_level')}")
        print(f"  Confidence Updated: {result.get('confidence_updated')}")
        
        if result.get('skill_results'):
            for skill_result in result['skill_results']:
                print(f"\n  Skill: {skill_result['skill_name']}")
                print(f"    Score: {skill_result['percentage']}%")
                print(f"    Level: {skill_result['level']}")
                print(f"    Correct: {skill_result['correct_answers']}/{skill_result['total_questions']}")
        
    except Exception as e:
        print(f"Error submitting quiz: {e}")
        return False
    
    # Step 4: Verify results are stored
    print("\n" + "=" * 60)
    print("STEP 4: Verify Results Storage")
    print("=" * 60)
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/assessment/result/{skill_id}",
            headers=headers
        )
        print(f"Get Result Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"Failed to get result: {response.text}")
            return False
        
        stored_result = response.json()
        print(f"✓ Results retrieved from database!")
        print(f"  Skill: {stored_result.get('skill_name')}")
        print(f"  Score: {stored_result.get('score')}%")
        print(f"  Level: {stored_result.get('level')}")
        print(f"  Confidence: {stored_result.get('confidence')}")
        
    except Exception as e:
        print(f"Error getting result: {e}")
        return False
    
    print("\n" + "=" * 60)
    print("✅ ALL TESTS PASSED!")
    print("=" * 60)
    print("Exam submission and results storage are working correctly!")
    
    return True

if __name__ == "__main__":
    success = test_exam_submission()
    exit(0 if success else 1)
