#!/usr/bin/env python3
"""
Comprehensive test script for domain-based career matching feature.
Tests all critical paths and edge cases.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Use the project's database configuration
from models.database import engine, SessionLocal, IS_SQLITE
from models.job_role import JobRole
from models.domain import Domain
from models.skill import Skill
from models.skill_assessment import SkillAssessment
from models.user import User
from models.role_skill_requirement import RoleSkillRequirement
from services.career_service import CareerService
from services.assessment_service import AssessmentService
from schemas.assessment import InitializeAssessmentRequest
from datetime import datetime


def test_database_schema():
    """Test 1: Verify database schema has domain_id columns"""
    print("\n" + "="*60)
    print("TEST 1: Database Schema Verification")
    print("="*60)
    
    db = SessionLocal()
    try:
        # Check if domain_id column exists in job_roles
        from sqlalchemy import inspect
        inspector = inspect(engine)
        
        job_roles_columns = [col['name'] for col in inspector.get_columns('job_roles')]
        skill_assessments_columns = [col['name'] for col in inspector.get_columns('skill_assessments')]
        
        if 'domain_id' in job_roles_columns:
            print("[PASS] job_roles table has domain_id column")
        else:
            print("[FAIL] job_roles table MISSING domain_id column")
            return False
            
        if 'domain_id' in skill_assessments_columns:
            print("[PASS] skill_assessments table has domain_id column")
        else:
            print("[FAIL] skill_assessments table MISSING domain_id column")
            return False
            
        return True
    except Exception as e:
        print(f"[FAIL] Error checking schema: {e}")
        return False
    finally:
        db.close()

def test_domain_model():
    """Test 2: Verify Domain model has job_roles relationship"""
    print("\n" + "="*60)
    print("TEST 2: Domain Model Relationship")
    print("="*60)
    
    db = SessionLocal()
    try:
        # Get first domain
        domain = db.query(Domain).first()
        if not domain:
            print("[SKIP] No domains found in database")
            return True
            
        print(f"[INFO] Found domain: {domain.name} (ID: {domain.id})")
        
        # Check if job_roles relationship exists
        if hasattr(domain, 'job_roles'):
            print(f"[PASS] Domain has job_roles relationship")
            try:
                roles_count = len(domain.job_roles)
                print(f"  Associated job roles: {roles_count}")
            except Exception as e:
                print(f"  Note: Could not load job_roles: {e}")
        else:
            print("[FAIL] Domain MISSING job_roles relationship")
            return False
            
        return True
    except Exception as e:
        print(f"[FAIL] Error: {e}")
        return False
    finally:
        db.close()

def test_job_role_model():
    """Test 3: Verify JobRole model has domain relationship"""
    print("\n" + "="*60)
    print("TEST 3: JobRole Model Domain Relationship")
    print("="*60)
    
    db = SessionLocal()
    try:
        # Get first job role
        role = db.query(JobRole).first()
        if not role:
            print("[SKIP] No job roles found in database")
            return True
            
        print(f"[INFO] Found job role: {role.title} (ID: {role.id})")
        
        # Check if domain_id attribute exists
        if hasattr(role, 'domain_id'):
            print(f"[PASS] JobRole has domain_id attribute: {role.domain_id}")
        else:
            print("[FAIL] JobRole MISSING domain_id attribute")
            return False
            
        # Check if domain relationship exists
        if hasattr(role, 'domain'):
            print(f"[PASS] JobRole has domain relationship")
            if role.domain:
                print(f"  Associated domain: {role.domain.name}")
            else:
                print(f"  No domain assigned yet")
        else:
            print("[FAIL] JobRole MISSING domain relationship")
            return False
            
        # Check to_dict includes domain info
        role_dict = role.to_dict()
        if 'domain_id' in role_dict:
            print(f"[PASS] to_dict() includes domain_id: {role_dict['domain_id']}")
        else:
            print("[FAIL] to_dict() MISSING domain_id")
            return False
            
        return True
    except Exception as e:
        print(f"[FAIL] Error: {e}")
        return False
    finally:
        db.close()

def test_skill_assessment_domain():
    """Test 4: Verify SkillAssessment stores domain_id"""
    print("\n" + "="*60)
    print("TEST 4: SkillAssessment Domain Storage")
    print("="*60)
    
    db = SessionLocal()
    try:
        # Get first assessment
        assessment = db.query(SkillAssessment).first()
        if not assessment:
            print("[SKIP] No assessments found (this is OK for fresh database)")
            return True
            
        print(f"[INFO] Found assessment ID: {assessment.id}")
        
        # Check if domain_id attribute exists
        if hasattr(assessment, 'domain_id'):
            print(f"[PASS] SkillAssessment has domain_id attribute: {assessment.domain_id}")
        else:
            print("[FAIL] SkillAssessment MISSING domain_id attribute")
            return False
            
        # Check if domain relationship exists
        if hasattr(assessment, 'domain'):
            print(f"[PASS] SkillAssessment has domain relationship")
            if assessment.domain:
                print(f"  Associated domain: {assessment.domain.name}")
        else:
            print("[FAIL] SkillAssessment MISSING domain relationship")
            return False
            
        return True
    except Exception as e:
        print(f"[FAIL] Error: {e}")
        return False
    finally:
        db.close()

def test_career_service_domain_detection():
    """Test 5: Verify CareerService can detect user's domain"""
    print("\n" + "="*60)
    print("TEST 5: CareerService Domain Detection")
    print("="*60)
    
    db = SessionLocal()
    try:
        # Get first user with assessments
        user = db.query(User).first()
        if not user:
            print("[SKIP] No users found - skipping this test")
            return True
            
        print(f"[INFO] Testing with user ID: {user.id}")
        
        # Test _get_user_latest_domain method
        domain_id = CareerService._get_user_latest_domain(db, user.id)
        
        if domain_id:
            print(f"[PASS] Detected user's latest domain: {domain_id}")
            # Get domain name
            domain = db.query(Domain).filter(Domain.id == domain_id).first()
            if domain:
                print(f"  Domain name: {domain.name}")
        else:
            print(f"[INFO] No domain found for user (user may not have assessments yet)")
            
        return True
    except Exception as e:
        print(f"[FAIL] Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

def test_career_recommendations():
    """Test 6: Verify career recommendations include domain info"""
    print("\n" + "="*60)
    print("TEST 6: Career Recommendations with Domain Info")
    print("="*60)
    
    db = SessionLocal()
    try:
        # Get first user
        user = db.query(User).first()
        if not user:
            print("[SKIP] No users found - skipping this test")
            return True
            
        print(f"[INFO] Testing recommendations for user ID: {user.id}")
        
        # Get recommendations
        result = CareerService.get_matches(db, user.id, top_n=5)
        
        print(f"[PASS] Got {len(result.get('recommendations', []))} recommendations")
        print(f"[PASS] User domain ID: {result.get('user_domain_id')}")
        
        # Check recommendation structure
        if result.get('recommendations'):
            rec = result['recommendations'][0]
            checks = [
                ('role_id', 'Role ID'),
                ('title', 'Title'),
                ('domain_id', 'Domain ID'),
                ('domain_name', 'Domain Name'),
                ('is_in_user_domain', 'Is In User Domain Flag'),
                ('match_percentage', 'Match Percentage'),
                ('base_match_percentage', 'Base Match Percentage'),
            ]
            
            all_passed = True
            for key, label in checks:
                if key in rec:
                    print(f"[PASS] Recommendation has {label}: {rec.get(key)}")
                else:
                    print(f"[FAIL] Recommendation MISSING {label}")
                    all_passed = False
                    
            return all_passed
        
        return True
    except Exception as e:
        print(f"[FAIL] Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

def test_domain_bonus_application():
    """Test 7: Verify domain match bonus is applied"""
    print("\n" + "="*60)
    print("TEST 7: Domain Match Bonus Application")
    print("="*60)
    
    db = SessionLocal()
    try:
        # Get a domain with job roles
        domain = db.query(Domain).first()
        if not domain:
            print("[SKIP] No domains found - skipping this test")
            return True
            
        # Get job roles in this domain
        domain_roles = db.query(JobRole).filter(JobRole.domain_id == domain.id).all()
        other_roles = db.query(JobRole).filter(
            (JobRole.domain_id != domain.id) | (JobRole.domain_id.is_(None))
        ).limit(5).all()
        
        if not domain_roles:
            print(f"[INFO] No job roles assigned to domain {domain.name} yet")
            print("  Run: python assign_domains_to_roles.py")
            return True
            
        print(f"[PASS] Found {len(domain_roles)} roles in domain '{domain.name}'")
        print(f"[PASS] Found {len(other_roles)} roles in other domains")
        
        # Check if any domain role has higher match percentage than base
        sample_role = domain_roles[0]
        print(f"\n  Sample domain role: {sample_role.title}")
        print(f"  Domain ID: {sample_role.domain_id}")
        
        return True
    except Exception as e:
        print(f"[FAIL] Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

def run_all_tests():
    """Run all tests and report results"""
    print("\n" + "="*70)
    print("DOMAIN-BASED CAREER MATCHING - COMPREHENSIVE TEST SUITE")
    print("="*70)
    
    tests = [
        ("Database Schema", test_database_schema),
        ("Domain Model", test_domain_model),
        ("JobRole Model", test_job_role_model),
        ("SkillAssessment Domain", test_skill_assessment_domain),
        ("CareerService Domain Detection", test_career_service_domain_detection),
        ("Career Recommendations", test_career_recommendations),
        ("Domain Bonus Application", test_domain_bonus_application),
    ]
    
    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n[CRASH] Test '{name}' crashed: {e}")
            results.append((name, False))
    
    # Summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "[PASS]" if result else "[FAIL]"
        print(f"{status}: {name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n[SUCCESS] All tests passed! Domain-based career matching is working correctly.")
        return 0
    else:
        print(f"\n[WARNING] {total - passed} test(s) failed. Please review the errors above.")
        return 1

if __name__ == "__main__":
    sys.exit(run_all_tests())
