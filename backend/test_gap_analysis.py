from services.skills_service import SkillsService
from models.database import SessionLocal
from models.skill_assessment import SkillAssessment, SkillAssessmentSkill
from sqlalchemy import func

def test_gap_analysis():
    db = SessionLocal()
    user_id = 1  # Assuming user ID 1

    print("=" * 60)
    print("TESTING GAP ANALYSIS")
    print("=" * 60)

    # Get the latest assessment for each skill
    subquery = db.query(
        SkillAssessmentSkill.skill_id,
        func.max(SkillAssessmentSkill.id).label('max_id')
    ).join(SkillAssessment).filter(
        SkillAssessment.user_id == user_id
    ).group_by(SkillAssessmentSkill.skill_id).subquery()

    latest_assessments = db.query(SkillAssessmentSkill).join(
        subquery,
        SkillAssessmentSkill.id == subquery.c.max_id
    ).all()

    print(f"\n1. FOUND {len(latest_assessments)} LATEST ASSESSMENT RECORDS:")
    for asm in latest_assessments:
        skill_name = asm.skill.name if asm.skill else f"Skill {asm.skill_id}"
        print(f"   - {skill_name}: score={asm.score}, level={asm.level}")

    # Test the analyze_skills function
    print(f"\n2. TESTING analyze_skills() FUNCTION:")
    result = SkillsService.analyze_skills(db, user_id)
    
    print(f"   Total skills in analysis: {result['total_skills']}")
    print(f"   Total gaps returned: {len(result['gaps'])}")
    
    print(f"\n3. ALL SKILLS/GAPS RETURNED:")
    for gap in result['gaps']:
        skill_name = gap['skill']['name']
        current = gap['currentScore']
        required = gap['requiredScore']
        gap_score = gap['gapScore']
        severity = gap['severity']
        print(f"   - {skill_name}:")
        print(f"     Current: {current}%, Required: {required}%, Gap: {gap_score}, Severity: {severity}")

    # Count by severity
    high = len([g for g in result['gaps'] if g['severity'] == 'high'])
    medium = len([g for g in result['gaps'] if g['severity'] == 'medium'])
    low = len([g for g in result['gaps'] if g['severity'] == 'low'])
    none_count = len([g for g in result['gaps'] if g['severity'] == 'none'])
    
    print(f"\n4. SUMMARY BY SEVERITY:")
    print(f"   High: {high}")
    print(f"   Medium: {medium}")
    print(f"   Low: {low}")
    print(f"   Complete (none): {none_count}")
    print(f"   TOTAL: {len(result['gaps'])}")

    db.close()
    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    test_gap_analysis()
