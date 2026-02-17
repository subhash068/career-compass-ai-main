#!/usr/bin/env python3
"""
Security Features Test Script
Tests the implemented security features for Career Compass AI
"""

import sys
import os
import hashlib
from unittest.mock import Mock, patch

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import all models to ensure SQLAlchemy mappers are configured
from models.user_skill import UserSkill
from models.skill import Skill
from models.job_role import JobRole
from models.role_skill_requirement import RoleSkillRequirement
from models.learning_path import LearningPath
from models.learning_path_step import LearningPathStep
from models.learning_resource import LearningResource
from models.chat_session import ChatSession
from models.chat_message import ChatMessage
from models.skill_assessment import SkillAssessment

# Mock database connections for testing
class MockRedis:
    def __init__(self):
        self.data = {}

    def setex(self, key, time, value):
        self.data[key] = value
        return True

    def get(self, key):
        return self.data.get(key)

    def delete(self, key):
        return self.data.pop(key, None)

    def ping(self):
        return True

class MockMongoCollection:
    def __init__(self):
        self.data = []

    def insert_one(self, doc):
        doc['_id'] = len(self.data) + 1
        self.data.append(doc)
        return Mock(inserted_id=doc['_id'])

    def find_one(self, query):
        for item in self.data:
            if all(item.get(k) == v for k, v in query.items()):
                return item
        return None

class MockMongoDB:
    def __init__(self):
        self.users = MockMongoCollection()

    def get_collection(self, name):
        if name == 'users':
            return self.users
        return MockMongoCollection()

# Mock the database connections
mock_redis = MockRedis()
mock_db = MockMongoDB()

# Mock SQLAlchemy session for testing
class MockSQLAlchemySession:
    def __init__(self):
        self.data = {}
        self.committed = False

    def add(self, obj):
        # Simulate adding an object with auto-increment ID
        if not hasattr(obj, 'id') or obj.id is None:
            obj.id = len(self.data) + 1
        self.data[obj.id] = obj

    def commit(self):
        self.committed = True

    def refresh(self, obj):
        pass

    def query(self, model):
        return MockQuery(model, self.data)

    def close(self):
        pass

class MockQuery:
    def __init__(self, model, data):
        self.model = model
        self.data = data

    def filter(self, *args):
        # Simple mock filtering - in real tests you'd implement proper filtering
        return self

    def first(self):
        # Return first item or None
        return next(iter(self.data.values()), None) if self.data else None

    def all(self):
        return list(self.data.values())

    def order_by(self, *args):
        return self

mock_db_session = MockSQLAlchemySession()

def test_rbac_decorator():
    """Test the role_required decorator"""
    print("🧪 Testing RBAC Decorator...")

    from decorators import role_required
    from flask import Flask, jsonify
    from flask_jwt_extended import JWTManager, create_access_token

    app = Flask(__name__)
    app.config['JWT_SECRET_KEY'] = 'test-secret'
    jwt = JWTManager(app)

    @app.route('/admin-test')
    @role_required("ADMIN")
    def admin_only():
        return jsonify({'message': 'Admin access granted'})

    with app.test_client() as client:
        with app.app_context():
            # Test with ADMIN role
            admin_token = create_access_token(identity='user1', additional_claims={'role': 'ADMIN'})
            response = client.get('/admin-test', headers={'Authorization': f'Bearer {admin_token}'})
            assert response.status_code == 200
            print("  ✅ ADMIN role access granted")

            # Test with USER role
            user_token = create_access_token(identity='user2', additional_claims={'role': 'user'})
            response = client.get('/admin-test', headers={'Authorization': f'Bearer {user_token}'})
            assert response.status_code == 403
            print("  ✅ USER role access denied")

    print("  ✅ RBAC Decorator test passed")

def test_token_hashing():
    """Test token hashing functionality"""
    print("🧪 Testing Token Hashing...")

    from services.auth_service import AuthService

    # Test hash generation
    token = "test_refresh_token_123"
    hashed = AuthService._hash_refresh_token(token)

    assert hashed == hashlib.sha256(token.encode()).hexdigest()
    assert len(hashed) == 64  # SHA256 produces 64 character hex string

    print("  ✅ Token hashing works correctly")

