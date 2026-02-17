import sys
from models.database import get_db
from models.skill_question import SkillQuestion

# Redirect output to file
sys.stdout = open('skill_2_questions.txt', 'w')

db = next(get_db())
questions = db.query(SkillQuestion).filter(SkillQuestion.skill_id == 2).all()

print(f"Found {len(questions)} questions for skill_id=2")

if len(questions) == 0:
    print("No questions found for skill 2!")
    # Check what skills have questions
    from sqlalchemy import func
    from models.skill import Skill
    
    all_questions = db.query(SkillQuestion).all()
    print(f"\nTotal questions in database: {len(all_questions)}")
    
    # Group by skill_id
    skill_counts = db.query(SkillQuestion.skill_id, func.count(SkillQuestion.id)).group_by(SkillQuestion.skill_id).all()
    print("\nQuestions by skill_id:")
    for skill_id, count in skill_counts:
        skill = db.query(Skill).filter(Skill.id == skill_id).first()
        skill_name = skill.name if skill else f"Skill {skill_id}"
        print(f"  Skill {skill_id} ({skill_name}): {count} questions")
else:
    for q in questions[:5]:
        print(f"  - Q{q.id}: {q.question_text[:50]}...")

sys.stdout.close()
