from models.database import get_db
from models.user import User
from services.auth_service import AuthService
import bcrypt

def create_test_user():
    db = next(get_db())
    
    # Check if test user exists
    existing = db.query(User).filter(User.email == "test@example.com").first()
    if existing:
        print("Test user already exists")
        return existing
    
    # Create test user
    hashed_password = bcrypt.hashpw("password123".encode('utf-8'), bcrypt.gensalt())
    
    user = User(
        email="test@example.com",
        name="Test User",
        password_hash=hashed_password.decode('utf-8'),
        role="user"
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    print(f"Created test user: ID={user.id}, Email={user.email}")
    return user

if __name__ == "__main__":
    create_test_user()
