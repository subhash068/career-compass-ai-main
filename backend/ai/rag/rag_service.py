from typing import Dict, Any, Optional, List
from ai.embeddings.embedding_service import EmbeddingService
from ai.llm.llm_router import LLMRouter
from ai.config.ai_settings import AISettings
from ai.rag.prompt_templates import PromptTemplates
from ai.evaluation.rag_metrics import RAGMetrics
from ai.evaluation.ai_quality import AIQualityMetrics


class RAGService:
    """
    Enhanced RAG service with multiple LLMs, evaluation, and structured responses.
    Phase 3A: Advanced retrieval, prompt engineering, and quality assessment.
    """

    def __init__(self):
        self.llm_router = LLMRouter()

    @staticmethod
    def answer(
        query: str,
        vector_store,
        structured_context: Dict[str, Any],
        intent: str = "general",
        conversation_memory=None
    ) -> Dict[str, Any]:
        """
        Generate RAG-enhanced answer with evaluation and metadata.
        """
        # Enhanced retrieval
        retrieval_result = RAGService._retrieve_knowledge(query, vector_store, intent)

        if not retrieval_result["docs"]:
            # Fallback response
            fallback_answer = PromptTemplates.get_fallback_prompt(query)
            return {
                "answer": fallback_answer,
                "method": "fallback",
                "confidence": 0.0,
                "retrieved_docs": 0
            }

        # Generate answer using LLM router
        answer_result = RAGService._generate_answer(
            query, retrieval_result, structured_context, intent, conversation_memory
        )

        # Evaluate response quality
        quality_eval = RAGService._evaluate_rag_response(
            query, answer_result["answer"], retrieval_result["docs"]
        )

        return {
            "answer": answer_result["answer"],
            "method": "rag_enhanced",
            "confidence": answer_result["confidence"],
            "retrieved_docs": len(retrieval_result["docs"]),
            "quality_evaluation": quality_eval,
            "retrieval_metrics": retrieval_result["metrics"],
            "model_used": answer_result["model_used"]
        }

    @staticmethod
    def _retrieve_knowledge(
        query: str,
        vector_store,
        intent: str
    ) -> Dict[str, Any]:
        """Enhanced knowledge retrieval with filtering and evaluation."""
        # Generate query embedding
        query_emb = EmbeddingService.embed(query)

        # Adjust retrieval parameters based on intent
        k = RAGService._get_retrieval_k(intent)
        threshold = RAGService._get_retrieval_threshold(intent)

        # Retrieve documents
        docs = vector_store.search(query_emb, k=k)

        # Filter by relevance threshold
        filtered_docs = [doc for doc in docs if doc.get("similarity", 0) >= threshold]

        # Evaluate retrieval quality
        retrieval_metrics = RAGMetrics.evaluate_rag_performance(
            query=query,
            answer="",  # Will be filled later
            retrieved_docs=[doc.get("content", "") for doc in filtered_docs],
            all_docs=[doc.get("content", "") for doc in docs]
        )

        return {
            "docs": filtered_docs,
            "metrics": retrieval_metrics
        }

    @staticmethod
    def _generate_answer(
        query: str,
        retrieval_result: Dict[str, Any],
        structured_context: Dict[str, Any],
        intent: str,
        conversation_memory
    ) -> Dict[str, Any]:
        """Generate answer using LLM with enhanced prompting."""
        docs = retrieval_result["docs"]

        # Prepare knowledge context
        knowledge = RAGService._format_knowledge_context(docs)

        # Get appropriate prompt template
        system_prompt = PromptTemplates.get_system_prompt(intent, structured_context)
        structured_prompt = PromptTemplates.get_structured_prompt(intent, {
            **structured_context,
            "query": query,
            "knowledge": knowledge
        })

        # Combine prompts
        full_prompt = f"{system_prompt}\n\n{structured_prompt}"

        # Generate response using LLM router
        try:
            answer = LLMRouter.llm_router.generate_response(full_prompt)

            # Estimate confidence based on retrieval quality and LLM response
            confidence = RAGService._estimate_answer_confidence(
                retrieval_result["metrics"], answer, docs
            )

            return {
                "answer": answer,
                "confidence": confidence,
                "model_used": LLMRouter.llm_router.get_current_provider()
            }

        except Exception as e:
            # Fallback to basic response
            return {
                "answer": f"I apologize, but I encountered an error generating a response. Error: {str(e)}",
                "confidence": 0.0,
                "model_used": "error_fallback"
            }

    @staticmethod
    def _format_knowledge_context(docs: List[Dict[str, Any]]) -> str:
        """Format retrieved documents into coherent knowledge context."""
        if not docs:
            return "No relevant knowledge found."

        # Group by type and format
        knowledge_sections = []
        docs_by_type = {}

        for doc in docs:
            doc_type = doc.get("type", "general")
            if doc_type not in docs_by_type:
                docs_by_type[doc_type] = []
            docs_by_type[doc_type].append(doc)

        for doc_type, type_docs in docs_by_type.items():
            section_title = doc_type.title()
            section_content = "\n".join(
                f"- {doc.get('content', '')} (relevance: {doc.get('similarity', 0):.2f})"
                for doc in type_docs[:3]  # Limit to top 3 per type
            )
            knowledge_sections.append(f"{section_title}:\n{section_content}")

        return "\n\n".join(knowledge_sections)

    @staticmethod
    def _get_retrieval_k(intent: str) -> int:
        """Get optimal retrieval count based on intent."""
        intent_k_map = {
            "career": 8,      # More context for career decisions
            "learning": 6,    # Learning paths need good coverage
            "skills": 5,      # Skill analysis needs focused info
            "assessment": 4,  # Assessment queries are specific
            "general": 5      # Default
        }
        return intent_k_map.get(intent, 5)

    @staticmethod
    def _get_retrieval_threshold(intent: str) -> float:
        """Get relevance threshold based on intent."""
        intent_threshold_map = {
            "career": 0.6,      # Higher threshold for important decisions
            "learning": 0.5,    # Moderate threshold for learning
            "skills": 0.4,      # Lower threshold for skill matching
            "assessment": 0.7,  # High threshold for assessments
            "general": 0.5      # Default
        }
        return intent_threshold_map.get(intent, 0.5)

    @staticmethod
    def _estimate_answer_confidence(
        retrieval_metrics: Dict[str, float],
        answer: str,
        docs: List[Dict[str, Any]]
    ) -> float:
        """Estimate confidence in the generated answer."""
        # Base confidence from retrieval quality
        retrieval_confidence = retrieval_metrics.get("overall_score", 0.5)

        # Answer quality factors
        answer_length = len(answer.split())
        length_confidence = 1.0 if 20 <= answer_length <= 200 else 0.7

        # Grounding confidence
        grounding_score = RAGMetrics.calculate_grounding_score(answer, [doc.get("content", "") for doc in docs])

        # Combine factors
        confidence = (
            retrieval_confidence * 0.4 +
            length_confidence * 0.3 +
            grounding_score * 0.3
        )

        return min(max(confidence, 0.0), 1.0)

    @staticmethod
    def _evaluate_rag_response(
        query: str,
        answer: str,
        retrieved_docs: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Comprehensive evaluation of RAG response."""
        # RAG metrics
        rag_metrics = RAGMetrics.evaluate_rag_performance(
            query=query,
            answer=answer,
            retrieved_docs=[doc.get("content", "") for doc in retrieved_docs]
        )

        # AI quality metrics
        quality_metrics = AIQualityMetrics.evaluate_ai_response(
            query=query,
            answer=answer,
            retrieved_docs=retrieved_docs
        )

        return {
            "rag_metrics": rag_metrics,
            "quality_metrics": quality_metrics,
            "overall_quality": (rag_metrics.get("overall_score", 0) + quality_metrics.get("overall_quality", 0)) / 2
        }

    # Legacy method for backward compatibility
    @staticmethod
    def answer_legacy(query: str, vector_store, structured_context: dict) -> str:
        """Legacy method for backward compatibility."""
        result = RAGService.answer(query, vector_store, structured_context)
        return result["answer"]
