"""
RAG Metrics for evaluating retrieval and generation quality.
Includes relevance, grounding, and retrieval performance metrics.
"""

from typing import List, Dict, Any, Tuple
import re
from collections import Counter


class RAGMetrics:
    """
    Metrics for evaluating RAG system performance.
    Measures retrieval relevance, answer grounding, and overall quality.
    """

    @staticmethod
    def calculate_relevance_score(query: str, retrieved_docs: List[str]) -> float:
        """
        Calculate relevance score between query and retrieved documents.
        Returns score between 0-1, where 1 is perfectly relevant.
        """
        if not retrieved_docs:
            return 0.0

        query_words = set(RAGMetrics._preprocess_text(query).split())
        total_score = 0.0

        for doc in retrieved_docs:
            doc_words = set(RAGMetrics._preprocess_text(doc).split())
            intersection = query_words.intersection(doc_words)
            union = query_words.union(doc_words)

            if union:
                jaccard_similarity = len(intersection) / len(union)
                total_score += jaccard_similarity

        return min(total_score / len(retrieved_docs), 1.0)

    @staticmethod
    def calculate_grounding_score(answer: str, retrieved_docs: List[str]) -> float:
        """
        Calculate how well the answer is grounded in the retrieved documents.
        Returns score between 0-1, where 1 is fully grounded.
        """
        if not retrieved_docs or not answer:
            return 0.0

        answer_words = set(RAGMetrics._preprocess_text(answer).split())
        total_grounding = 0.0

        for doc in retrieved_docs:
            doc_words = set(RAGMetrics._preprocess_text(doc).split())
            intersection = answer_words.intersection(doc_words)

            if answer_words:
                grounding_ratio = len(intersection) / len(answer_words)
                total_grounding += grounding_ratio

        return min(total_grounding / len(retrieved_docs), 1.0)

    @staticmethod
    def calculate_answer_relevance(query: str, answer: str) -> float:
        """
        Calculate semantic relevance between query and answer.
        Returns score between 0-1.
        """
        query_words = set(RAGMetrics._preprocess_text(query).split())
        answer_words = set(RAGMetrics._preprocess_text(answer).split())

        if not query_words or not answer_words:
            return 0.0

        intersection = query_words.intersection(answer_words)
        union = query_words.union(answer_words)

        return len(intersection) / len(union) if union else 0.0

    @staticmethod
    def calculate_retrieval_precision(query: str, retrieved_docs: List[str], relevant_docs: List[str] = None) -> float:
        """
        Calculate precision of retrieved documents.
        If relevant_docs is provided, uses it as ground truth.
        Otherwise, uses heuristic based on query-document overlap.
        """
        if not retrieved_docs:
            return 0.0

        if relevant_docs:
            # Ground truth available
            retrieved_set = set(retrieved_docs)
            relevant_set = set(relevant_docs)
            true_positives = len(retrieved_set.intersection(relevant_set))
            return true_positives / len(retrieved_docs) if retrieved_docs else 0.0

        # Heuristic: consider docs with high query overlap as relevant
        query_words = set(RAGMetrics._preprocess_text(query).split())
        relevant_count = 0

        for doc in retrieved_docs:
            doc_words = set(RAGMetrics._preprocess_text(doc).split())
            overlap = len(query_words.intersection(doc_words))
            if overlap >= len(query_words) * 0.3:  # At least 30% overlap
                relevant_count += 1

        return relevant_count / len(retrieved_docs)

    @staticmethod
    def calculate_retrieval_recall(query: str, retrieved_docs: List[str], all_docs: List[str] = None) -> float:
        """
        Calculate recall of retrieved documents.
        Requires all_docs to be provided for meaningful calculation.
        """
        if not all_docs or not retrieved_docs:
            return 0.0

        # Heuristic: consider all docs with query overlap as relevant
        query_words = set(RAGMetrics._preprocess_text(query).split())
        relevant_docs = []

        for doc in all_docs:
            doc_words = set(RAGMetrics._preprocess_text(doc).split())
            overlap = len(query_words.intersection(doc_words))
            if overlap >= len(query_words) * 0.3:
                relevant_docs.append(doc)

        if not relevant_docs:
            return 1.0  # No relevant docs, so recall is perfect (or undefined, but we return 1)

        retrieved_set = set(retrieved_docs)
        relevant_set = set(relevant_docs)
        true_positives = len(retrieved_set.intersection(relevant_set))

        return true_positives / len(relevant_docs)

    @staticmethod
    def calculate_f1_score(precision: float, recall: float) -> float:
        """Calculate F1 score from precision and recall."""
        if precision + recall == 0:
            return 0.0
        return 2 * (precision * recall) / (precision + recall)

    @staticmethod
    def evaluate_rag_performance(
        query: str,
        answer: str,
        retrieved_docs: List[str],
        relevant_docs: List[str] = None,
        all_docs: List[str] = None
    ) -> Dict[str, float]:
        """
        Comprehensive RAG evaluation.
        Returns dictionary with various metrics.
        """
        metrics = {}

        # Relevance metrics
        metrics['query_doc_relevance'] = RAGMetrics.calculate_relevance_score(query, retrieved_docs)
        metrics['answer_relevance'] = RAGMetrics.calculate_answer_relevance(query, answer)
        metrics['grounding_score'] = RAGMetrics.calculate_grounding_score(answer, retrieved_docs)

        # Retrieval metrics
        metrics['retrieval_precision'] = RAGMetrics.calculate_retrieval_precision(query, retrieved_docs, relevant_docs)
        metrics['retrieval_recall'] = RAGMetrics.calculate_retrieval_recall(query, retrieved_docs, all_docs)
        metrics['retrieval_f1'] = RAGMetrics.calculate_f1_score(
            metrics['retrieval_precision'],
            metrics['retrieval_recall']
        )

        # Overall score (weighted average)
        metrics['overall_score'] = (
            0.3 * metrics['query_doc_relevance'] +
            0.3 * metrics['answer_relevance'] +
            0.2 * metrics['grounding_score'] +
            0.2 * metrics['retrieval_f1']
        )

        return metrics

    @staticmethod
    def _preprocess_text(text: str) -> str:
        """Preprocess text for metric calculations."""
        # Convert to lowercase
        text = text.lower()
        # Remove punctuation and special characters
        text = re.sub(r'[^\w\s]', '', text)
        # Remove extra whitespace
        text = ' '.join(text.split())
        return text

    @staticmethod
    def get_metric_summary(metrics: Dict[str, float]) -> str:
        """Get a human-readable summary of metrics."""
        summary = "RAG Performance Metrics:\n"
        for metric, value in metrics.items():
            summary += f"  {metric.replace('_', ' ').title()}: {value:.3f}\n"
        return summary
