#!/usr/bin/env python3
"""
Script to create initial domain data
"""
import sys
import os
from sqlalchemy.orm import Session

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from models.database import get_db, create_tables
from models.domain import Domain
from models.skill import Skill

def create_initial_domains(db: Session):
    """Create initial domain data"""

    # Define domains and their skills
    domains_data = [
        {
            "name": "Frontend",
            "skills": [
                "HTML", "CSS", "JavaScript", "React", "Accessibility", "Performance Optimization"
            ]
        },
        {
            "name": "Backend",
            "skills": [
                "Python", "APIs (REST)", "Databases", "Authentication & Authorization",
                "System Design", "Security Basics"
            ]
        },
        {
            "name": "Full Stack",
            "skills": [
                "Frontend Fundamentals", "Backend Fundamentals", "Database Design",
                "API Integration", "Deployment Basics"
            ]
        },
        {
            "name": "AI / ML",
            "skills": [
                "Python", "Statistics", "Machine Learning Algorithms",
                "Data Preprocessing", "Model Evaluation"
            ]
        },
        {
            "name": "DevOps",
            "skills": [
                "Linux", "Git", "CI/CD", "Docker", "Kubernetes", "Cloud Basics"
            ]
        },
        {
            "name": "QA Engineer",
            "skills": [
                "Manual Testing", "Automation Testing", "Selenium", "API Testing",
                "Bug Tracking", "Test Case Design"
            ]
        }
    ]

    # Create domains and skills
    for domain_data in domains_data:
        # Check if domain already exists
        existing_domain = db.query(Domain).filter_by(name=domain_data["name"]).first()
        if existing_domain:
            print(f"Domain '{domain_data['name']}' already exists, skipping...")
            continue

        # Create domain
        domain = Domain(name=domain_data["name"])
        db.add(domain)
        db.flush()  # Get the domain ID

        print(f"Created domain: {domain.name}")

        # Create skills for this domain
        for skill_name in domain_data["skills"]:
            # Check if skill already exists
            existing_skill = db.query(Skill).filter_by(name=skill_name).first()
            if existing_skill:
                print(f"Skill '{skill_name}' already exists, updating domain...")
                existing_skill.domain_id = domain.id
            else:
                skill = Skill(
                    name=skill_name,
                    description=f"Assessment for {skill_name}",
                    demand_level=5,
                    depends_on="[]",
                    domain_id=domain.id
                )
                db.add(skill)
                print(f"Created skill: {skill_name}")

    db.commit()
    print("Initial domain and skill data created successfully!")

if __name__ == "__main__":
    # Create tables if they don't exist
    create_tables()

    # Create database session
    db = next(get_db())

    try:
        create_initial_domains(db)
    except Exception as e:
        print(f"Error creating initial data: {e}")
        db.rollback()
    finally:
        db.close()
