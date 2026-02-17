from typing import Dict, Any, List
from collections import defaultdict, deque
from datetime import datetime
import numpy as np
import random

from sqlalchemy.orm import Session

from models.learning_path import LearningPath, LearningPathStepAssociation
from models.learning_path_step import LearningPathStep
from models.learning_resource import LearningResource
from models.user_skill import UserSkill
from models.job_role import JobRole
from models.role_skill_requirement import RoleSkillRequirement
from models.skill import Skill
from ai.learning_optimizer import LearningOptimizer



class LearningService:
    """
    Generates and manages personalized learning paths
    based on skill gaps and dependency resolution.
    """

    # --------------------------------------------------
    # GENERATE LEARNING PATH
    # --------------------------------------------------
    @staticmethod
    def generate_learning_path(
        db: Session,
        user_id: int,
        target_role_id: int
    ) -> Dict[str, Any]:
        try:
            role = db.query(JobRole).filter_by(id=target_role_id).first()
            if not role:
                raise ValueError("Target role not found")

            # Check for existing path - if exists but has no steps, recreate it
            existing = db.query(LearningPath).filter(
                LearningPath.user_id == user_id,
                LearningPath.target_role_id == target_role_id
            ).first()

            if existing:
                # Check if existing path has steps
                step_count = db.query(LearningPathStepAssociation).filter_by(
                    learning_path_id=existing.id
                ).count()
                
                if step_count > 0:
                    # Return existing path with steps
                    return existing.to_dict()
                else:
                    # Delete empty path and create new one
                    db.delete(existing)
                    db.flush()


            requirements = db.query(RoleSkillRequirement).filter_by(
                role_id=target_role_id
            ).all()

            # Validate requirements exist
            if not requirements:
                # Create a path with no steps - user needs to check career requirements
                path = LearningPath(
                    user_id=user_id,
                    target_role_id=target_role_id,
                    total_duration="0 weeks",
                    progress=100,
                )
                db.add(path)
                db.commit()
                db.refresh(path)
                return path.to_dict()

            user_skills = db.query(UserSkill).filter_by(user_id=user_id).all()
            user_skill_map = {us.skill_id: us for us in user_skills}

            # ------------------------------------------
            # Identify gaps
            # ------------------------------------------
            missing_skill_ids = []
            for req in requirements:
                user_skill = user_skill_map.get(req.skill_id)
                current = user_skill.score if user_skill else 0
                required = LearningService._level_to_score(req.required_level)

                if current < required:
                    missing_skill_ids.append(req.skill_id)

            # User already qualified
            if not missing_skill_ids:
                path = LearningPath(
                    user_id=user_id,
                    target_role_id=target_role_id,
                    total_duration="0 weeks",
                    progress=100,
                )
                db.add(path)
                db.commit()
                db.refresh(path)
                return path.to_dict()

            # ------------------------------------------
            # Enhanced dependency resolution with AI
            # ------------------------------------------
            # Get skill importance weights from requirements
            skill_weights = {req.skill_id: req.weight for req in requirements}
            dependencies = LearningService._build_dependency_graph(db, missing_skill_ids)

            # Use AI optimizer for better ordering
            optimized_result = LearningOptimizer.optimize_dependency_graph(
                missing_skill_ids, dependencies, skill_weights
            )
            ordered_skill_ids = optimized_result["optimized_order"]

            # ------------------------------------------
            # Create learning path with AI-enhanced estimation
            # ------------------------------------------
            path = LearningPath(
                user_id=user_id,
                target_role_id=target_role_id,
                progress=0,
                total_duration="0 weeks",  # Initialize with default
            )
            db.add(path)
            db.flush()

            total_weeks = 0
            order = 1

            for skill_id in ordered_skill_ids:
                # Find the requirement for this skill, skip if not found
                req = next((r for r in requirements if r.skill_id == skill_id), None)
                if not req:
                    continue
                    
                user_skill = user_skill_map.get(skill_id)

                current = user_skill.score if user_skill else 0
                required = LearningService._level_to_score(req.required_level)
                gap = max(0, required - current)

                # Use AI-enhanced duration estimation
                skill_importance = skill_weights.get(skill_id, 1.0)
                duration_result = LearningOptimizer.estimate_duration_with_difficulty(
                    gap, skill_importance=skill_importance
                )
                weeks = duration_result.get("estimated_weeks", 1)
                total_weeks += weeks

                # Generate assessment questions for this step
                skill = db.query(Skill).filter_by(id=skill_id).first()
                skill_name = skill.name if skill else "Unknown Skill"
                assessment_questions = LearningService._generate_assessment_questions(
                    skill_name,
                    req.required_level,
                    gap
                )

                step = LearningPathStep(
                    skill_id=skill_id,
                    target_level=req.required_level,
                    order=order,
                    estimated_duration=f"{weeks} weeks",
                    is_completed=False,
                )
                step.set_resources([])
                step.set_dependencies([])
                
                # Try to set assessment questions, but handle if column doesn't exist
                try:
                    step.set_assessment_questions(assessment_questions)
                except Exception as e:
                    print(f"Warning: Could not set assessment questions: {e}")
                    # Continue without assessment questions

                db.add(step)
                db.flush()

                # Create association - handle missing columns gracefully
                try:
                    assoc = LearningPathStepAssociation(
                        learning_path_id=path.id,
                        step_id=step.id,
                        order=order,
                        is_completed=False,
                    )
                    # Try to set assessment_passed if column exists
                    try:
                        assoc.assessment_passed = False
                    except AttributeError:
                        pass  # Column doesn't exist, ignore
                    db.add(assoc)
                except Exception as e:
                    print(f"Warning: Could not create step association: {e}")
                    # Don't fail the whole operation if one step fails

                order += 1

            # Ensure total_duration is always set
            path.total_duration = f"{total_weeks} weeks" if total_weeks > 0 else "0 weeks"
            path.updated_at = datetime.utcnow()

            db.commit()
            db.refresh(path)

            return path.to_dict()

        except Exception as e:
            db.rollback()
            print(f"Error in generate_learning_path: {str(e)}")
            import traceback
            traceback.print_exc()
            raise

    # --------------------------------------------------
    # CHECK STEP COMPLETION ELIGIBILITY
    # --------------------------------------------------
    @staticmethod
    def can_mark_complete(
        db: Session,
        user_id: int,
        path_id: int,
        step_id: int
    ) -> Dict[str, Any]:
        """
        Check if a step can be marked as complete.
        Requirements:
        1. Previous step must be completed (sequential)
        2. Assessment must be passed
        """
        path = db.query(LearningPath).filter_by(
            id=path_id,
            user_id=user_id
        ).first()

        if not path:
            return {
                "can_complete": False,
                "reason": "Learning path not found",
                "previous_step_completed": False,
                "assessment_passed": False
            }

        # Get all step associations ordered
        step_assocs = db.query(LearningPathStepAssociation).filter_by(
            learning_path_id=path_id
        ).order_by(LearningPathStepAssociation.order).all()

        target_assoc = None
        prev_assoc = None
        target_index = -1

        for i, assoc in enumerate(step_assocs):
            if assoc.step_id == step_id:
                target_assoc = assoc
                target_index = i
                if i > 0:
                    prev_assoc = step_assocs[i - 1]
                break

        if not target_assoc:
            return {
                "can_complete": False,
                "reason": "Step not found in learning path",
                "previous_step_completed": False,
                "assessment_passed": False
            }

        # Check if previous step is completed
        previous_completed = True
        if prev_assoc:
            previous_completed = prev_assoc.is_completed

        # Check if assessment is passed (handle if column doesn't exist)
        assessment_passed = False
        try:
            assessment_passed = target_assoc.assessment_passed
        except AttributeError:
            # Column doesn't exist, assume not passed
            assessment_passed = False

        can_complete = previous_completed and assessment_passed

        return {
            "can_complete": can_complete,
            "reason": "Ready to complete" if can_complete else (
                "Complete the previous step first" if not previous_completed else
                "Pass the assessment first"
            ),
            "previous_step_completed": previous_completed,
            "assessment_passed": assessment_passed,
            "step_order": target_index + 1,
            "total_steps": len(step_assocs)
        }

    # --------------------------------------------------
    # SUBMIT STEP ASSESSMENT
    # --------------------------------------------------
    @staticmethod
    def submit_step_assessment(
        db: Session,
        user_id: int,
        path_id: int,
        step_id: int,
        answers: List[str]
    ) -> Dict[str, Any]:
        """
        Submit assessment answers for a step.
        Returns pass/fail result.
        """
        path = db.query(LearningPath).filter_by(
            id=path_id,
            user_id=user_id
        ).first()

        if not path:
            raise ValueError("Learning path not found")

        assoc = db.query(LearningPathStepAssociation).filter_by(
            learning_path_id=path_id,
            step_id=step_id
        ).first()

        if not assoc:
            raise ValueError("Learning step not found")

        step = db.query(LearningPathStep).filter_by(id=step_id).first()
        if not step:
            raise ValueError("Step not found")

        # Get assessment questions (handle if column doesn't exist)
        questions = []
        try:
            questions = step.get_assessment_questions()
        except Exception as e:
            print(f"Warning: Could not get assessment questions: {e}")
            questions = []
        
        if not questions:
            # No assessment required, auto-pass
            try:
                assoc.assessment_passed = True
            except AttributeError:
                pass  # Column doesn't exist
            db.commit()
            return {
                "passed": True,
                "score": 100,
                "correct_answers": 0,
                "total_questions": 0,
                "message": "No assessment required for this step"
            }

        # Validate answers
        if len(answers) != len(questions):
            return {
                "passed": False,
                "score": 0,
                "correct_answers": 0,
                "total_questions": len(questions),
                "message": f"Please answer all {len(questions)} questions"
            }

        correct_count = 0
        for i, question in enumerate(questions):
            if i < len(answers) and answers[i] == question.get("correct_answer"):
                correct_count += 1

        # Pass threshold: 70%
        total = len(questions)
        score = (correct_count / total) * 100 if total > 0 else 0
        passed = score >= 70

        # Update assessment status (handle if column doesn't exist)
        try:
            assoc.assessment_passed = passed
        except AttributeError:
            pass  # Column doesn't exist, continue without saving
        db.commit()

        return {
            "passed": passed,
            "score": round(score, 1),
            "correct_answers": correct_count,
            "total_questions": total,
            "message": "Congratulations! You passed the assessment." if passed else
                      f"You need 70% to pass. You scored {round(score, 1)}%. Try again!"
        }

    # --------------------------------------------------
    # GET STEP ASSESSMENT QUESTIONS
    # --------------------------------------------------
    @staticmethod
    def get_step_assessment(
        db: Session,
        user_id: int,
        path_id: int,
        step_id: int
    ) -> Dict[str, Any]:
        """
        Get assessment questions for a step.
        """
        path = db.query(LearningPath).filter_by(
            id=path_id,
            user_id=user_id
        ).first()

        if not path:
            raise ValueError("Learning path not found")

        assoc = db.query(LearningPathStepAssociation).filter_by(
            learning_path_id=path_id,
            step_id=step_id
        ).first()

        if not assoc:
            raise ValueError("Learning step not found")

        step = db.query(LearningPathStep).filter_by(id=step_id).first()
        if not step:
            raise ValueError("Step not found")

        questions = step.get_assessment_questions()

        # Return questions without correct answers
        questions_for_user = [
            {
                "id": i,
                "question": q.get("question"),
                "options": q.get("options")
            }
            for i, q in enumerate(questions)
        ]

        # Check if already passed (handle if column doesn't exist)
        already_passed = False
        try:
            already_passed = assoc.assessment_passed
        except AttributeError:
            already_passed = False

        return {
            "step_id": step_id,
            "skill_name": step.skill.name if step.skill else "Unknown",
            "target_level": step.target_level,
            "questions": questions_for_user,
            "total_questions": len(questions_for_user),
            "assessment_already_passed": already_passed
        }

    # --------------------------------------------------
    # GENERATE ASSESSMENT QUESTIONS
    # --------------------------------------------------
    @staticmethod
    def _generate_assessment_questions(
        skill_name: str,
        target_level: str,
        gap_score: int
    ) -> List[Dict[str, Any]]:
        """
        Generate assessment questions for a learning step.
        Creates 3-5 questions based on skill and level.
        """
        # Question templates based on skill type and level
        question_templates = {
            "beginner": [
                {
                    "question": f"What is the primary purpose of {skill_name}?",
                    "options": [
                        f"To understand basic {skill_name} concepts",
                        f"To master advanced {skill_name} techniques",
                        f"To teach others about {skill_name}",
                        f"To replace existing {skill_name} tools"
                    ],
                    "correct_answer": f"To understand basic {skill_name} concepts"
                },
                {
                    "question": f"Which of the following is a fundamental concept in {skill_name}?",
                    "options": [
                        "Basic syntax and structure",
                        "Advanced optimization algorithms",
                        "Machine learning integration",
                        "Distributed systems architecture"
                    ],
                    "correct_answer": "Basic syntax and structure"
                },
                {
                    "question": f"When starting with {skill_name}, what should you focus on first?",
                    "options": [
                        "Learning the core fundamentals",
                        "Building complex applications",
                        "Contributing to open source",
                        "Writing documentation"
                    ],
                    "correct_answer": "Learning the core fundamentals"
                }
            ],
            "intermediate": [
                {
                    "question": f"In {skill_name}, what is an important intermediate concept to master?",
                    "options": [
                        "Advanced patterns and best practices",
                        "Basic syntax only",
                        "Hardware-level implementation",
                        "Marketing strategies"
                    ],
                    "correct_answer": "Advanced patterns and best practices"
                },
                {
                    "question": f"Which approach is recommended when working with {skill_name} at an intermediate level?",
                    "options": [
                        "Following established design patterns",
                        "Always using the newest features",
                        "Ignoring documentation",
                        "Copy-pasting code from tutorials"
                    ],
                    "correct_answer": "Following established design patterns"
                },
                {
                    "question": f"What demonstrates intermediate proficiency in {skill_name}?",
                    "options": [
                        "Building complete, working solutions",
                        "Reading about the technology",
                        "Watching tutorial videos only",
                        "Memorizing documentation"
                    ],
                    "correct_answer": "Building complete, working solutions"
                }
            ],
            "advanced": [
                {
                    "question": f"At an advanced level, what is crucial when working with {skill_name}?",
                    "options": [
                        "Optimizing performance and scalability",
                        "Learning basic syntax",
                        "Following tutorials step-by-step",
                        "Avoiding complex problems"
                    ],
                    "correct_answer": "Optimizing performance and scalability"
                },
                {
                    "question": f"Which skill indicates advanced {skill_name} expertise?",
                    "options": [
                        "Architecting complex systems",
                        "Writing 'Hello World' programs",
                        "Installing the software",
                        "Reading documentation"
                    ],
                    "correct_answer": "Architecting complex systems"
                },
                {
                    "question": f"What is expected from an advanced {skill_name} practitioner?",
                    "options": [
                        "Solving complex problems efficiently",
                        "Knowing only basic concepts",
                        "Avoiding challenging tasks",
                        "Relying on others for solutions"
                    ],
                    "correct_answer": "Solving complex problems efficiently"
                }
            ]
        }

        # Get questions for the target level, default to beginner
        level_questions = question_templates.get(target_level, question_templates["beginner"])
        
        # Select 3-4 random questions
        num_questions = min(4, max(3, len(level_questions)))
        selected_questions = random.sample(level_questions, num_questions)
        
        return selected_questions

    # --------------------------------------------------
    # RANK LEARNING RESOURCES
    # --------------------------------------------------
    @staticmethod
    def rank_learning_resources(
        db: Session,
        skill_id: int,
        user_id: int
    ) -> List[Dict[str, Any]]:
        """
        Rank learning resources for a skill based on user preferences and quality.
        """
        resources = db.query(LearningResource).filter(
            LearningResource.skill_id == skill_id
        ).all()

        if not resources:
            return []

        # Use AI optimizer to rank resources
        ranked_resources = LearningOptimizer.rank_resources(
            [r.to_dict() for r in resources],
            user_id=user_id
        )

        return ranked_resources

    # --------------------------------------------------
    # UPDATE STEP PROGRESS
    # --------------------------------------------------
    @staticmethod
    def update_step_progress(
        db: Session,
        user_id: int,
        path_id: int,
        step_id: int,
        completed: bool
    ) -> Dict[str, Any]:

        path = db.query(LearningPath).filter_by(
            id=path_id,
            user_id=user_id
        ).first()

        if not path:
            raise ValueError("Learning path not found")

        assoc = db.query(LearningPathStepAssociation).filter_by(
            learning_path_id=path_id,
            step_id=step_id
        ).first()

        if not assoc:
            raise ValueError("Learning step not found")

        assoc.is_completed = completed

        total = db.query(LearningPathStepAssociation).filter_by(
            learning_path_id=path_id
        ).count()

        done = db.query(LearningPathStepAssociation).filter_by(
            learning_path_id=path_id,
            is_completed=True
        ).count()

        path.progress = int((done / total) * 100) if total else 0
        path.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(path)

        return path.to_dict()

    # --------------------------------------------------
    # TOPOLOGICAL SORT
    # --------------------------------------------------
    @staticmethod
    def _topological_sort(
        db: Session,
        skill_ids: List[int]
    ) -> List[int]:

        all_skills = db.query(Skill).all()
        skill_map = {s.id: s for s in all_skills}

        graph = defaultdict(list)
        in_degree = defaultdict(int)

        for sid in skill_ids:
            skill = skill_map.get(sid)
            if not skill:
                continue

            for dep in skill.get_depends_on():
                if dep in skill_ids:
                    graph[dep].append(sid)
                    in_degree[sid] += 1

            in_degree.setdefault(sid, 0)

        queue = deque([s for s in skill_ids if in_degree[s] == 0])
        ordered = []

        while queue:
            node = queue.popleft()
            ordered.append(node)
            for nxt in graph[node]:
                in_degree[nxt] -= 1
                if in_degree[nxt] == 0:
                    queue.append(nxt)

        return ordered if len(ordered) == len(skill_ids) else skill_ids

    # --------------------------------------------------
    # GET PATHS
    # --------------------------------------------------
    @staticmethod
    def get_paths(
        db: Session,
        user_id: int
    ) -> Dict[str, Any]:
        """
        Get all learning paths for a user
        """
        paths = db.query(LearningPath).filter_by(user_id=user_id).all()
        if not paths:
            raise ValueError("No learning paths found")
        return {
            "paths": [p.to_dict() for p in paths],
            "count": len(paths)
        }

    # --------------------------------------------------
    # GET PATH DETAILS
    # --------------------------------------------------
    @staticmethod
    def get_path_details(
        db: Session,
        user_id: int,
        path_id: int
    ) -> Dict[str, Any]:
        """
        Get detailed information about a specific learning path
        """
        path = db.query(LearningPath).filter_by(
            id=path_id,
            user_id=user_id
        ).first()
        
        if not path:
            raise ValueError("Learning path not found")
        
        return path.to_dict()

    # --------------------------------------------------
    # COMPLETE STEP
    # --------------------------------------------------
    @staticmethod
    def complete_step(
        db: Session,
        user_id: int,
        path_id: int,
        step_id: int
    ) -> Dict[str, Any]:
        """
        Mark a learning step as completed
        """
        path = db.query(LearningPath).filter_by(
            id=path_id,
            user_id=user_id
        ).first()

        if not path:
            raise ValueError("Learning path not found")

        assoc = db.query(LearningPathStepAssociation).filter_by(
            learning_path_id=path_id,
            step_id=step_id
        ).first()

        if not assoc:
            raise ValueError("Learning step not found")

        assoc.is_completed = True

        # Recalculate progress
        total = db.query(LearningPathStepAssociation).filter_by(
            learning_path_id=path_id
        ).count()

        done = db.query(LearningPathStepAssociation).filter_by(
            learning_path_id=path_id,
            is_completed=True
        ).count()

        path.progress = int((done / total) * 100) if total else 0
        path.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(path)

        return path.to_dict()

    # --------------------------------------------------
    # BUILD DEPENDENCY GRAPH
    # --------------------------------------------------
    @staticmethod
    def _build_dependency_graph(db: Session, skill_ids: List[int]) -> Dict[int, List[int]]:
        """
        Build a dependency graph for skills
        """
        all_skills = db.query(Skill).filter(Skill.id.in_(skill_ids)).all()
        graph = {}
        
        for skill in all_skills:
            deps = skill.get_depends_on()
            # Only include dependencies that are in our skill_ids list
            graph[skill.id] = [d for d in deps if d in skill_ids]
        
        return graph

    # --------------------------------------------------
    # LEVEL → SCORE
    # --------------------------------------------------
    @staticmethod
    def _level_to_score(level: str) -> int:
        return {
            "beginner": 25,
            "intermediate": 50,
            "advanced": 75,
            "expert": 100,
        }.get(level, 25)
