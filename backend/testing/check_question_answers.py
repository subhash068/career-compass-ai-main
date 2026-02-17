from models.database import get_db
from models.skill_question import SkillQuestion

def check_question_answers():
    db = next(get_db())
    
    # Check questions for each skill
    skill_ids = [1, 2, 3, 4, 5]  # Docker, Git, Linux, Python, HTML
    
    for skill_id in skill_ids:
        questions = db.query(SkillQuestion).filter(SkillQuestion.skill_id == skill_id).all()
        print(f'\n=== Skill ID {skill_id}: {len(questions)} questions ===')
        
        for q in questions[:3]:  # Show first 3 questions
            print(f'Q{q.id}: {q.question_text[:50]}...')
            print(f'  Options: {q.get_options()}')
            print(f'  Correct Answer: {q.correct_answer}')
            print()

if __name__ == "__main__":
    check_question_answers()
