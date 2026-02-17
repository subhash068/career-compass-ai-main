#!/usr/bin/env python3
"""
Populate database with job roles and skill requirements for career matching.
"""
from models.database import SessionLocal
from models.job_role import JobRole
from models.role_skill_requirement import RoleSkillRequirement
from models.skill import Skill

def populate_job_roles():
    """Create job roles in the database."""
    db = SessionLocal()
    
    # Define job roles
    roles_data = [
        {
            "id": 1,
            "title": "Frontend Developer",
            "description": "Build responsive, performant user interfaces using modern web technologies.",
            "level": "mid",
        },
        {
            "id": 2,
            "title": "Full Stack Developer",
            "description": "Develop end-to-end web applications spanning frontend and backend.",
            "level": "mid",
        },
        {
            "id": 3,
            "title": "Backend Engineer",
            "description": "Design and implement server-side logic, APIs, and data systems.",
            "level": "mid",
        },
        {
            "id": 4,
            "title": "Data Scientist",
            "description": "Extract insights from data using statistical methods and ML.",
            "level": "mid",
        },
        {
            "id": 5,
            "title": "DevOps Engineer",
            "description": "Automate infrastructure, deployments, and system reliability.",
            "level": "mid",
        },
        {
            "id": 6,
            "title": "Senior Software Engineer",
            "description": "Lead technical initiatives and mentor junior developers.",
            "level": "senior",
        },
        {
            "id": 7,
            "title": "QA Engineer",
            "description": "Ensure software quality through automated and manual testing, test planning, and quality assurance processes.",
            "level": "mid",
        },
    ]

    
    print("Creating job roles...")
    created_count = 0
    for role_data in roles_data:
        existing = db.query(JobRole).filter_by(id=role_data["id"]).first()
        if not existing:
            role = JobRole(**role_data)
            db.add(role)
            created_count += 1
            print(f"  Created: {role_data['title']}")
        else:
            print(f"  Exists: {role_data['title']}")
    
    db.commit()
    print(f"\nCreated {created_count} new job roles")
    db.close()

def populate_skill_requirements():
    """Create role skill requirements in the database."""
    db = SessionLocal()
    
    # Get all skills for reference
    skills = {s.name: s.id for s in db.query(Skill).all()}
    print(f"\nFound {len(skills)} skills in database")
    
    # Define requirements: (role_id, skill_name, required_level, weight)
    requirements_data = [
        # Frontend Developer (role_id=1)
        (1, "JavaScript", "advanced", 0.9),
        (1, "TypeScript", "intermediate", 0.8),
        (1, "React", "advanced", 0.95),
        (1, "CSS/Tailwind", "advanced", 0.85),
        (1, "Next.js", "intermediate", 0.6),
        
        # Full Stack Developer (role_id=2)
        (2, "JavaScript", "advanced", 0.9),
        (2, "TypeScript", "advanced", 0.85),
        (2, "React", "advanced", 0.9),
        (2, "Node.js", "advanced", 0.85),
        (2, "PostgreSQL", "intermediate", 0.7),
        (2, "REST APIs", "advanced", 0.8),
        (2, "Docker", "intermediate", 0.5),
        
        # Backend Engineer (role_id=3)
        (3, "Python", "advanced", 0.9),
        (3, "Node.js", "advanced", 0.85),
        (3, "PostgreSQL", "advanced", 0.9),
        (3, "REST APIs", "advanced", 0.9),
        (3, "Docker", "intermediate", 0.7),
        
        # Data Scientist (role_id=4)
        (4, "Python", "advanced", 0.95),
        (4, "Machine Learning", "advanced", 0.95),
        (4, "Data Analysis", "advanced", 0.9),
        (4, "SQL", "advanced", 0.85),
        
        # DevOps Engineer (role_id=5)
        (5, "Docker", "advanced", 0.95),
        (5, "AWS", "advanced", 0.9),
        (5, "CI/CD", "advanced", 0.9),
        (5, "Kubernetes", "intermediate", 0.8),
        (5, "Python", "intermediate", 0.6),
        
        # QA Engineer (role_id=7)
        (7, "JavaScript", "intermediate", 0.8),
        (7, "Python", "intermediate", 0.7),
        (7, "SQL", "intermediate", 0.75),
        (7, "REST APIs", "intermediate", 0.8),
        (7, "Docker", "beginner", 0.5),
    ]

    
    print("\nCreating skill requirements...")
    created_count = 0
    for role_id, skill_name, required_level, weight in requirements_data:
        skill_id = skills.get(skill_name)
        if not skill_id:
            print(f"  WARNING: Skill '{skill_name}' not found, skipping...")
            continue
            
        # Check if requirement already exists
        existing = db.query(RoleSkillRequirement).filter_by(
            role_id=role_id, skill_id=skill_id
        ).first()
        
        if not existing:
            req = RoleSkillRequirement(
                role_id=role_id,
                skill_id=skill_id,
                required_level=required_level,
                weight=weight
            )
            db.add(req)
            created_count += 1
            print(f"  Created: Role {role_id} -> {skill_name} ({required_level})")
        else:
            print(f"  Exists: Role {role_id} -> {skill_name}")
    
    db.commit()
    print(f"\nCreated {created_count} new skill requirements")
    db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("POPULATING CAREER DATA")
    print("=" * 60)
    
    populate_job_roles()
    populate_skill_requirements()
    
    print("\n" + "=" * 60)
    print("DONE! Career data populated successfully.")
    print("=" * 60)
    print("\nYou can now test career matching - it should show results!")
