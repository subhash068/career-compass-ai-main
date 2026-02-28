"""
Test script to verify the explanation field fix
"""
import sys
import os

# Add the backend directory to the path (go up one level from testing folder)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    # Test 1: Import the model
    from models.skill_question import SkillQuestion
    print("✓ SkillQuestion model imported successfully")
    
    # Test 2: Check if explanation column exists
    if hasattr(SkillQuestion, 'explanation'):
        print("✓ 'explanation' attribute exists on SkillQuestion model")
    else:
        print("✗ 'explanation' attribute NOT found on SkillQuestion model")
        sys.exit(1)
    
    # Test 3: Check to_dict method includes explanation
    test_question = SkillQuestion()
    test_question.id = 1
    test_question.skill_id = 1
    test_question.question_text = "Test question"
    test_question.options = '["Option 1", "Option 2"]'
    test_question.correct_answer = "Option 1"
    test_question.difficulty = "medium"
    test_question.explanation = "This is a test explanation"
    
    result = test_question.to_dict()
    if 'explanation' in result:
        print("✓ 'explanation' is included in to_dict() output")
        print(f"  Explanation value: {result['explanation']}")
    else:
        print("✗ 'explanation' NOT found in to_dict() output")
        sys.exit(1)
    
    print("\n✅ All tests passed! The explanation field fix is working correctly.")
    
except Exception as e:
    print(f"\n✗ Error during testing: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