def test_input_sanitization():
    """Test input sanitization"""
    print("🧪 Testing Input Sanitization...")

    from services.auth_service import AuthService

    # Test XSS prevention - bleach removes tags but keeps text content by default
    malicious_input = '<script>alert("XSS")</script>Hello World'
    sanitized = AuthService.sanitize_input(malicious_input)

    assert '<script>' not in sanitized  # Tags should be removed
    assert '</script>' not in sanitized  # Tags should be removed
    assert 'Hello World' in sanitized  # Safe content should remain
    # Note: bleach keeps text content inside tags, so 'alert("XSS")' may remain

    # Test another XSS attempt
    malicious_input2 = '<img src=x onerror=alert(1)>'
    sanitized2 = AuthService.sanitize_input(malicious_input2)

    assert '<img' not in sanitized2  # Tags should be removed
    assert 'onerror' not in sanitized2  # Dangerous attributes should be removed
    assert 'src=x' not in sanitized2  # Dangerous attributes should be removed

    # Test safe input remains unchanged
    safe_input = 'Hello World 123'
    sanitized_safe = AuthService.sanitize_input(safe_input)
    assert sanitized_safe == safe_input

    print("  ✅ Input sanitization prevents XSS")

def test_user_model():
    """Test User model with roles"""
    print("🧪 Testing User Model...")

    from models.user import User

    # Mock database for testing
    with patch('models.database.get_db', return_value=mock_db_session):
        # Test user creation with ADMIN role
        user = User.create(mock_db_session, 'admin@test.com', 'Admin User', 'password123', 'ADMIN', 'Developer')

        assert user.email == 'admin@test.com'
        assert user.role == 'ADMIN'
        assert user.name == 'Admin User'

        # Test user creation with default USER role
        user2 = User.create(mock_db_session, 'user@test.com', 'Regular User', 'password123')

        assert user2.role == 'user'  # default role

        print("  ✅ User model handles roles correctly")

def test_auth_service():
    """Test authentication service"""
    print("🧪 Testing Auth Service...")

    with patch('models.database.get_db', return_value=mock_db), \
         patch('services.auth_service.AuthService._get_redis_client', return_value=mock_redis):

        from services.auth_service import AuthService

        # Test user registration
        mock_db_session = Mock()
        mock_db_session.query.return_value.filter.return_value.first.return_value = None  # No existing user
        result = AuthService.register_user(mock_db_session, 'user@test.com', 'Test User', 'Test1234', 'user')

        assert 'user' in result
        assert 'access_token' in result
        assert 'refresh_token' in result
        assert result['user']['role'] == 'user'

        # Verify refresh token is stored
        user_id = result['user']['id']
        stored_hash = mock_redis.get(f"refresh_token:{user_id}")
        assert stored_hash is not None

        print("  ✅ User registration and token storage works")

        # Test login
        login_result = AuthService.authenticate_user('test@example.com', 'password123')

        assert 'user' in login_result
        assert 'access_token' in login_result
        assert 'refresh_token' in login_result

        print("  ✅ User authentication works")

        # Test token refresh
        old_refresh_token = login_result['refresh_token']
        refresh_result = AuthService.refresh_access_token(user_id, old_refresh_token)

        assert 'access_token' in refresh_result
        assert 'refresh_token' in refresh_result

        # Verify old token is invalidated
        old_hash = mock_redis.get(f"refresh_token:{user_id}")
        new_hash = AuthService._hash_refresh_token(refresh_result['refresh_token'])
        assert old_hash == new_hash  # Should be updated

        print("  ✅ Token refresh and rotation works")

def main():
    """Run all security tests"""
    print("🔒 Security Features Test Suite")
    print("=" * 50)

    try:
        test_rbac_decorator()
        test_token_hashing()
        test_input_sanitization()
        test_user_model()
        test_auth_service()

        print("=" * 50)
        print("🎉 All security tests passed!")
        print("\n✅ Security features verified:")
        print("  • Role-Based Access Control")
        print("  • Refresh Token Rotation")
        print("  • Secure Token Storage")
        print("  • Input Sanitization")
        print("  • JWT Token Management")

    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return 1

    return 0

if __name__ == '__main__':
    sys.exit(main())
