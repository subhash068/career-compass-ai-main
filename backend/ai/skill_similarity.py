from typing import List, Dict, Any, Optional
import numpy as np
from ai.embeddings.embedding_service import EmbeddingService
from ai.config.ai_settings import AISettings
from ai.evaluation.rag_metrics import RAGMetrics




class SkillSimilarity:
    """
    Handles semantic similarity between skills using embeddings.
    Phase 3A: Advanced embeddings with configurable models and evaluation.
    """

    @staticmethod
    def compute_similarity(
        skill_descriptions: List[str],
        target_description: str,
        top_n: int = 5,
        use_embeddings: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Compute similarity scores between target skill and all skills.
        Uses embeddings by default, falls back to TF-IDF if disabled.
        Returns list of dicts with index, similarity score, and metadata.
        """
        if not skill_descriptions or not target_description:
            return []

        if len(skill_descriptions) < 2:
            return []

        if use_embeddings and AISettings.ENABLE_RAG:
            return SkillSimilarity._compute_embedding_similarity(
                skill_descriptions, target_description, top_n
            )
        else:
            return SkillSimilarity._compute_tfidf_similarity(
                skill_descriptions, target_description, top_n
            )

    @staticmethod
    def _compute_embedding_similarity(
        skill_descriptions: List[str],
        target_description: str,
        top_n: int
    ) -> List[Dict[str, Any]]:
        """Compute similarity using sentence embeddings."""
        # Embed all descriptions
        all_texts = skill_descriptions + [target_description]
        embeddings = [EmbeddingService.embed(text) for text in all_texts]

        # Convert to numpy arrays
        embeddings_array = np.array(embeddings)
        target_emb = embeddings_array[-1:]
        skill_embs = embeddings_array[:-1]

        # Compute cosine similarities
        similarities = RAGMetrics.calculate_relevance_score(target_description, skill_descriptions)

        # For more precise calculation, compute pairwise similarities
        from sklearn.metrics.pairwise import cosine_similarity
        similarity_matrix = cosine_similarity(target_emb, skill_embs)[0]

        # Get top results
        top_indices = np.argsort(similarity_matrix)[-top_n:][::-1]

        results = []
        for idx in top_indices:
            score = float(similarity_matrix[idx])
            threshold = AISettings.RAG_SIMILARITY_THRESHOLD

            if score >= threshold:
                results.append({
                    "index": int(idx),
                    "similarity": score,
                    "skill_description": skill_descriptions[idx],
                    "method": "embeddings",
                    "confidence": min(score * 1.2, 1.0)  # Boost confidence for embeddings
                })

        return results

    @staticmethod
    def _compute_tfidf_similarity(
        skill_descriptions: List[str],
        target_description: str,
        top_n: int
    ) -> List[Dict[str, Any]]:
        """Fallback TF-IDF similarity computation."""
        try:
            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.metrics.pairwise import cosine_similarity

            vectorizer = TfidfVectorizer(stop_words="english")
            tfidf_matrix = vectorizer.fit_transform(
                skill_descriptions + [target_description]
            )

            similarity_scores = cosine_similarity(
                tfidf_matrix[-1:], tfidf_matrix[:-1]
            )[0]

            top_indices = np.argsort(similarity_scores)[-top_n:][::-1]

            results = []
            for idx in top_indices:
                score = float(similarity_scores[idx])
                if score > 0.1:  # Threshold for relevance
                    results.append({
                        "index": int(idx),
                        "similarity": score,
                        "skill_description": skill_descriptions[idx],
                        "method": "tfidf",
                        "confidence": score
                    })

            return results
        except ImportError:
            # If sklearn not available, return empty results
            return []

    @staticmethod
    def find_similar_skills_batch(
        skill_descriptions: List[str],
        target_descriptions: List[str],
        top_n: int = 3
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Compute similarities for multiple target skills efficiently.
        Returns dict mapping target index to list of similar skills.
        """
        results = {}

        for i, target_desc in enumerate(target_descriptions):
            similarities = SkillSimilarity.compute_similarity(
                skill_descriptions, target_desc, top_n
            )
            results[str(i)] = similarities

        return results

    @staticmethod
    def get_similarity_stats(
        skill_descriptions: List[str],
        target_description: str
    ) -> Dict[str, Any]:
        """Get detailed statistics about similarity computation."""
        similarities = SkillSimilarity.compute_similarity(
            skill_descriptions, target_description, top_n=len(skill_descriptions)
        )

        if not similarities:
            return {"error": "No similarities computed"}

        scores = [s["similarity"] for s in similarities]

        return {
            "total_skills": len(skill_descriptions),
            "similar_skills_found": len(similarities),
            "avg_similarity": np.mean(scores),
            "max_similarity": max(scores),
            "min_similarity": min(scores),
            "method_used": similarities[0].get("method", "unknown") if similarities else "unknown"
        }
