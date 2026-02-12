from models.database import get_db
from models.skill_question import SkillQuestion

def check_questions():
    db = next(get_db())
    questions = db.query(SkillQuestion).filter(SkillQuestion.skill_id == 2).all()
    print(f'Found {len(questions)} questions for skill_id=2')
    for q in questions[:3]:
        print(f'  - Q{q.id}: {q.question_text[:50]}...')

if __name__ == "__main__":
    check_questions()
