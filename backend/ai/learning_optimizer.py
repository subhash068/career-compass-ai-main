from typing import List, Dict, Any, Optional
import numpy as np
from .config.ai_settings import AISettings
from .memory.conversation_memory import ConversationMemory
from .skill_similarity import SkillSimilarity
from .evaluation.ai_quality import AIQualityMetrics



class LearningOptimizer:
    """
    Optimizes learning paths with difficulty-aware estimation and resource ranking.
    Phase 3A: Enhanced with embeddings, memory integration, and evaluation.
    """

    @staticmethod
    def estimate_duration_with_difficulty(
        gap: float,
        user_learning_speed: float = 1.0,
        skill_importance: float = 1.0,
        conversation_memory: Optional[ConversationMemory] = None
    ) -> Dict[str, Any]:
        """
        Estimate learning duration based on skill gap and user factors.
        Enhanced with historical data and evaluation.
        """
        base_weeks = max(1, int(np.ceil(gap / 10)))  # Base: 10 points per week

        # Adjust for difficulty (importance increases difficulty)
        difficulty_multiplier = 1 + (skill_importance - 1) * 0.2

        # Adjust for user learning speed (lower speed = more time)
        speed_multiplier = 1 / user_learning_speed

        # Historical adjustment from memory
        historical_multiplier = 1.0
        if conversation_memory and AISettings.ENABLE_MEMORY:
            # Analyze past learning patterns
            skill_progression = conversation_memory.memory.get("skill_progression", {})
            if skill_progression:
                completion_rates = []
                for skill_data in skill_progression.values():
                    if len(skill_data) >= 2:
                        # Calculate weeks between first and last assessment
                        first_date = skill_data[0]["timestamp"]
                        last_date = skill_data[-1]["timestamp"]
                        # Simplified: assume consistent improvement
                        weeks_taken = max(1, len(skill_data) // 2)  # Rough estimate
                        target_improvement = skill_data[-1]["score"] - skill_data[0]["score"]
                        if target_improvement > 0:
                            weeks_per_10_points = weeks_taken / (target_improvement / 10)
                            completion_rates.append(weeks_per_10_points)

                if completion_rates:
                    avg_weeks_per_10 = sum(completion_rates) / len(completion_rates)
                    historical_multiplier = avg_weeks_per_10 / 1.0  # Normalize to base rate

        estimated_weeks = int(np.ceil(
            base_weeks * difficulty_multiplier * speed_multiplier * historical_multiplier
        ))
        estimated_weeks = max(1, min(estimated_weeks, 52))  # Cap at 1 year

        # Quality evaluation
        confidence = LearningOptimizer._evaluate_duration_confidence(
            gap, user_learning_speed, skill_importance, bool(conversation_memory)
        )

        return {
            "estimated_weeks": estimated_weeks,
            "confidence": confidence,
            "factors": {
                "base_weeks": base_weeks,
                "difficulty_multiplier": difficulty_multiplier,
                "speed_multiplier": speed_multiplier,
                "historical_multiplier": historical_multiplier
            },
            "method_used": "phase_3a_enhanced" if AISettings.ENABLE_MEMORY else "basic"
        }

    @staticmethod
    def detect_parallel_learning(
        skill_dependencies: Dict[int, List[int]],
        skill_importance: Dict[int, float],
        skill_descriptions: Optional[Dict[int, str]] = None
    ) -> Dict[str, Any]:
        """
        Detect skills that can be learned in parallel.
        Enhanced with similarity analysis and evaluation.
        """
        parallel_groups = []
        processed = set()
        evaluation_metrics = []

        for skill_id, deps in skill_dependencies.items():
            if skill_id in processed:
                continue

            # Find skills with no unprocessed dependencies
            group = []
            for sid, skill_deps in skill_dependencies.items():
                if sid not in processed and not any(d in processed for d in skill_deps):
                    group.append(sid)

            if group:
                # Enhanced sorting: consider importance and similarity
                if skill_descriptions and AISettings.ENABLE_RAG:
                    group = LearningOptimizer._optimize_parallel_group(
                        group, skill_descriptions, skill_importance
                    )
                else:
                    # Sort by importance (higher first)
                    group.sort(key=lambda x: skill_importance.get(x, 1), reverse=True)

                parallel_groups.append(group)
                processed.update(group)

                # Evaluate group quality
                group_quality = LearningOptimizer._evaluate_parallel_group(group, skill_importance)
                evaluation_metrics.append(group_quality)

        return {
            "parallel_groups": parallel_groups,
            "total_groups": len(parallel_groups),
            "evaluation_metrics": evaluation_metrics,
            "method_used": "embeddings_enhanced" if skill_descriptions and AISettings.ENABLE_RAG else "basic"
        }

    @staticmethod
    def _optimize_parallel_group(
        group: List[int],
        skill_descriptions: Dict[int, str],
        skill_importance: Dict[int, float]
    ) -> List[int]:
        """Optimize parallel group using similarity analysis."""
        if len(group) <= 1:
            return group

        # Calculate pairwise similarities
        descriptions = [skill_descriptions.get(sid, "") for sid in group]
        similarity_matrix = {}

        for i, sid1 in enumerate(group):
            for j, sid2 in enumerate(group):
                if i < j:
                    similarities = SkillSimilarity.compute_similarity(
                        [descriptions[j]], descriptions[i], top_n=1
                    )
                    if similarities:
                        similarity_matrix[(sid1, sid2)] = similarities[0]["similarity"]

        # Sort by combined score: importance + diversity bonus
        def combined_score(sid):
            importance = skill_importance.get(sid, 1)
            # Diversity bonus: higher if dissimilar to already selected skills
            diversity_bonus = 0
            if similarity_matrix:
                avg_similarity = np.mean([
                    sim for (s1, s2), sim in similarity_matrix.items()
                    if s1 == sid or s2 == sid
                ])
                diversity_bonus = (1 - avg_similarity) * 0.2  # 20% bonus for diversity
            return importance + diversity_bonus

        group.sort(key=combined_score, reverse=True)
        return group

    @staticmethod
    def rank_resources(
        resources: List[Dict[str, Any]],
        user_history: Dict[str, Any],
        skill_gap: float,
        conversation_memory: Optional[ConversationMemory] = None
    ) -> Dict[str, Any]:
        """
        Rank learning resources based on multiple factors.
        Enhanced with memory integration and evaluation.
        """
        ranked_resources = []
        ranking_factors = []

        for resource in resources:
            score = 0
            factors = {}

            # Difficulty match (prefer resources matching skill gap)
            difficulty_match = abs(resource.get("difficulty", 5) - (skill_gap / 25)) / 5
            difficulty_score = (1 - difficulty_match) * 0.4
            score += difficulty_score
            factors["difficulty_match"] = difficulty_score

            # User history match (prefer familiar formats)
            preferred_formats = user_history.get("preferred_formats", [])
            format_bonus = 0.2 if resource.get("format") in preferred_formats else 0
            score += format_bonus
            factors["format_preference"] = format_bonus

            # Rating and relevance
            rating = resource.get("rating", 3) / 5  # Normalize to 0-1
            relevance = resource.get("relevance", 0.5)
            rating_score = rating * 0.2
            relevance_score = relevance * 0.2
            score += rating_score + relevance_score
            factors["rating"] = rating_score
            factors["relevance"] = relevance_score

            # Memory-based personalization
            memory_bonus = 0
            if conversation_memory and AISettings.ENABLE_MEMORY:
                memory_bonus = LearningOptimizer._calculate_memory_bonus(
                    resource, conversation_memory
                )
                score += memory_bonus
                factors["memory_personalization"] = memory_bonus

            resource_copy = resource.copy()
            resource_copy["ranking_score"] = score
            resource_copy["ranking_factors"] = factors
            ranked_resources.append(resource_copy)
            ranking_factors.append(factors)

        # Sort by score descending
        ranked_resources.sort(key=lambda x: x["ranking_score"], reverse=True)

        # Evaluate ranking quality
        quality_evaluation = AIQualityMetrics.evaluate_ai_response(
            f"Ranking resources for skill gap of {skill_gap}",
            f"Top resource: {ranked_resources[0]['title'] if ranked_resources else 'None'}",
            [],  # No retrieved docs
            user_feedback=None
        )

        return {
            "ranked_resources": ranked_resources,
            "ranking_factors": ranking_factors,
            "quality_evaluation": quality_evaluation,
            "method_used": "phase_3a_enhanced" if conversation_memory else "basic"
        }

    @staticmethod
    def _calculate_memory_bonus(
        resource: Dict[str, Any],
        conversation_memory: ConversationMemory
    ) -> float:
        """Calculate personalization bonus based on conversation memory."""
        bonus = 0

        # Check if user has shown interest in similar topics
        conversation_history = conversation_memory.memory.get("conversation_history", [])
        resource_keywords = set((resource.get("title", "") + " " + resource.get("description", "")).lower().split())

        for conv in conversation_history[-10:]:  # Last 10 conversations
            query_keywords = set(conv.get("user_query", "").lower().split())
            overlap = len(resource_keywords.intersection(query_keywords))
            if overlap > 0:
                bonus += 0.1 * overlap  # Small bonus for each overlapping keyword

        return min(bonus, 0.5)  # Cap at 0.5

    @staticmethod
    def optimize_dependency_graph(
        skill_ids: List[int],
        dependencies: Dict[int, List[int]],
        importance_weights: Dict[int, float],
        skill_descriptions: Optional[Dict[int, str]] = None
    ) -> Dict[str, Any]:
        """
        Optimize the learning dependency graph for better flow.
        Enhanced with similarity analysis and evaluation.
        """
        # Calculate importance-weighted topological order
        in_degree = {sid: 0 for sid in skill_ids}
        for deps in dependencies.values():
            for dep in deps:
                if dep in in_degree:
                    in_degree[dep] += 1

        # Priority queue with importance weighting
        queue = [sid for sid in skill_ids if in_degree[sid] == 0]
        queue.sort(key=lambda x: importance_weights.get(x, 1), reverse=True)

        optimized_order = []
        optimization_steps = []

        while queue:
            current = queue.pop(0)
            optimized_order.append(current)

            # Update in-degrees
            for sid in skill_ids:
                if current in dependencies.get(sid, []):
                    in_degree[sid] -= 1
                    if in_degree[sid] == 0:
                        queue.append(sid)

            # Enhanced sorting with similarity consideration
            if skill_descriptions and AISettings.ENABLE_RAG:
                queue = LearningOptimizer._sort_queue_with_similarity(
                    queue, optimized_order, skill_descriptions
                )
            else:
                # Re-sort queue by importance
                queue.sort(key=lambda x: importance_weights.get(x, 1), reverse=True)

            optimization_steps.append({
                "step": len(optimized_order),
                "selected_skill": current,
                "queue_size": len(queue),
                "reason": "importance_weighted" if not skill_descriptions else "similarity_optimized"
            })

        parallel_groups_result = LearningOptimizer.detect_parallel_learning(
            dependencies, importance_weights, skill_descriptions
        )

        # Quality evaluation
        quality_eval = LearningOptimizer._evaluate_optimization_quality(
            optimized_order, dependencies, importance_weights
        )

        return {
            "optimized_order": optimized_order,
            "parallel_groups": parallel_groups_result["parallel_groups"],
            "optimization_steps": optimization_steps,
            "quality_evaluation": quality_eval,
            "method_used": "phase_3a_enhanced" if skill_descriptions else "basic"
        }

    @staticmethod
    def _sort_queue_with_similarity(
        queue: List[int],
        optimized: List[int],
        skill_descriptions: Dict[int, str]
    ) -> List[int]:
        """Sort queue considering similarity to already optimized skills."""
        if not optimized or not queue:
            return queue

        def similarity_score(sid):
            if sid not in skill_descriptions:
                return 0

            # Calculate average similarity to optimized skills
            similarities = []
            target_desc = skill_descriptions[sid]

            for opt_sid in optimized[-3:]:  # Consider last 3 optimized skills
                if opt_sid in skill_descriptions:
                    sim_result = SkillSimilarity.compute_similarity(
                        [skill_descriptions[opt_sid]], target_desc, top_n=1
                    )
                    if sim_result:
                        similarities.append(sim_result[0]["similarity"])

            return sum(similarities) / len(similarities) if similarities else 0

        # Sort by similarity (lower similarity first for diversity)
        queue.sort(key=lambda x: (similarity_score(x), -len(skill_descriptions.get(x, ""))))
        return queue

    @staticmethod
    def _evaluate_duration_confidence(
        gap: float,
        learning_speed: float,
        importance: float,
        has_memory: bool
    ) -> float:
        """Evaluate confidence in duration estimation."""
        confidence = 0.6  # Base confidence

        # Higher confidence for smaller gaps
        if gap <= 25:
            confidence += 0.2
        elif gap <= 50:
            confidence += 0.1

        # Higher confidence for normal learning speeds
        if 0.5 <= learning_speed <= 1.5:
            confidence += 0.1

        # Bonus for memory data
        if has_memory:
            confidence += 0.1

        return min(confidence, 1.0)

    @staticmethod
    def _evaluate_parallel_group(
        group: List[int],
        importance_weights: Dict[int, float]
    ) -> Dict[str, Any]:
        """Evaluate quality of a parallel learning group."""
        if not group:
            return {"quality_score": 0, "reason": "empty_group"}

        avg_importance = sum(importance_weights.get(sid, 1) for sid in group) / len(group)
        group_size = len(group)

        # Prefer groups of 2-4 skills with balanced importance
        size_score = 1.0 if 2 <= group_size <= 4 else 0.5
        importance_score = min(avg_importance, 2.0) / 2.0  # Normalize

        quality_score = (size_score + importance_score) / 2

        return {
            "quality_score": quality_score,
            "group_size": group_size,
            "avg_importance": avg_importance,
            "size_score": size_score,
            "importance_score": importance_score
        }

    @staticmethod
    def _evaluate_optimization_quality(
        optimized_order: List[int],
        dependencies: Dict[int, List[int]],
        importance_weights: Dict[int, float]
    ) -> Dict[str, Any]:
        """Evaluate the quality of the optimization result."""
        if not optimized_order:
            return {"overall_quality": 0, "reason": "empty_order"}

        # Check if order respects dependencies
        dependency_violations = 0
        position_map = {skill: i for i, skill in enumerate(optimized_order)}

        for skill, deps in dependencies.items():
            if skill in position_map:
                skill_pos = position_map[skill]
                for dep in deps:
                    if dep in position_map and position_map[dep] > skill_pos:
                        dependency_violations += 1

        # Calculate importance flow (higher importance skills first)
        importance_flow = []
        for i, skill in enumerate(optimized_order):
            importance = importance_weights.get(skill, 1)
            # Expect higher importance early in the order
            expected_importance = max(1, 3 - i * 0.5)  # Decreasing expectation
            flow_score = min(importance / expected_importance, 2.0)
            importance_flow.append(flow_score)

        avg_importance_flow = sum(importance_flow) / len(importance_flow)

        dependency_score = 1.0 - (dependency_violations / max(1, len(dependencies)))
        flow_score = avg_importance_flow / 2.0  # Normalize

        overall_quality = (dependency_score + flow_score) / 2

        return {
            "overall_quality": overall_quality,
            "dependency_score": dependency_score,
            "flow_score": flow_score,
            "dependency_violations": dependency_violations,
            "avg_importance_flow": avg_importance_flow
        }
