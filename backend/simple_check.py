from models.database import get_db
from models.user_skill import UserSkill
from models.user import User

db = next(get_db())

# Get user
user = db.query(User).filter(User.email == 'bunnyoffical068@gmail.com').first()
if user:
    print(f"User ID: {user.id}")
    skills = db.query(UserSkill).filter(UserSkill.user_id == user.id).all()
    print(f"Found {len(skills)} skills")
    for s in skills:
        print(f"  Skill {s.skill_id}: {s.score}%")
else:
    print("User not found")
