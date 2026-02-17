from models.database import get_db
from models.skill_assessment import UserAnswer, SkillAssessment
from models.user import User
from sqlalchemy import desc

def check_user_answers():
    db = next(get_db())
    
    # Get test user
    user = db.query(User).filter(User.email == 'test@example.com').first()
    if not user:
        print("Test user not found")
        return
    
    print(f"User ID: {user.id}")
    
    # Get recent assessments
    assessments = db.query(SkillAssessment).filter(
        SkillAssessment.user_id == user.id
    ).order_by(desc(SkillAssessment.created_at)).limit(5).all()
    
    for assessment in assessments:
        print(f"\n=== Assessment {assessment.id} (Status: {assessment.status}) ===")
        
        # Get user answers for this assessment
        answers = db.query(UserAnswer).filter(
            UserAnswer.assessment_id == assessment.id
        ).all()
        
        print(f"Total answers: {len(answers)}")
        
        correct_count = sum(1 for a in answers if a.is_correct == 'true')
        print(f"Correct answers: {correct_count}")
        
        for answer in answers[:5]:  # Show first 5
            print(f"  Q{answer.question_id}: User='{answer.user_answer}' | Correct={answer.is_correct}")

if __name__ == "__main__":
    check_user_answers()
