from models.database import get_db, engine
from sqlalchemy import text

db = next(get_db())

# Check if tables exist
tables = ['users', 'skills', 'user_skills', 'skill_assessments', 'skill_assessment_skills']
for table in tables:
    try:
        result = db.execute(text(f"SELECT COUNT(*) FROM {table}"))
        count = result.scalar()
        print(f"Table '{table}': {count} rows")
    except Exception as e:
        print(f"Table '{table}': ERROR - {e}")

# Check specific user
print("\n--- Checking user bunnyoffical068@gmail.com ---")
result = db.execute(text("SELECT id, email FROM users WHERE email = 'bunnyoffical068@gmail.com'"))
user = result.fetchone()
if user:
    print(f"Found user: ID={user.id}, Email={user.email}")
    
    # Check user_skills for this user
    result = db.execute(text(f"SELECT * FROM user_skills WHERE user_id = {user.id}"))
    skills = result.fetchall()
    print(f"User skills count: {len(skills)}")
    for skill in skills:
        print(f"  {skill}")
else:
    print("User not found!")
