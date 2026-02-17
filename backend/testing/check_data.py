from models.database import SessionLocal
from models.user_skill import UserSkill
from models.skill_assessment import SkillAssessment, SkillAssessmentSkill

db = SessionLocal()

print('=== USER SKILLS ===')
user_skills = db.query(UserSkill).filter_by(user_id=1).all()
print(f'Found {len(user_skills)} user skills for user 1')
for us in user_skills:
    skill_name = us.skill.name if us.skill else f'Skill {us.skill_id}'
    print(f'  - {skill_name}: score={us.score}')

print('\n=== ASSESSMENTS ===')
assessments = db.query(SkillAssessment).filter_by(user_id=1).all()
print(f'Found {len(assessments)} assessments for user 1')
for asm in assessments:
    print(f'  - Assessment {asm.id}: created_at={asm.created_at}')
    skills = db.query(SkillAssessmentSkill).filter_by(assessment_id=asm.id).all()
    for s in skills:
        skill_name = s.skill.name if s.skill else f'Skill {s.skill_id}'
        print(f'    - {skill_name}: score={s.score}, level={s.level}')

db.close()
