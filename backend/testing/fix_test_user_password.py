from models.database import get_db
from models.user import User
import bcrypt

def fix_test_user_password():
    db = next(get_db())
    
    # Find test user
    user = db.query(User).filter(User.email == "test@example.com").first()
    if not user:
        print("Test user not found, creating new one...")
        # Create with correct password hash method
        password = "password123"
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        user = User(
            email="test@example.com",
            name="Test User",
            role="user"
        )
        user.password_hash = hashed.decode('utf-8')
        
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"Created test user: ID={user.id}, Email={user.email}")
    else:
        print(f"Found test user: ID={user.id}, Email={user.email}")
        # Update password
        password = "password123"
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        user.password_hash = hashed.decode('utf-8')
        db.commit()
        print("Password updated successfully")
    
    # Verify password works
    test_password = "password123"
    if bcrypt.checkpw(test_password.encode('utf-8'), user.password_hash.encode('utf-8')):
        print("✓ Password verification successful!")
    else:
        print("✗ Password verification failed!")
    
    return user

if __name__ == "__main__":
    fix_test_user_password()
