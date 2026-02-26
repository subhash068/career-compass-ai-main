# Gap Analysis Fix - TODO

## Task: Fix gap analysis to include unattempted domain skills as 100% gaps

### Steps:
- [x] Step 1: Modify `backend/services/skills_service.py` - Include unattempted domain skills in gap analysis
- [x] Step 2: Modify `backend/services/career_service.py` - Account for unattempted skills in career matching
- [x] Step 3: Implementation complete - ready for testing



### Details:

**Step 1: skills_service.py changes:**
- Get user's assessed domain ID from latest assessment
- Query ALL skills in that domain
- For unattempted skills: create gap with 100% gap score, HIGH severity
- Combine attempted and unattempted skills in gap analysis

**Step 2: career_service.py changes:**
- Get all domain skills (not just attempted)
- For role requirements, treat unattempted skills as missing
- Lower career match percentages when skills are unattempted

**Expected Result:**
- Frontend domain with 6 skills, user attempts 2 and fails both
- Gap analysis shows: 6 gaps (2 failed + 4 unattempted) = 100% gap
- Career matches reflect lower percentages due to unattempted skills
