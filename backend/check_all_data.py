from models.database import get_db
from models.user_skill import UserSkill
from models.user import User
from models.skill import Skill
from models.skill_assessment import SkillAssessmentSkill, SkillAssessment

db = next(get_db())

print("=== ALL USERS ===")
users = db.query(User).all()
for u in users:
    print(f"ID: {u.id}, Email: {u.email}")

print("\n=== ALL USER_SKILLS ===")
user_skills = db.query(UserSkill).all()
print(f"Total: {len(user_skills)}")
for us in user_skills:
    skill = db.query(Skill).filter(Skill.id == us.skill_id).first()
    skill_name = skill.name if skill else f"Skill {us.skill_id}"
    print(f"  User {us.user_id} - {skill_name}: score={us.score}, confidence={us.confidence}")

print("\n=== ALL SKILL_ASSESSMENT_SKILLS ===")
assessment_skills = db.query(SkillAssessmentSkill).all()
print(f"Total: {len(assessment_skills)}")
for asm in assessment_skills:
    skill = db.query(Skill).filter(Skill.id == asm.skill_id).first()
    skill_name = skill.name if skill else f"Skill {asm.skill_id}"
    print(f"  Assessment {asm.assessment_id} - {skill_name}: score={asm.score}")
