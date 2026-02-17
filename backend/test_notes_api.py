"""
Test script for User Notes API
"""
import requests
import json

BASE_URL = "http://localhost:5000"

def get_auth_token():
    """Get authentication token by logging in"""
    print("\n=== Getting Auth Token ===")
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={
                "email": "test@example.com",
                "password": "password123"
            }
        )
        if response.status_code == 200:
            data = response.json()
            token = data.get('access_token')
            print(f"✅ Login successful, got token")
            return token
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"❌ Error logging in: {e}")
        return None

def test_create_note(token):
    """Test creating a note"""
    print("\n=== Testing Create Note ===")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(
            f"{BASE_URL}/api/notes",
            headers=headers,
            json={
                "title": "JavaScript Array Methods",
                "content": "Important array methods to remember:\n- map(): transforms each element\n- filter(): selects elements based on condition\n- reduce(): accumulates values\n- forEach(): iterates over elements",
                "code_snippet": "const numbers = [1, 2, 3, 4, 5];\nconst doubled = numbers.map(n => n * 2);\nconsole.log(doubled); // [2, 4, 6, 8, 10]",
                "code_language": "javascript",
                "tags": "javascript, arrays, programming"
            }
        )
        if response.status_code == 201:
            data = response.json()
            print(f"✅ Note created successfully")
            print(f"   ID: {data.get('id')}")
            print(f"   Title: {data.get('title')}")
            return data.get('id')
        else:
            print(f"❌ Failed to create note: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"❌ Error creating note: {e}")
        return None

def test_get_notes(token):
    """Test getting all notes"""
    print("\n=== Testing Get Notes ===")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(
            f"{BASE_URL}/api/notes",
            headers=headers
        )
        if response.status_code == 200:
            data = response.json()
            notes = data.get('notes', [])
            print(f"✅ Got {len(notes)} notes")
            for note in notes:
                print(f"   - {note.get('title')} (ID: {note.get('id')})")
            return notes
        else:
            print(f"❌ Failed to get notes: {response.status_code}")
            print(response.text)
            return []
    except Exception as e:
        print(f"❌ Error getting notes: {e}")
        return []

def test_get_note(token, note_id):
    """Test getting a specific note"""
    print(f"\n=== Testing Get Note {note_id} ===")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(
            f"{BASE_URL}/api/notes/{note_id}",
            headers=headers
        )
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Got note: {data.get('title')}")
            print(f"   Content: {data.get('content')[:50]}...")
            if data.get('code_snippet'):
                print(f"   Has code snippet: Yes ({data.get('code_language')})")
            return data
        else:
            print(f"❌ Failed to get note: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"❌ Error getting note: {e}")
        return None

def test_update_note(token, note_id):
    """Test updating a note"""
    print(f"\n=== Testing Update Note {note_id} ===")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.put(
            f"{BASE_URL}/api/notes/{note_id}",
            headers=headers,
            json={
                "title": "JavaScript Array Methods (Updated)",
                "tags": "javascript, arrays, programming, updated"
            }
        )
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Note updated successfully")
            print(f"   New title: {data.get('title')}")
            print(f"   Tags: {data.get('tags')}")
            return data
        else:
            print(f"❌ Failed to update note: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"❌ Error updating note: {e}")
        return None

def test_search_notes(token, query):
    """Test searching notes"""
    print(f"\n=== Testing Search Notes: '{query}' ===")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(
            f"{BASE_URL}/api/notes/search/{query}",
            headers=headers
        )
        if response.status_code == 200:
            data = response.json()
            notes = data.get('notes', [])
            print(f"✅ Found {len(notes)} notes matching '{query}'")
            for note in notes:
                print(f"   - {note.get('title')}")
            return notes
        else:
            print(f"❌ Failed to search notes: {response.status_code}")
            print(response.text)
            return []
    except Exception as e:
        print(f"❌ Error searching notes: {e}")
        return []

def test_get_tags(token):
    """Test getting all tags"""
    print("\n=== Testing Get All Tags ===")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(
            f"{BASE_URL}/api/notes/tags/all",
            headers=headers
        )
        if response.status_code == 200:
            data = response.json()
            tags = data.get('tags', [])
            print(f"✅ Found {len(tags)} unique tags")
            print(f"   Tags: {', '.join(tags)}")
            return tags
        else:
            print(f"❌ Failed to get tags: {response.status_code}")
            print(response.text)
            return []
    except Exception as e:
        print(f"❌ Error getting tags: {e}")
        return []

def test_delete_note(token, note_id):
    """Test deleting a note"""
    print(f"\n=== Testing Delete Note {note_id} ===")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.delete(
            f"{BASE_URL}/api/notes/{note_id}",
            headers=headers
        )
        if response.status_code == 204:
            print(f"✅ Note {note_id} deleted successfully")
            return True
        else:
            print(f"❌ Failed to delete note: {response.status_code}")
            print(response.text)
            return False
    except Exception as e:
        print(f"❌ Error deleting note: {e}")
        return False

def main():
    print("=" * 60)
    print("User Notes API Test")
    print("=" * 60)
    
    # Get auth token
    token = get_auth_token()
    if not token:
        print("\n❌ Cannot proceed without auth token")
        return
    
    # Test create
    note_id = test_create_note(token)
    if not note_id:
        print("\n❌ Cannot proceed without note ID")
        return
    
    # Test get all
    test_get_notes(token)
    
    # Test get specific
    test_get_note(token, note_id)
    
    # Test update
    test_update_note(token, note_id)
    
    # Test search
    test_search_notes(token, "javascript")
    
    # Test get tags
    test_get_tags(token)
    
    # Test delete
    test_delete_note(token, note_id)
    
    # Verify deletion
    print("\n=== Verifying Deletion ===")
    notes = test_get_notes(token)
    if not any(n.get('id') == note_id for n in notes):
        print("✅ Note successfully removed from database")
    else:
        print("❌ Note still exists in database")
    
    print("\n" + "=" * 60)
    print("All tests completed!")
    print("=" * 60)

if __name__ == "__main__":
    main()
