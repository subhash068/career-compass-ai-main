from typing import List, Dict, Any, Optional, Set
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from models.job_role import JobRole
from models.role_skill_requirement import RoleSkillRequirement
from models.user_skill import UserSkill
from models.skill_assessment import SkillAssessmentSkill, SkillAssessment
from models.domain import Domain
from models.skill import Skill
from ai.career_scoring import CareerScoring




class CareerService:
    """
    Handles career recommendations using
    weighted skill-role matching with enhanced market data.
    """


    @staticmethod
    def get_matches(
        db: Session,
        user_id: int,
        top_n: int = 5
    ) -> Dict[str, Any]:
        """
        Get career matches for a user.
        Returns recommendations in the format expected by the API.
        """
        # Get user's latest assessed domain
        user_domain_id = CareerService._get_user_latest_domain(db, user_id)
        
        recommendations = CareerService.recommend_careers(
            db=db,
            user_id=user_id,
            top_n=top_n,
            domain_id=user_domain_id
        )

        return {
            "recommendations": recommendations,
            "topMatches": recommendations[:3] if recommendations else [],
            "user_domain_id": user_domain_id
        }

    @staticmethod
    def _get_user_latest_domain(db: Session, user_id: int) -> Optional[int]:
        """
        Get the user's latest assessed domain ID from their actual skills.
        This ensures we use the correct domain based on what skills they actually assessed.
        """
        # Get user's latest skill assessments
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
        
        if latest_assessments:
            # Get domain from the first assessed skill's actual domain
            first_skill_id = latest_assessments[0].skill_id
            first_skill = db.query(Skill).filter_by(id=first_skill_id).first()
            if first_skill and first_skill.domain_id:
                print(f"[DEBUG] CareerService: Detected domain ID {first_skill.domain_id} from user's actual skills")
                return first_skill.domain_id
        
        # Fallback to assessment record domain if no skills found
        latest_assessment = db.query(SkillAssessment).filter(
            SkillAssessment.user_id == user_id
        ).order_by(desc(SkillAssessment.created_at)).first()
        
        if latest_assessment:
            print(f"[DEBUG] CareerService: Fallback - Using assessment domain ID: {latest_assessment.domain_id}")
            return latest_assessment.domain_id
        
        return None



    @staticmethod
    def _get_user_skills_map(db: Session, user_id: int) -> Dict[int, Any]:
        """Get user's latest skill assessments as a map."""
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
        
        if latest_assessments:
            return {us.skill_id: us for us in latest_assessments}
        
        # Fallback to UserSkill
        user_skills = db.query(UserSkill).filter(
            UserSkill.user_id == user_id
        ).all()
        return {us.skill_id: us for us in user_skills}

    @staticmethod
    def _get_user_domain_skills(db: Session, user_id: int, domain_id: Optional[int] = None) -> Set[int]:
        """
        Get all skill IDs in user's assessed domain.
        Returns set of all domain skills (attempted + unattempted).
        """
        if not domain_id:
            # Try to get domain from latest assessment
            latest_assessment = db.query(SkillAssessment).filter(
                SkillAssessment.user_id == user_id
            ).order_by(desc(SkillAssessment.created_at)).first()
            domain_id = latest_assessment.domain_id if latest_assessment else None
        
        if not domain_id:
            return set()
        
        # Get all skills in the domain
        domain_skills = db.query(Skill).filter_by(domain_id=domain_id).all()
        return {skill.id for skill in domain_skills}


    @staticmethod
    def recommend_careers(
        db: Session,
        user_id: int,
        top_n: int = 5,
        min_match: int = 0,
        domain_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Get enhanced career recommendations with market data.
        
        Args:
            db: Database session
            user_id: User ID
            top_n: Number of recommendations to return
            min_match: Minimum match percentage to include
            domain_id: Optional domain ID to prioritize careers from that domain
        """
        print(f"[DEBUG] recommend_careers called for user {user_id}, domain_id={domain_id}")
        
        user_skill_map = CareerService._get_user_skills_map(db, user_id)
        print(f"[DEBUG] Found {len(user_skill_map)} attempted skills for career matching")
        
        # Get all domain skills to identify unattempted ones
        all_domain_skill_ids = CareerService._get_user_domain_skills(db, user_id, domain_id)
        print(f"[DEBUG] Found {len(all_domain_skill_ids)} total skills in user's domain")
        
        # Calculate how many domain skills are unattempted
        unattempted_count = len(all_domain_skill_ids - set(user_skill_map.keys()))
        print(f"[DEBUG] {unattempted_count} skills in domain are unattempted")


        # Get domain name if domain_id is provided
        domain_name = None
        if domain_id:
            domain = db.query(Domain).filter(Domain.id == domain_id).first()
            domain_name = domain.name if domain else None
            print(f"[DEBUG] User's domain: {domain_name} (ID: {domain_id})")

        # Query roles - strictly filter by domain if provided
        if domain_id:
            # Only get roles from user's assessed domain
            roles = db.query(JobRole).filter(JobRole.domain_id == domain_id).all()
            print(f"[DEBUG] Found {len(roles)} roles in user's domain (ID: {domain_id})")
        else:
            roles = db.query(JobRole).all()

            
        recommendations = []


        for role in roles:
            requirements = db.query(RoleSkillRequirement).filter(
                RoleSkillRequirement.role_id == role.id
            ).all()

            if not requirements:
                continue

            # Use AI-enhanced multi-factor scoring
            scoring_result = CareerScoring.calculate_multi_factor_score(
                db, user_id, requirements
            )

            # Get matched/missing skills (including unattempted as missing)
            match_pct, matched, missing = CareerService._calculate_match_score(
                user_skill_map, requirements, all_domain_skill_ids
            )


            # Skip if below minimum match threshold
            if match_pct < min_match:
                continue

            # Build detailed skill requirements
            skill_requirements = []
            for req in requirements:
                user_skill = user_skill_map.get(req.skill_id)
                
                # Check if skill is unattempted (in domain but not assessed)
                is_unattempted = (
                    all_domain_skill_ids and 
                    req.skill_id in all_domain_skill_ids and 
                    user_skill is None
                )
                
                if is_unattempted:
                    current_score = 0
                    user_level = "unattempted"
                else:
                    current_score = user_skill.score if user_skill else 0
                    user_level = user_skill.level if user_skill else "none"
                    
                required_score = CareerService._level_to_score(req.required_level)
                
                skill_requirements.append({
                    "skill_id": req.skill_id,
                    "skill_name": req.skill.name if req.skill else f"Skill {req.skill_id}",
                    "required_level": req.required_level,
                    "user_level": user_level,
                    "user_score": current_score,
                    "required_score": required_score,
                    "gap": max(0, required_score - current_score),
                    "weight": req.weight,
                    "is_matched": current_score >= required_score,
                    "is_unattempted": is_unattempted
                })


            # Sort requirements by gap (largest first) for priority
            skill_requirements.sort(key=lambda x: x["gap"], reverse=True)

            # Calculate domain match bonus
            domain_match_bonus = 0
            is_in_user_domain = False
            if domain_id and role.domain_id == domain_id:
                domain_match_bonus = 10  # 10% bonus for matching domain
                is_in_user_domain = True
            
            # Apply domain bonus to final score (capped at 100)
            final_score = min(100, scoring_result["final_score"] + domain_match_bonus)

            recommendation = {
                "role_id": role.id,
                "title": role.title,
                "description": role.description,
                "level": role.level,
                "domain_id": role.domain_id,
                "domain_name": role.domain.name if role.domain else None,
                "is_in_user_domain": is_in_user_domain,
                "match_percentage": final_score,
                "base_match_percentage": scoring_result["final_score"],

                "skill_match": scoring_result["skill_match"],
                "inferred_bonus": scoring_result["inferred_bonus"],
                "confidence_level": scoring_result["confidence_level"],
                "matched_skills": matched,
                "missing_skills": missing,
                "matched_count": len(matched),
                "missing_count": len(missing),
                "total_requirements": len(requirements),
                "explanation": scoring_result["explanation"],
                "key_skills": scoring_result["key_skills"],
                "improvement_priority": scoring_result["improvement_priority"],
                "missing_severity": scoring_result["missing_severity"],
                "skill_requirements": skill_requirements,
                # Market data
                "average_salary": {
                    "min": role.average_salary_min if hasattr(role, 'average_salary_min') else 50000,
                    "max": role.average_salary_max if hasattr(role, 'average_salary_max') else 100000,
                    "currency": "USD"
                },
                "growth_rate": role.growth_rate if hasattr(role, 'growth_rate') else 5.0,
                "demand_score": role.demand_score if hasattr(role, 'demand_score') else 50,
                "market_outlook": CareerService._calculate_market_outlook(role),
                # Metadata
                "quality_metrics": scoring_result.get("quality_metrics", {}),
                "estimated_time_to_qualify": CareerService._estimate_time_to_qualify(
                    scoring_result["missing_severity"]
                )
            }

            recommendations.append(recommendation)

        # Sort by match percentage (descending) then demand score
        recommendations.sort(
            key=lambda x: (
                x["match_percentage"],  # Higher match percentage
                x["demand_score"]  # Higher demand score
            ),
            reverse=True
        )


        return recommendations[:top_n]


    @staticmethod
    def compare_careers(
        db: Session,
        user_id: int,
        role_ids: List[int]
    ) -> Dict[str, Any]:
        """
        Compare multiple career options side by side.
        """
        if len(role_ids) < 2:
            raise ValueError("Need at least 2 careers to compare")
        
        if len(role_ids) > 4:
            raise ValueError("Can compare maximum 4 careers at once")
        
        recommendations = CareerService.recommend_careers(db, user_id, top_n=20)
        
        # Filter to requested roles
        comparison = [
            r for r in recommendations 
            if r["role_id"] in role_ids
        ]
        
        # Sort by match percentage
        comparison.sort(key=lambda x: x["match_percentage"], reverse=True)
        
        # Generate comparison insights
        insights = CareerService._generate_comparison_insights(comparison)
        
        return {
            "careers": comparison,
            "insights": insights,
            "best_match": comparison[0] if comparison else None,
            "highest_salary": max(comparison, key=lambda x: x["average_salary"]["max"]) if comparison else None,
            "best_growth": max(comparison, key=lambda x: x["growth_rate"]) if comparison else None,
            "easiest_path": min(comparison, key=lambda x: x["missing_count"]) if comparison else None
        }

    @staticmethod
    def get_trending_careers(
        db: Session,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Get trending careers based on growth rate and demand.
        """
        roles = db.query(JobRole).filter(
            JobRole.growth_rate > 5 if hasattr(JobRole, 'growth_rate') else True
        ).order_by(
            desc(JobRole.demand_score) if hasattr(JobRole, 'demand_score') else desc(JobRole.id)
        ).limit(limit).all()
        
        trending = []
        for role in roles:
            requirements = db.query(RoleSkillRequirement).filter(
                RoleSkillRequirement.role_id == role.id
            ).all()
            
            trending.append({
                "role_id": role.id,
                "title": role.title,
                "level": role.level,
                "description": role.description,
                "growth_rate": role.growth_rate if hasattr(role, 'growth_rate') else 5.0,
                "demand_score": role.demand_score if hasattr(role, 'demand_score') else 50,
                "average_salary": {
                    "min": role.average_salary_min if hasattr(role, 'average_salary_min') else 50000,
                    "max": role.average_salary_max if hasattr(role, 'average_salary_max') else 100000,
                    "currency": "USD"
                },
                "key_skills": [req.skill.name for req in requirements[:5] if req.skill],
                "market_outlook": CareerService._calculate_market_outlook(role),
                "trending_score": (
                    (role.growth_rate if hasattr(role, 'growth_rate') else 5.0) * 0.4 +
                    (role.demand_score if hasattr(role, 'demand_score') else 50) * 0.6
                )
            })
        
        # Sort by trending score
        trending.sort(key=lambda x: x["trending_score"], reverse=True)
        return trending

    @staticmethod
    def _calculate_market_outlook(role: JobRole) -> str:
        """Calculate market outlook based on growth and demand."""
        growth = role.growth_rate if hasattr(role, 'growth_rate') else 5.0
        demand = role.demand_score if hasattr(role, 'demand_score') else 50
        
        score = growth * 0.5 + demand * 0.5
        
        if score >= 70:
            return "Excellent"
        elif score >= 50:
            return "Good"
        elif score >= 30:
            return "Moderate"
        else:
            return "Challenging"

    @staticmethod
    def _estimate_time_to_qualify(missing_severity: List[Dict]) -> str:
        """Estimate time needed to qualify based on skill gaps."""
        if not missing_severity:
            return "Ready now"
        
        high_count = sum(1 for s in missing_severity if s["severity"] == "high")
        medium_count = sum(1 for s in missing_severity if s["severity"] == "medium")
        
        total_weeks = high_count * 12 + medium_count * 4  # weeks estimate
        
        if total_weeks <= 4:
            return "1 month"
        elif total_weeks <= 12:
            return "3 months"
        elif total_weeks <= 24:
            return "6 months"
        elif total_weeks <= 52:
            return "1 year"
        else:
            return "1+ years"

    @staticmethod
    def _generate_comparison_insights(careers: List[Dict]) -> List[str]:
        """Generate insights for career comparison."""
        insights = []
        
        if len(careers) >= 2:
            best_match = max(careers, key=lambda x: x["match_percentage"])
            insights.append(f"{best_match['title']} has the highest skill match at {best_match['match_percentage']}%")
            
            highest_salary = max(careers, key=lambda x: x["average_salary"]["max"])
            insights.append(f"{highest_salary['title']} offers the highest salary potential up to ${highest_salary['average_salary']['max']:,}")
            
            best_growth = max(careers, key=lambda x: x["growth_rate"])
            insights.append(f"{best_growth['title']} has the best growth outlook at +{best_growth['growth_rate']}% annually")
        
        return insights


    @staticmethod
    def _calculate_match_score(
        user_skills: Dict[int, UserSkill],
        requirements: List[RoleSkillRequirement],
        all_domain_skill_ids: Optional[Set[int]] = None
    ) -> tuple[int, List[str], List[str]]:

        total_weight = 0.0
        matched_weight = 0.0
        matched_skills = []
        missing_skills = []

        for req in requirements:
            total_weight += req.weight

            user_skill = user_skills.get(req.skill_id)
            
            # Determine if skill is in user's domain but unattempted
            is_unattempted = (
                all_domain_skill_ids and 
                req.skill_id in all_domain_skill_ids and 
                user_skill is None
            )
            
            # For unattempted skills, treat as score 0 (completely missing)
            if is_unattempted:
                current_score = 0
            else:
                current_score = user_skill.score if user_skill else 0
                
            required_score = CareerService._level_to_score(req.required_level)

            skill_name = req.skill.name if req.skill else f"Skill {req.skill_id}"

            if current_score >= required_score:
                matched_weight += req.weight
                matched_skills.append(skill_name)
            else:
                missing_skills.append(skill_name)

        if total_weight == 0:
            return 0, [], []

        match_percentage = int((matched_weight / total_weight) * 100)
        match_percentage = max(0, min(100, match_percentage))

        return match_percentage, matched_skills, missing_skills


    @staticmethod
    def get_details(
        db: Session,
        user_id: int,
        job_role_id: int
    ) -> Dict[str, Any]:
        """
        Get detailed information about a specific career match for a user.
        """
        print(f"[DEBUG] get_details called for user {user_id}, role {job_role_id}")
        
        # Get the job role
        role = db.query(JobRole).filter(JobRole.id == job_role_id).first()
        if not role:
            raise ValueError(f"Job role {job_role_id} not found")
        
        # Get requirements for this role
        requirements = db.query(RoleSkillRequirement).filter(
            RoleSkillRequirement.role_id == job_role_id
        ).all()
        
        # Get user skills
        user_skill_map = CareerService._get_user_skills_map(db, user_id)
        
        # Calculate match score
        match_pct, matched, missing = CareerService._calculate_match_score(
            user_skill_map, requirements
        )
        
        # Get AI scoring details
        scoring_result = CareerScoring.calculate_multi_factor_score(
            db, user_id, requirements
        )
        
        # Build detailed requirements with user progress
        detailed_requirements = []
        for req in requirements:
            user_skill = user_skill_map.get(req.skill_id)
            current_score = user_skill.score if user_skill else 0
            required_score = CareerService._level_to_score(req.required_level)
            
            # Find severity info if available
            severity_info = next(
                (s for s in scoring_result.get("missing_severity", []) 
                 if s["skill_name"] == (req.skill.name if req.skill else f"Skill {req.skill_id}")),
                None
            )
            
            detailed_requirements.append({
                "skill_id": req.skill_id,
                "skill_name": req.skill.name if req.skill else f"Skill {req.skill_id}",
                "required_level": req.required_level,
                "user_level": user_skill.level if user_skill else "none",
                "user_score": current_score,
                "required_score": required_score,
                "gap": max(0, required_score - current_score),
                "weight": req.weight,
                "is_matched": current_score >= required_score,
                "severity": severity_info["severity"] if severity_info else ("none" if current_score >= required_score else "medium"),
                "description": severity_info.get("description", "") if severity_info else ""
            })
        
        # Sort by gap (largest first)
        detailed_requirements.sort(key=lambda x: x["gap"], reverse=True)
        
        return {
            "role_id": role.id,
            "title": role.title,
            "description": role.description,
            "level": role.level,
            "match_percentage": match_pct,
            "final_score": scoring_result["final_score"],
            "skill_match": scoring_result["skill_match"],
            "inferred_bonus": scoring_result["inferred_bonus"],
            "confidence_level": scoring_result["confidence_level"],
            "matched_skills": matched,
            "missing_skills": missing,
            "matched_count": len(matched),
            "missing_count": len(missing),
            "total_requirements": len(requirements),
            "missing_severity": scoring_result["missing_severity"],
            "explanation": scoring_result["explanation"],
            "key_skills": scoring_result["key_skills"],
            "improvement_priority": scoring_result["improvement_priority"],
            "requirements": detailed_requirements,
            # Market data
            "average_salary": {
                "min": role.average_salary_min if hasattr(role, 'average_salary_min') else 50000,
                "max": role.average_salary_max if hasattr(role, 'average_salary_max') else 100000,
                "currency": "USD"
            },
            "growth_rate": role.growth_rate if hasattr(role, 'growth_rate') else 5.0,
            "demand_score": role.demand_score if hasattr(role, 'demand_score') else 50,
            "market_outlook": CareerService._calculate_market_outlook(role),
            "estimated_time_to_qualify": CareerService._estimate_time_to_qualify(
                scoring_result["missing_severity"]
            ),
            "quality_metrics": scoring_result.get("quality_metrics", {})
        }


    @staticmethod
    def _level_to_score(level: str) -> int:
        return {
            "beginner": 25,
            "intermediate": 50,
            "advanced": 75,
            "expert": 100,
        }.get(level, 25)
