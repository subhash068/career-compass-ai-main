"""
AI Quality Metrics for hallucination detection and answer quality assessment.
"""

from typing import Dict, Any, List, Tuple
import re
from collections import Counter
from ai.evaluation.rag_metrics import RAGMetrics


class AIQualityMetrics:
    """
    Metrics for evaluating AI-generated content quality.
    Includes hallucination detection, answer quality, and user feedback analysis.
    """

    @staticmethod
    def detect_hallucination(answer: str, retrieved_docs: List[str], threshold: float = 0.3) -> Tuple[bool, float]:
        """
        Detect potential hallucinations in the answer.
        Returns (is_hallucinated, confidence_score).
        Lower confidence_score indicates higher hallucination risk.
        """
        if not retrieved_docs:
            return True, 0.0  # No grounding docs = high hallucination risk

        grounding_score = RAGMetrics.calculate_grounding_score(answer, retrieved_docs)

        # Simple heuristic: if grounding is below threshold, flag as hallucination
        is_hallucinated = grounding_score < threshold

        return is_hallucinated, grounding_score

    @staticmethod
    def calculate_answer_quality(answer: str, query: str) -> Dict[str, float]:
        """
        Calculate various quality metrics for the answer.
        Returns dictionary with quality scores.
        """
        metrics = {}

        # Length appropriateness (not too short, not too long)
        word_count = len(answer.split())
        if 10 <= word_count <= 500:
            metrics['length_score'] = 1.0
        elif word_count < 10:
            metrics['length_score'] = word_count / 10.0
        else:
            metrics['length_score'] = max(0.1, 1.0 - (word_count - 500) / 500.0)

        # Coherence score (basic heuristic based on sentence structure)
        sentences = re.split(r'[.!?]+', answer)
        sentences = [s.strip() for s in sentences if s.strip()]
        if sentences:
            avg_sentence_length = sum(len(s.split()) for s in sentences) / len(sentences)
            # Ideal sentence length around 15-25 words
            if 15 <= avg_sentence_length <= 25:
                metrics['coherence_score'] = 1.0
            else:
                metrics['coherence_score'] = max(0.1, 1.0 - abs(avg_sentence_length - 20) / 20.0)
        else:
            metrics['coherence_score'] = 0.1

        # Informativeness (avoid generic phrases)
        generic_phrases = ["i don't know", "i'm not sure", "maybe", "perhaps", "it depends"]
        generic_count = sum(1 for phrase in generic_phrases if phrase.lower() in answer.lower())
        metrics['informativeness_score'] = max(0.1, 1.0 - generic_count * 0.2)

        # Relevance to query
        metrics['relevance_score'] = RAGMetrics.calculate_answer_relevance(query, answer)

        # Overall quality score
        weights = {
            'length_score': 0.2,
            'coherence_score': 0.2,
            'informativeness_score': 0.3,
            'relevance_score': 0.3
        }

        metrics['overall_quality'] = sum(metrics[k] * weights[k] for k in weights.keys())

        return metrics

    @staticmethod
    def analyze_user_feedback(feedback_scores: List[int], comments: List[str] = None) -> Dict[str, Any]:
        """
        Analyze user feedback scores and comments.
        Returns aggregated feedback metrics.
        """
        if not feedback_scores:
            return {"average_score": 0.0, "total_feedbacks": 0}

        metrics = {
            "average_score": sum(feedback_scores) / len(feedback_scores),
            "total_feedbacks": len(feedback_scores),
            "score_distribution": Counter(feedback_scores)
        }

        # Sentiment analysis on comments (basic keyword-based)
        if comments:
            positive_keywords = ["good", "great", "excellent", "helpful", "accurate", "useful"]
            negative_keywords = ["bad", "wrong", "unhelpful", "confusing", "inaccurate", "useless"]

            positive_count = 0
            negative_count = 0

            for comment in comments:
                comment_lower = comment.lower()
                if any(kw in comment_lower for kw in positive_keywords):
                    positive_count += 1
                if any(kw in comment_lower for kw in negative_keywords):
                    negative_count += 1

            total_comments = len(comments)
            metrics["sentiment_positive_ratio"] = positive_count / total_comments if total_comments > 0 else 0.0
            metrics["sentiment_negative_ratio"] = negative_count / total_comments if total_comments > 0 else 0.0

        return metrics

    @staticmethod
    def calculate_hallucination_rate(answers: List[str], retrieved_docs_list: List[List[str]]) -> float:
        """
        Calculate hallucination rate across multiple answers.
        Returns percentage of answers flagged as hallucinations.
        """
        if not answers or len(answers) != len(retrieved_docs_list):
            return 0.0

        hallucinated_count = 0
        for answer, docs in zip(answers, retrieved_docs_list):
            is_hallucinated, _ = AIQualityMetrics.detect_hallucination(answer, docs)
            if is_hallucinated:
                hallucinated_count += 1

        return hallucinated_count / len(answers)

    @staticmethod
    def evaluate_ai_response(
        query: str,
        answer: str,
        retrieved_docs: List[str],
        user_feedback: int = None,
        user_comment: str = None
    ) -> Dict[str, Any]:
        """
        Comprehensive evaluation of an AI response.
        Returns all quality metrics.
        """
        evaluation = {}

        # Hallucination detection
        is_hallucinated, grounding_confidence = AIQualityMetrics.detect_hallucination(answer, retrieved_docs)
        evaluation['is_hallucinated'] = is_hallucinated
        evaluation['grounding_confidence'] = grounding_confidence

        # Answer quality
        quality_metrics = AIQualityMetrics.calculate_answer_quality(answer, query)
        evaluation.update(quality_metrics)

        # User feedback (if provided)
        if user_feedback is not None:
            evaluation['user_feedback_score'] = user_feedback
            evaluation['user_satisfaction'] = user_feedback / 5.0  # Assuming 1-5 scale

        if user_comment:
            evaluation['user_comment'] = user_comment
            # Basic sentiment
            positive_words = ["good", "great", "helpful"]
            negative_words = ["bad", "wrong", "unhelpful"]
            comment_lower = user_comment.lower()
            if any(w in comment_lower for w in positive_words):
                evaluation['user_sentiment'] = "positive"
            elif any(w in comment_lower for w in negative_words):
                evaluation['user_sentiment'] = "negative"
            else:
                evaluation['user_sentiment'] = "neutral"

        # Overall assessment
        evaluation['passes_quality_check'] = (
            not is_hallucinated and
            quality_metrics.get('overall_quality', 0) > 0.6 and
            (user_feedback is None or user_feedback >= 3)
        )

        return evaluation

    @staticmethod
    def get_quality_summary(evaluation: Dict[str, Any]) -> str:
        """Get a human-readable summary of quality evaluation."""
        summary = "AI Response Quality Evaluation:\n"

        if evaluation.get('is_hallucinated'):
            summary += "  ⚠️  Potential hallucination detected\n"
        else:
            summary += "  ✅ No hallucination detected\n"

        quality = evaluation.get('overall_quality', 0)
        summary += f"  Quality Score: {quality:.3f} "
        if quality > 0.8:
            summary += "(Excellent)\n"
        elif quality > 0.6:
            summary += "(Good)\n"
        elif quality > 0.4:
            summary += "(Fair)\n"
        else:
            summary += "(Poor)\n"

        if 'user_feedback_score' in evaluation:
            feedback = evaluation['user_feedback_score']
            summary += f"  User Feedback: {feedback}/5\n"

        passes = evaluation.get('passes_quality_check', False)
        summary += f"  Passes Quality Check: {'✅ Yes' if passes else '❌ No'}\n"

        return summary
