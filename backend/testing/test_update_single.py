#!/usr/bin/env python3
"""
Test script for the update-single skill endpoint
"""

import requests
import json

def test_update_single():
    # Test the update-single endpoint
    url = 'http://localhost:5000/skills/update-single'
    headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test_token'  # This might not work, but let's see the error
    }
    data = {
        'skill_id': 1,
        'level': 'intermediate',
        'confidence': 75,
        'score': 50.0
    }

    try:
        response = requests.put(url, headers=headers, json=data)
        print(f'Status: {response.status_code}')
        print(f'Response: {response.text}')
        if response.status_code == 422:
            print('422 Error - checking validation details...')
            try:
                error_detail = response.json()
                print(f'Error details: {json.dumps(error_detail, indent=2)}')
            except:
                print('Could not parse error response as JSON')
    except Exception as e:
        print(f'Error: {e}')

if __name__ == '__main__':
    test_update_single()
