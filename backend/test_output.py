import sys
from models.database import get_db, engine
from sqlalchemy import text

# Redirect output to file
sys.stdout = open('test_output.txt', 'w')
sys.stderr = sys.stdout

db = next(get_db())

print("=== CHECKING DATABASE ===")

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
        print(f"  Skill record: {dict(skill._mapping)}")
else:
    print("User not found!")

# Check ALL user_skills with user emails
print("\n--- ALL USER_SKILLS WITH USER EMAILS ---")
result = db.execute(text("""
    SELECT us.*, u.email, s.name as skill_name 
    FROM user_skills us 
    JOIN users u ON us.user_id = u.id 
    JOIN skills s ON us.skill_id = s.id
"""))
all_skills = result.fetchall()
print(f"Total user_skills with joins: {len(all_skills)}")
for skill in all_skills:
    print(f"  User {skill.user_id} ({skill.email}) - {skill.skill_name}: score={skill.score}, confidence={skill.confidence}")

# Check skill_assessment_skills for user 1
print("\n--- SKILL_ASSESSMENT_SKILLS FOR USER 1 ---")
result = db.execute(text("""
    SELECT sas.*, sa.user_id, s.name as skill_name 
    FROM skill_assessment_skills sas
    JOIN skill_assessments sa ON sas.assessment_id = sa.id
    JOIN skills s ON sas.skill_id = s.id
    WHERE sa.user_id = 1
"""))
assessment_skills = result.fetchall()
print(f"Total assessment skills for user 1: {len(assessment_skills)}")
for skill in assessment_skills:
    print(f"  Assessment {skill.assessment_id} - {skill.skill_name}: score={skill.score}, level={skill.level}")

# Check ALL skill_assessment_skills with user emails
print("\n--- ALL SKILL_ASSESSMENT_SKILLS ---")
result = db.execute(text("""
    SELECT sas.*, sa.user_id, u.email, s.name as skill_name 
    FROM skill_assessment_skills sas
    JOIN skill_assessments sa ON sas.assessment_id = sa.id
    JOIN users u ON sa.user_id = u.id
    JOIN skills s ON sas.skill_id = s.id
    ORDER BY sa.user_id, sas.created_at DESC
"""))
all_assessment_skills = result.fetchall()
print(f"Total assessment skills: {len(all_assessment_skills)}")
for skill in all_assessment_skills:
    print(f"  User {skill.user_id} ({skill.email}) - {skill.skill_name}: score={skill.score}, level={skill.level}")

print("\n=== DONE ===")


sys.stdout.close()
