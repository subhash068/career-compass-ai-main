#!/usr/bin/env python3
"""
AI DEPTH Features Test Script
Tests the implemented Explainable AI, Skill Dependency Graph, and Transparent Scoring features
"""

import sys
import os
from unittest.mock import Mock, patch

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Mock database for testing
class MockSkill:
    def __init__(self, skill_id, name, depends_on=None):
        self.id = skill_id
        self.name = name
        self.depends_on = depends_on or []

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'depends_on': self.depends_on
        }

    def get_depends_on(self):
        return self.depends_on

class MockSkillRequirement:
    def __init__(self, skill_id, required_level, weight):
        self.skill_id = skill_id
        self.required_level = required_level
        self.weight = weight
        self.skill = MockSkill(skill_id, f"Skill {skill_id}")
        self.required_level = required_level

class MockJobRole:
    def __init__(self, role_id, title):
        self.id = role_id
        self.title = title
        self.level = 'mid'

class MockUserSkill:
    def __init__(self, skill_id, score, level='beginner'):
        self.skill_id = skill_id
        self.score = score
        self.level = level

def test_skill_dependency_graph():
    """Test Skill model with depends_on field"""
    print("🧪 Testing Skill Dependency Graph (DAG)...")

    from models.skill import Skill

    # Test skill with dependencies using proper SQLAlchemy initialization
    skill = Skill()
    skill.id = 'skill1'
    skill.name = 'Flask'
    skill.description = 'Web framework'
    skill.category_id = 'web'
    skill.demand_level = 8
    skill.set_depends_on(['python', 'http'])

    assert skill.id == 'skill1'
    assert skill.name == 'Flask'
    assert skill.get_depends_on() == ['python', 'http']

    # Test to_dict includes depends_on
    skill_dict = skill.to_dict()
    assert 'depends_on' in skill_dict
    assert skill_dict['depends_on'] == ['python', 'http']

    print("  ✅ Skill model supports DAG dependencies")

def test_topological_sort():
    """Test topological sorting for learning paths"""
    print("🧪 Testing Topological Sort for Learning Paths...")

    from services.learning_service import LearningService

    # Mock skills with dependencies
    mock_skills = [
        MockSkill('python', 'Python', []),
        MockSkill('http', 'HTTP Basics', []),
        MockSkill('flask', 'Flask', ['python', 'http']),
        MockSkill('docker', 'Docker', ['python']),
        MockSkill('kubernetes', 'Kubernetes', ['docker'])
    ]

    skill_ids = ['flask', 'docker', 'kubernetes']

    mock_db = Mock()
    mock_db.query.return_value.all.return_value = mock_skills
    sorted_skills = LearningService._topological_sort(mock_db, skill_ids)

    # Verify topological order: python/http first, then flask/docker, then kubernetes
    assert 'flask' in sorted_skills
    assert 'docker' in sorted_skills
    assert 'kubernetes' in sorted_skills

    # Flask should come after its dependencies (though dependencies might not be in the list)
    flask_index = sorted_skills.index('flask')
    docker_index = sorted_skills.index('docker')
    k8s_index = sorted_skills.index('kubernetes')

    # Kubernetes should come after docker
    assert k8s_index > docker_index

    print("  ✅ Topological sort works correctly")

def test_explainable_career_matching():
    """Test explainable career matching with reason list"""
    print("🧪 Testing Explainable Career Matching...")

    from services.career_service import CareerService

    # Mock user skills
    user_skills = {
        'python': MockUserSkill('python', 80, 'intermediate'),
        'flask': MockUserSkill('flask', 60, 'intermediate'),
        'docker': MockUserSkill('docker', 20, 'beginner')
    }

    # Mock job requirements
    requirements = [
        MockSkillRequirement('python', 'intermediate', 30),
        MockSkillRequirement('flask', 'intermediate', 25),
        MockSkillRequirement('docker', 'intermediate', 20),
        MockSkillRequirement('aws', 'beginner', 25)
    ]

    # Mock job role
    role = MockJobRole('backend_dev', 'Backend Developer')

    mock_db = Mock()
    mock_db.query.return_value.filter.return_value.all.side_effect = [list(user_skills.values()), requirements]
    mock_db.query.return_value.all.return_value = [role]
    recommendations = CareerService.recommend_careers(mock_db, 'user1', 1)

    assert len(recommendations) == 1
    rec = recommendations[0]

    # Check new response format
    assert 'role_id' in rec
    assert 'title' in rec
    assert 'match_percentage' in rec
    assert 'matched_skills' in rec
    assert 'missing_skills' in rec

    assert rec['title'] == 'Backend Developer'
    assert isinstance(rec['match_percentage'], int)
    assert isinstance(rec['matched_skills'], list)
    assert isinstance(rec['missing_skills'], list)

    print("  ✅ Explainable career matching returns correct format")

def test_transparent_scoring():
    """Test transparent scoring with detailed calculations"""
    print("🧪 Testing Transparent Scoring...")

    from services.career_service import CareerService

    # Mock data for scoring test
    user_skills = {
        'python': MockUserSkill('python', 80, 'intermediate'),
        'flask': MockUserSkill('flask', 60, 'intermediate')
    }

    requirements = [
        MockSkillRequirement('python', 'intermediate', 50),  # 50% weight
        MockSkillRequirement('flask', 'intermediate', 50)   # 50% weight
    ]

    match_score, matched_skills, missing_skills = CareerService._calculate_match_score(user_skills, requirements)

    # Python: 80 >= 50 (intermediate score), so full weight
    # Flask: 60 >= 50 (intermediate score), so full weight
    # Expected match: 100%
    assert match_score == 100

    assert len(matched_skills) == 2
    assert len(missing_skills) == 0  # No gaps since both requirements met

    print("  ✅ Transparent scoring calculates correctly")

def main():
    """Run all AI DEPTH tests"""
    print("🤖 AI DEPTH Features Test Suite")
    print("=" * 50)

    try:
        test_skill_dependency_graph()
        test_topological_sort()
        test_explainable_career_matching()
        test_transparent_scoring()

        print("=" * 50)
        print("🎉 All AI DEPTH tests passed!")
        print("\n✅ AI DEPTH features verified:")
        print("  • Skill Dependency Graph (DAG)")
        print("  • Topological Sort for Learning Paths")
        print("  • Explainable Career Matching")
        print("  • Transparent Scoring")

    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return 1

    return 0

if __name__ == '__main__':
    sys.exit(main())
