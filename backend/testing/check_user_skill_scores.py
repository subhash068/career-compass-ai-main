from models.database import get_db
from models.user_skill import UserSkill
from models.user import User
from models.skill import Skill
from models.skill_assessment import SkillAssessmentSkill, SkillAssessment
from sqlalchemy import desc

def check_user_skill_scores():
    db = next(get_db())
    
    # Get all users
    users = db.query(User).all()
    print(f"Found {len(users)} users:\n")
    
    for user in users:
        print(f"User: {user.email} (ID: {user.id})")
        
        # Get all user skills (including score = 0)
        user_skills = db.query(UserSkill).filter(
            UserSkill.user_id == user.id
        ).order_by(desc(UserSkill.assessed_at)).all()
        
        print(f"  UserSkills count: {len(user_skills)}")
        for us in user_skills:
            skill = db.query(Skill).filter(Skill.id == us.skill_id).first()
            skill_name = skill.name if skill else f"Skill {us.skill_id}"
            print(f"    - {skill_name}: {us.score}% (level: {us.level}, assessed: {us.assessed_at})")
        
        # Also check SkillAssessmentSkill table
        assessment_skills = db.query(SkillAssessmentSkill).join(SkillAssessment).filter(
            SkillAssessment.user_id == user.id
        ).all()

        
        print(f"  AssessmentSkills count: {len(assessment_skills)}")
        for asm in assessment_skills:
            skill = db.query(Skill).filter(Skill.id == asm.skill_id).first()
            skill_name = skill.name if skill else f"Skill {asm.skill_id}"
            print(f"    - {skill_name}: {asm.score}% (level: {asm.level}, created: {asm.created_at})")
        print()

if __name__ == "__main__":
    check_user_skill_scores()
