#!/usr/bin/env python3
"""
Script to create sample questions for skills
"""
import sys
import os
from sqlalchemy.orm import Session

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from models.database import get_db
from models.skill import Skill
from models.skill_question import SkillQuestion

def create_sample_questions(db: Session):
    """Create sample questions for each skill"""

    # Get all skills
    skills = db.query(Skill).all()

    # Sample questions data organized by skill name
    questions_data = {
        "HTML": [
            {
                "question": "What does HTML stand for?",
                "options": ["Hyper Text Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlink and Text Markup Language"],
                "correct_answer": "Hyper Text Markup Language",
                "difficulty": "easy"
            },
            {
                "question": "Which HTML tag is used to create a hyperlink?",
                "options": ["<link>", "<a>", "<href>", "<url>"],
                "correct_answer": "<a>",
                "difficulty": "easy"
            },
            {
                "question": "What is the correct HTML element for the largest heading?",
                "options": ["<h1>", "<heading>", "<h6>", "<head>"],
                "correct_answer": "<h1>",
                "difficulty": "easy"
            },
            {
                "question": "Which attribute is used to provide an alternative text for an image?",
                "options": ["alt", "src", "title", "href"],
                "correct_answer": "alt",
                "difficulty": "medium"
            },
            {
                "question": "What is the purpose of the <meta> tag in HTML?",
                "options": ["To create metadata about the HTML document", "To create a navigation menu", "To embed CSS styles", "To include JavaScript"],
                "correct_answer": "To create metadata about the HTML document",
                "difficulty": "medium"
            },
            {
                "question": "Which HTML5 semantic element is used for the main content of a document?",
                "options": ["<main>", "<content>", "<article>", "<section>"],
                "correct_answer": "<main>",
                "difficulty": "medium"
            },
            {
                "question": "What does the 'viewport' meta tag do in responsive web design?",
                "options": ["Controls the page's viewport dimensions", "Sets the page background color", "Defines the page title", "Links external stylesheets"],
                "correct_answer": "Controls the page's viewport dimensions",
                "difficulty": "hard"
            },
            {
                "question": "Which HTML element is used to define a table row?",
                "options": ["<tr>", "<td>", "<th>", "<table>"],
                "correct_answer": "<tr>",
                "difficulty": "easy"
            },
            {
                "question": "What is the correct way to create a form in HTML?",
                "options": ["<form>", "<input>", "<fieldset>", "<label>"],
                "correct_answer": "<form>",
                "difficulty": "easy"
            },
            {
                "question": "Which attribute specifies the relationship between the current document and the linked document?",
                "options": ["rel", "href", "target", "type"],
                "correct_answer": "rel",
                "difficulty": "hard"
            }
        ],
        "CSS": [
            {
                "question": "What does CSS stand for?",
                "options": ["Cascading Style Sheets", "Creative Style Sheets", "Computer Style Sheets", "Colorful Style Sheets"],
                "correct_answer": "Cascading Style Sheets",
                "difficulty": "easy"
            },
            {
                "question": "Which CSS property is used to change the text color?",
                "options": ["color", "text-color", "font-color", "foreground-color"],
                "correct_answer": "color",
                "difficulty": "easy"
            },
            {
                "question": "How do you select an element with id 'demo' in CSS?",
                "options": ["#demo", ".demo", "demo", "*demo"],
                "correct_answer": "#demo",
                "difficulty": "easy"
            },
            {
                "question": "Which CSS property controls the spacing between elements?",
                "options": ["margin", "padding", "border", "spacing"],
                "correct_answer": "margin",
                "difficulty": "medium"
            },
            {
                "question": "What is the correct CSS syntax for making all p elements bold?",
                "options": ["p {font-weight: bold;}", "p {text-size: bold;}", "p {font: bold;}", "p {bold: true;}"],
                "correct_answer": "p {font-weight: bold;}",
                "difficulty": "easy"
            },
            {
                "question": "Which CSS property is used to control the layout of elements?",
                "options": ["display", "position", "float", "All of the above"],
                "correct_answer": "All of the above",
                "difficulty": "medium"
            },
            {
                "question": "What does the 'box-sizing' property do?",
                "options": ["Controls how the total width and height of an element is calculated", "Sets the size of the border", "Defines the padding size", "Controls the margin size"],
                "correct_answer": "Controls how the total width and height of an element is calculated",
                "difficulty": "hard"
            },
            {
                "question": "Which CSS selector has the highest specificity?",
                "options": ["ID selector", "Class selector", "Element selector", "Universal selector"],
                "correct_answer": "ID selector",
                "difficulty": "medium"
            },
            {
                "question": "What is the purpose of CSS Grid?",
                "options": ["To create two-dimensional layouts", "To style text", "To create animations", "To handle responsive images"],
                "correct_answer": "To create two-dimensional layouts",
                "difficulty": "medium"
            },
            {
                "question": "Which CSS property is used for creating rounded corners?",
                "options": ["border-radius", "corner-radius", "rounded-corners", "border-corner"],
                "correct_answer": "border-radius",
                "difficulty": "easy"
            }
        ],
        "JavaScript": [
            {
                "question": "What is JavaScript primarily used for?",
                "options": ["Styling web pages", "Adding interactivity to web pages", "Creating database schemas", "Designing user interfaces"],
                "correct_answer": "Adding interactivity to web pages",
                "difficulty": "easy"
            },
            {
                "question": "Which keyword is used to declare a variable in JavaScript?",
                "options": ["var", "let", "const", "All of the above"],
                "correct_answer": "All of the above",
                "difficulty": "easy"
            },
            {
                "question": "What does the '===' operator do in JavaScript?",
                "options": ["Compares values and types", "Assigns a value", "Compares only values", "Creates a new object"],
                "correct_answer": "Compares values and types",
                "difficulty": "medium"
            },
            {
                "question": "Which method is used to add an element to the end of an array?",
                "options": ["push()", "pop()", "shift()", "unshift()"],
                "correct_answer": "push()",
                "difficulty": "easy"
            },
            {
                "question": "What is a closure in JavaScript?",
                "options": ["A function that has access to variables in its outer scope", "A way to close browser windows", "A method to end loops", "A type of data structure"],
                "correct_answer": "A function that has access to variables in its outer scope",
                "difficulty": "hard"
            },
            {
                "question": "Which statement is used to handle errors in JavaScript?",
                "options": ["try...catch", "if...else", "for...in", "switch...case"],
                "correct_answer": "try...catch",
                "difficulty": "medium"
            },
            {
                "question": "What does the 'this' keyword refer to in JavaScript?",
                "options": ["The current object", "The global object", "The parent function", "Depends on the context"],
                "correct_answer": "Depends on the context",
                "difficulty": "hard"
            },
            {
                "question": "Which method is used to convert a string to an integer?",
                "options": ["parseInt()", "toString()", "Number()", "parseFloat()"],
                "correct_answer": "parseInt()",
                "difficulty": "easy"
            },
            {
                "question": "What is the purpose of the 'async' keyword?",
                "options": ["To make a function asynchronous", "To create loops", "To define classes", "To handle events"],
                "correct_answer": "To make a function asynchronous",
                "difficulty": "medium"
            },
            {
                "question": "Which operator is used for optional chaining?",
                "options": ["?.", "??", "&&", "||"],
                "correct_answer": "?.",
                "difficulty": "medium"
            }
        ],
        "React": [
            {
                "question": "What is React?",
                "options": ["A JavaScript library for building user interfaces", "A database management system", "A CSS framework", "A backend framework"],
                "correct_answer": "A JavaScript library for building user interfaces",
                "difficulty": "easy"
            },
            {
                "question": "What is JSX?",
                "options": ["A syntax extension for JavaScript", "A CSS preprocessor", "A database query language", "A testing framework"],
                "correct_answer": "A syntax extension for JavaScript",
                "difficulty": "easy"
            },
            {
                "question": "What is the purpose of state in React?",
                "options": ["To store data that can change over time", "To define component styles", "To handle routing", "To manage API calls"],
                "correct_answer": "To store data that can change over time",
                "difficulty": "medium"
            },
            {
                "question": "Which hook is used to manage state in functional components?",
                "options": ["useState", "useEffect", "useContext", "useReducer"],
                "correct_answer": "useState",
                "difficulty": "easy"
            },
            {
                "question": "What is the virtual DOM in React?",
                "options": ["A lightweight copy of the actual DOM", "A database for React components", "A styling system", "A routing library"],
                "correct_answer": "A lightweight copy of the actual DOM",
                "difficulty": "medium"
            },
            {
                "question": "Which lifecycle method is called after a component is rendered?",
                "options": ["componentDidMount", "componentWillMount", "componentDidUpdate", "render"],
                "correct_answer": "componentDidMount",
                "difficulty": "medium"
            },
            {
                "question": "What is the purpose of keys in React lists?",
                "options": ["To help React identify which items have changed", "To style list items", "To handle events", "To manage state"],
                "correct_answer": "To help React identify which items have changed",
                "difficulty": "hard"
            },
            {
                "question": "Which hook is used for side effects in React?",
                "options": ["useEffect", "useState", "useContext", "useMemo"],
                "correct_answer": "useEffect",
                "difficulty": "easy"
            },
            {
                "question": "What is prop drilling in React?",
                "options": ["Passing props through multiple component levels", "Creating holes in components", "Managing component state", "Handling component errors"],
                "correct_answer": "Passing props through multiple component levels",
                "difficulty": "hard"
            },
            {
                "question": "Which method is used to update state in class components?",
                "options": ["setState", "updateState", "changeState", "modifyState"],
                "correct_answer": "setState",
                "difficulty": "easy"
            }
        ],
        "Python": [
            {
                "question": "What is Python?",
                "options": ["A high-level programming language", "A database system", "A web browser", "An operating system"],
                "correct_answer": "A high-level programming language",
                "difficulty": "easy"
            },
            {
                "question": "Which keyword is used to define a function in Python?",
                "options": ["def", "function", "func", "define"],
                "correct_answer": "def",
                "difficulty": "easy"
            },
            {
                "question": "What is the correct way to create a list in Python?",
                "options": ["[]", "{}", "()", "<>"],
                "correct_answer": "[]",
                "difficulty": "easy"
            },
            {
                "question": "Which data type is mutable in Python?",
                "options": ["List", "Tuple", "String", "Integer"],
                "correct_answer": "List",
                "difficulty": "medium"
            },
            {
                "question": "What does the 'len()' function do?",
                "options": ["Returns the length of an object", "Creates a new list", "Sorts a list", "Reverses a string"],
                "correct_answer": "Returns the length of an object",
                "difficulty": "easy"
            },
            {
                "question": "Which statement is used for conditional execution?",
                "options": ["if", "for", "while", "def"],
                "correct_answer": "if",
                "difficulty": "easy"
            },
            {
                "question": "What is a lambda function in Python?",
                "options": ["An anonymous function", "A named function", "A class method", "A module function"],
                "correct_answer": "An anonymous function",
                "difficulty": "medium"
            },
            {
                "question": "Which method is used to add an item to a list?",
                "options": ["append()", "add()", "insert()", "extend()"],
                "correct_answer": "append()",
                "difficulty": "easy"
            },
            {
                "question": "What is the purpose of '__init__' in Python classes?",
                "options": ["To initialize object attributes", "To create class methods", "To define class properties", "To inherit from parent classes"],
                "correct_answer": "To initialize object attributes",
                "difficulty": "medium"
            },
            {
                "question": "Which library is commonly used for data analysis in Python?",
                "options": ["pandas", "numpy", "matplotlib", "All of the above"],
                "correct_answer": "All of the above",
                "difficulty": "medium"
            }
        ],
        "Databases": [
            {
                "question": "What does SQL stand for?",
                "options": ["Structured Query Language", "Simple Query Language", "Standard Query Language", "System Query Language"],
                "correct_answer": "Structured Query Language",
                "difficulty": "easy"
            },
            {
                "question": "Which SQL command is used to retrieve data from a database?",
                "options": ["SELECT", "INSERT", "UPDATE", "DELETE"],
                "correct_answer": "SELECT",
                "difficulty": "easy"
            },
            {
                "question": "What is a primary key in a database?",
                "options": ["A unique identifier for each record", "A foreign key reference", "An index for faster queries", "A data type constraint"],
                "correct_answer": "A unique identifier for each record",
                "difficulty": "medium"
            },
            {
                "question": "Which SQL clause is used to filter records?",
                "options": ["WHERE", "FROM", "SELECT", "ORDER BY"],
                "correct_answer": "WHERE",
                "difficulty": "easy"
            },
            {
                "question": "What is normalization in database design?",
                "options": ["Organizing data to reduce redundancy", "Creating backup copies", "Encrypting data", "Compressing data"],
                "correct_answer": "Organizing data to reduce redundancy",
                "difficulty": "hard"
            },
            {
                "question": "Which SQL command is used to modify existing records?",
                "options": ["UPDATE", "MODIFY", "CHANGE", "ALTER"],
                "correct_answer": "UPDATE",
                "difficulty": "easy"
            },
            {
                "question": "What is a foreign key?",
                "options": ["A field that references a primary key in another table", "A unique identifier", "An index field", "A data type"],
                "correct_answer": "A field that references a primary key in another table",
                "difficulty": "medium"
            },
            {
                "question": "Which SQL function is used to count records?",
                "options": ["COUNT()", "SUM()", "AVG()", "MAX()"],
                "correct_answer": "COUNT()",
                "difficulty": "easy"
            },
            {
                "question": "What is a JOIN in SQL?",
                "options": ["Combining rows from two or more tables", "Creating new tables", "Deleting records", "Updating multiple records"],
                "correct_answer": "Combining rows from two or more tables",
                "difficulty": "medium"
            },
            {
                "question": "Which SQL command is used to create a new table?",
                "options": ["CREATE TABLE", "NEW TABLE", "MAKE TABLE", "BUILD TABLE"],
                "correct_answer": "CREATE TABLE",
                "difficulty": "easy"
            }
        ]
    }

    # Create questions for each skill
    for skill in skills:
        if skill.name in questions_data:
            skill_questions = questions_data[skill.name]

            # Check if questions already exist for this skill
            existing_count = db.query(SkillQuestion).filter_by(skill_id=skill.id).count()
            if existing_count > 0:
                print(f"Questions already exist for {skill.name}, skipping...")
                continue

            print(f"Creating {len(skill_questions)} questions for {skill.name}")

            for q_data in skill_questions:
                question = SkillQuestion(
                    skill_id=skill.id,
                    question_text=q_data["question"],
                    correct_answer=q_data["correct_answer"],
                    difficulty=q_data["difficulty"]
                )
                question.set_options(q_data["options"])
                db.add(question)

    db.commit()
    print("Sample questions created successfully!")

if __name__ == "__main__":
    # Create database session
    db = next(get_db())

    try:
        create_sample_questions(db)
    except Exception as e:
        print(f"Error creating questions: {e}")
        db.rollback()
    finally:
        db.close()
