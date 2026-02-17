from models.database import get_db
from models.skill import Skill
from models.skill_question import SkillQuestion
import json

def add_sample_questions():
    db = next(get_db())
    
    # Get all skills
    skills = db.query(Skill).all()
    print(f"Found {len(skills)} skills")
    
    # Sample questions for different skill types
    sample_questions = {
        # Python Programming (assuming skill_id 1 or 2)
        "python": [
            {
                "question_text": "What is the output of print(2 ** 3)?",
                "options": ["6", "8", "9", "16"],
                "correct_answer": "8",
                "difficulty": "easy"
            },
            {
                "question_text": "Which of the following is used to define a function in Python?",
                "options": ["func", "def", "function", "define"],
                "correct_answer": "def",
                "difficulty": "easy"
            },
            {
                "question_text": "What is the correct way to create a list in Python?",
                "options": ["(1, 2, 3)", "[1, 2, 3]", "{1, 2, 3}", "<1, 2, 3>"],
                "correct_answer": "[1, 2, 3]",
                "difficulty": "easy"
            },
            {
                "question_text": "What does the 'len()' function do?",
                "options": ["Returns the length of an object", "Converts to lowercase", "Creates a list", "Sorts an object"],
                "correct_answer": "Returns the length of an object",
                "difficulty": "easy"
            },
            {
                "question_text": "What is a Python dictionary?",
                "options": ["An ordered collection", "A key-value pair collection", "A sequence of characters", "A mathematical function"],
                "correct_answer": "A key-value pair collection",
                "difficulty": "medium"
            },
            {
                "question_text": "Which method is used to add an element to a list?",
                "options": ["add()", "insert()", "append()", "push()"],
                "correct_answer": "append()",
                "difficulty": "easy"
            },
            {
                "question_text": "What is the output of type(5)?",
                "options": ["<class 'int'>", "<class 'float'>", "<class 'str'>", "<class 'number'>"],
                "correct_answer": "<class 'int'>",
                "difficulty": "easy"
            },
            {
                "question_text": "What does 'if __name__ == \"__main__\":' do?",
                "options": ["Defines a class", "Checks if the script is run directly", "Imports a module", "Creates a loop"],
                "correct_answer": "Checks if the script is run directly",
                "difficulty": "medium"
            },
            {
                "question_text": "Which exception is raised when dividing by zero?",
                "options": ["ValueError", "TypeError", "ZeroDivisionError", "ArithmeticError"],
                "correct_answer": "ZeroDivisionError",
                "difficulty": "easy"
            },
            {
                "question_text": "What is a lambda function in Python?",
                "options": ["A named function", "An anonymous function", "A recursive function", "A built-in function"],
                "correct_answer": "An anonymous function",
                "difficulty": "medium"
            },
            {
                "question_text": "What does the 'with' statement do?",
                "options": ["Defines a class", "Handles context management", "Creates a loop", "Imports modules"],
                "correct_answer": "Handles context management",
                "difficulty": "medium"
            },
            {
                "question_text": "What is list comprehension?",
                "options": ["A way to create lists concisely", "A method to sort lists", "A function to reverse lists", "A way to delete lists"],
                "correct_answer": "A way to create lists concisely",
                "difficulty": "medium"
            }
        ],
        # JavaScript
        "javascript": [
            {
                "question_text": "What is the correct way to declare a variable in JavaScript?",
                "options": ["var myVar", "variable myVar", "v myVar", "declare myVar"],
                "correct_answer": "var myVar",
                "difficulty": "easy"
            },
            {
                "question_text": "What does '===' operator do in JavaScript?",
                "options": ["Assigns value", "Compares value and type", "Compares only value", "Checks if undefined"],
                "correct_answer": "Compares value and type",
                "difficulty": "easy"
            },
            {
                "question_text": "What is the output of typeof null?",
                "options": ["'null'", "'undefined'", "'object'", "'number'"],
                "correct_answer": "'object'",
                "difficulty": "medium"
            },
            {
                "question_text": "Which method converts a JSON string to an object?",
                "options": ["JSON.stringify()", "JSON.parse()", "JSON.toObject()", "JSON.convert()"],
                "correct_answer": "JSON.parse()",
                "difficulty": "easy"
            },
            {
                "question_text": "What is a closure in JavaScript?",
                "options": ["A loop structure", "A function with access to outer scope", "A data type", "An event handler"],
                "correct_answer": "A function with access to outer scope",
                "difficulty": "hard"
            },
            {
                "question_text": "What does 'this' keyword refer to?",
                "options": ["Global object always", "Current object context", "Parent function", "Window object only"],
                "correct_answer": "Current object context",
                "difficulty": "medium"
            },
            {
                "question_text": "Which is NOT a JavaScript data type?",
                "options": ["Boolean", "Integer", "String", "Undefined"],
                "correct_answer": "Integer",
                "difficulty": "easy"
            },
            {
                "question_text": "What is the purpose of 'use strict'?",
                "options": ["Enables strict mode", "Imports modules", "Defines constants", "Creates classes"],
                "correct_answer": "Enables strict mode",
                "difficulty": "medium"
            },
            {
                "question_text": "What is an IIFE?",
                "options": ["Immediately Invoked Function Expression", "Internal Interface Function Execution", "Inline Integrated Function Expression", "Instantiated Internal Function Expression"],
                "correct_answer": "Immediately Invoked Function Expression",
                "difficulty": "hard"
            },
            {
                "question_text": "Which method adds an element to the end of an array?",
                "options": ["push()", "pop()", "shift()", "unshift()"],
                "correct_answer": "push()",
                "difficulty": "easy"
            }
        ],
        # Generic programming questions
        "generic": [
            {
                "question_text": "What is an algorithm?",
                "options": ["A programming language", "A step-by-step procedure", "A computer hardware", "A type of data"],
                "correct_answer": "A step-by-step procedure",
                "difficulty": "easy"
            },
            {
                "question_text": "What does API stand for?",
                "options": ["Application Programming Interface", "Advanced Programming Instruction", "Application Process Integration", "Automated Program Interface"],
                "correct_answer": "Application Programming Interface",
                "difficulty": "easy"
            },
            {
                "question_text": "What is a database?",
                "options": ["A programming language", "An organized collection of data", "A web server", "A type of file"],
                "correct_answer": "An organized collection of data",
                "difficulty": "easy"
            },
            {
                "question_text": "What is the purpose of version control?",
                "options": ["To compile code", "To track changes in code", "To run tests", "To deploy applications"],
                "correct_answer": "To track changes in code",
                "difficulty": "easy"
            },
            {
                "question_text": "What is an IDE?",
                "options": ["Integrated Development Environment", "Internet Data Exchange", "Internal Database Engine", "Interactive Design Element"],
                "correct_answer": "Integrated Development Environment",
                "difficulty": "easy"
            },
            {
                "question_text": "What does HTTP stand for?",
                "options": ["HyperText Transfer Protocol", "HighText Transfer Process", "HyperText Transmission Protocol", "HostText Transfer Protocol"],
                "correct_answer": "HyperText Transfer Protocol",
                "difficulty": "easy"
            },
            {
                "question_text": "What is a function?",
                "options": ["A variable type", "A reusable block of code", "A data structure", "A loop type"],
                "correct_answer": "A reusable block of code",
                "difficulty": "easy"
            },
            {
                "question_text": "What is debugging?",
                "options": ["Writing code", "Finding and fixing errors", "Testing code", "Deploying code"],
                "correct_answer": "Finding and fixing errors",
                "difficulty": "easy"
            },
            {
                "question_text": "What is a framework?",
                "options": ["A programming language", "A platform for developing software", "A database type", "A file format"],
                "correct_answer": "A platform for developing software",
                "difficulty": "medium"
            },
            {
                "question_text": "What is Git?",
                "options": ["A programming language", "A version control system", "A database", "A web framework"],
                "correct_answer": "A version control system",
                "difficulty": "easy"
            }
        ]
    }
    
    # Add questions for each skill
    for skill in skills:
        # Check if skill already has questions
        existing = db.query(SkillQuestion).filter(SkillQuestion.skill_id == skill.id).count()
        if existing >= 10:
            print(f"Skill {skill.name} (ID: {skill.id}) already has {existing} questions, skipping")
            continue
        
        # Determine which question set to use
        skill_name_lower = skill.name.lower()
        if "python" in skill_name_lower:
            questions_data = sample_questions["python"]
        elif "javascript" in skill_name_lower or "js" in skill_name_lower:
            questions_data = sample_questions["javascript"]
        else:
            questions_data = sample_questions["generic"]
        
        # Add questions
        added = 0
        for q_data in questions_data:
            # Check if question already exists
            existing_q = db.query(SkillQuestion).filter(
                SkillQuestion.skill_id == skill.id,
                SkillQuestion.question_text == q_data["question_text"]
            ).first()
            
            if existing_q:
                continue
            
            question = SkillQuestion(
                skill_id=skill.id,
                question_text=q_data["question_text"],
                options=json.dumps(q_data["options"]),
                correct_answer=q_data["correct_answer"],
                difficulty=q_data["difficulty"]
            )
            db.add(question)
            added += 1
        
        db.commit()
        print(f"Added {added} questions for skill {skill.name} (ID: {skill.id})")
    
    print("\nSample questions added successfully!")

if __name__ == "__main__":
    add_sample_questions()
