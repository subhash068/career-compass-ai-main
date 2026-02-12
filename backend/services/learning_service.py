from typing import Dict, Any, List
from collections import defaultdict, deque
from datetime import datetime
import numpy as np

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

        role = db.query(JobRole).filter_by(id=target_role_id).first()
        if not role:
            raise ValueError("Target role not found")

        # Prevent duplicate active paths
        existing = db.query(LearningPath).filter(
            LearningPath.user_id == user_id,
            LearningPath.target_role_id == target_role_id
        ).first()

        if existing:
            return existing.to_dict()

        requirements = db.query(RoleSkillRequirement).filter_by(
            role_id=target_role_id
        ).all()

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
        )
        db.add(path)
        db.flush()

        total_weeks = 0
        order = 1

        for skill_id in ordered_skill_ids:
            req = next(r for r in requirements if r.skill_id == skill_id)
            user_skill = user_skill_map.get(skill_id)

            current = user_skill.score if user_skill else 0
            required = LearningService._level_to_score(req.required_level)
            gap = max(0, required - current)

            # Use AI-enhanced duration estimation
            skill_importance = skill_weights.get(skill_id, 1.0)
            weeks = LearningOptimizer.estimate_duration_with_difficulty(
                gap, skill_importance=skill_importance
            )
            total_weeks += weeks

            step = LearningPathStep(
                skill_id=skill_id,
                target_level=req.required_level,
                order=order,
                estimated_duration=f"{weeks} weeks",
                is_completed=False,
            )
            step.set_resources([])
            step.set_dependencies([])

            db.add(step)
            db.flush()

            db.add(
                LearningPathStepAssociation(
                    learning_path_id=path.id,
                    step_id=step.id,
                    order=order,
                    is_completed=False,
                )
            )

            order += 1

        path.total_duration = f"{total_weeks} weeks"
        path.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(path)

        return path.to_dict()

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
