from models.database import get_db
from models.user_skill import UserSkill
from models.skill_assessment import SkillAssessmentSkill, SkillAssessment
from sqlalchemy import desc

def check_scores():
    db = next(get_db())
    user_id = 26
    
    print("=== USER_SKILLS (what API returns) ===")
    user_skills = db.query(UserSkill).filter(
        UserSkill.user_id == user_id,
        UserSkill.score > 0
    ).all()
    
    for us in user_skills:
        print(f"Skill {us.skill_id}: score={us.score}, confidence={us.confidence}")
    
    print("\n=== SKILL_ASSESSMENT_SKILLS (correct scores) ===")
    assessment_skills = db.query(SkillAssessmentSkill).join(SkillAssessment).filter(
        SkillAssessment.user_id == user_id
    ).order_by(desc(SkillAssessmentSkill.created_at)).all()
    
    for asm in assessment_skills:
        print(f"Skill {asm.skill_id}: score={asm.score}, confidence={asm.confidence}")
    
    print("\n=== COMPARISON ===")
    for us in user_skills:
        # Find latest assessment skill for this skill
        latest_asm = db.query(SkillAssessmentSkill).join(SkillAssessment).filter(
            SkillAssessment.user_id == user_id,
            SkillAssessmentSkill.skill_id == us.skill_id
        ).order_by(desc(SkillAssessmentSkill.created_at)).first()
        
        if latest_asm:
            print(f"Skill {us.skill_id}: user_skills.score={us.score} vs assessment_skills.score={latest_asm.score}")

if __name__ == "__main__":
    check_scores()
