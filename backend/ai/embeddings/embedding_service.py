from typing import List, Dict, Any, Optional, Union
import numpy as np
from ai.config.ai_settings import AISettings
from ai.evaluation.ai_quality import AIQualityMetrics


class EmbeddingService:
    """
    Enhanced embedding service with configurable models and evaluation.
    Phase 3A: Supports multiple embedding models and quality assessment.
    """
    _model = None
    _model_name = None

    @staticmethod
    def get_model(model_name: Optional[str] = None):
        """Get or initialize the embedding model."""
        if model_name is None:
            model_name = AISettings.EMBEDDING_MODEL

        if EmbeddingService._model is None or EmbeddingService._model_name != model_name:
            try:
                from sentence_transformers import SentenceTransformer
                EmbeddingService._model = SentenceTransformer(model_name)
                EmbeddingService._model_name = model_name
            except ImportError:
                raise ImportError("sentence-transformers not installed. Install with: pip install sentence-transformers")

        return EmbeddingService._model

    @staticmethod
    def embed(text: Union[str, List[str]]) -> Union[List[float], List[List[float]]]:
        """
        Generate embeddings for text(s).
        Returns list of floats for single text, list of lists for multiple texts.
        """
        if not text or (isinstance(text, list) and len(text) == 0):
            return [] if isinstance(text, list) else []

        model = EmbeddingService.get_model()

        try:
            if isinstance(text, str):
                embedding = model.encode(text, convert_to_numpy=False).tolist()
                return embedding
            else:
                embeddings = model.encode(text, convert_to_numpy=False).tolist()
                return embeddings
        except Exception as e:
            raise RuntimeError(f"Embedding generation failed: {str(e)}")

    @staticmethod
    def embed_with_metadata(
        texts: Union[str, List[str]],
        metadata: Optional[Union[Dict[str, Any], List[Dict[str, Any]]]] = None
    ) -> Dict[str, Any]:
        """
        Generate embeddings with metadata and quality evaluation.
        """
        if isinstance(texts, str):
            texts = [texts]
            if metadata and not isinstance(metadata, list):
                metadata = [metadata]

        embeddings = EmbeddingService.embed(texts)

        result = {
            "embeddings": embeddings,
            "texts": texts,
            "model_used": EmbeddingService._model_name or AISettings.EMBEDDING_MODEL,
            "dimension": len(embeddings[0]) if embeddings else 0
        }

        if metadata:
            result["metadata"] = metadata

        # Quality evaluation
        if len(texts) > 1:
            quality_eval = EmbeddingService._evaluate_embedding_quality(texts, embeddings)
            result["quality_evaluation"] = quality_eval

        return result

    @staticmethod
    def compute_similarity(
        embedding1: List[float],
        embedding2: List[float]
    ) -> float:
        """Compute cosine similarity between two embeddings."""
        if not embedding1 or not embedding2 or len(embedding1) != len(embedding2):
            return 0.0

        # Convert to numpy arrays
        vec1 = np.array(embedding1)
        vec2 = np.array(embedding2)

        # Compute cosine similarity
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)

        if norm1 == 0 or norm2 == 0:
            return 0.0

        return float(dot_product / (norm1 * norm2))

    @staticmethod
    def find_similar_embeddings(
        query_embedding: List[float],
        candidate_embeddings: List[List[float]],
        top_k: int = 5,
        threshold: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """
        Find most similar embeddings to a query embedding.
        """
        if not query_embedding or not candidate_embeddings:
            return []

        if threshold is None:
            threshold = AISettings.RAG_SIMILARITY_THRESHOLD

        similarities = []
        for i, candidate_emb in enumerate(candidate_embeddings):
            similarity = EmbeddingService.compute_similarity(query_embedding, candidate_emb)
            if similarity >= threshold:
                similarities.append({
                    "index": i,
                    "similarity": similarity,
                    "embedding": candidate_emb
                })

        # Sort by similarity descending
        similarities.sort(key=lambda x: x["similarity"], reverse=True)

        return similarities[:top_k]

    @staticmethod
    def batch_embed_and_store(
        texts: List[str],
        vector_store,
        metadata_list: Optional[List[Dict[str, Any]]] = None,
        batch_size: int = 32
    ) -> Dict[str, Any]:
        """
        Embed texts in batches and store in vector store.
        """
        if not texts:
            return {"stored_count": 0, "errors": []}

        if metadata_list and len(metadata_list) != len(texts):
            raise ValueError("metadata_list length must match texts length")

        stored_count = 0
        errors = []

        # Process in batches
        for i in range(0, len(texts), batch_size):
            batch_texts = texts[i:i + batch_size]
            batch_metadata = metadata_list[i:i + batch_size] if metadata_list else None

            try:
                # Embed batch
                embeddings = EmbeddingService.embed(batch_texts)

                # Store each embedding
                for j, embedding in enumerate(embeddings):
                    meta = {}
                    if batch_metadata:
                        meta.update(batch_metadata[j])
                    meta["text"] = batch_texts[j]
                    meta["batch_index"] = i + j

                    vector_store.add(embedding, meta)
                    stored_count += 1

            except Exception as e:
                errors.append({
                    "batch_start": i,
                    "batch_size": len(batch_texts),
                    "error": str(e)
                })

        return {
            "stored_count": stored_count,
            "total_texts": len(texts),
            "errors": errors,
            "success_rate": stored_count / len(texts) if texts else 0
        }

    @staticmethod
    def _evaluate_embedding_quality(
        texts: List[str],
        embeddings: List[List[float]]
    ) -> Dict[str, Any]:
        """Evaluate the quality of generated embeddings."""
        if len(texts) < 2 or len(embeddings) < 2:
            return {"quality_score": 0.5, "reason": "insufficient_data"}

        # Check embedding dimensions
        dimensions = [len(emb) for emb in embeddings]
        if len(set(dimensions)) > 1:
            return {"quality_score": 0.0, "reason": "inconsistent_dimensions"}

        # Check for zero embeddings (failed encoding)
        zero_count = sum(1 for emb in embeddings if all(x == 0 for x in emb))
        if zero_count > 0:
            return {"quality_score": 0.1, "reason": f"{zero_count}_zero_embeddings"}

        # Check embedding norms (should be normalized)
        norms = [np.linalg.norm(emb) for emb in embeddings]
        avg_norm = np.mean(norms)
        norm_consistency = 1 - np.std(norms) / avg_norm  # Lower std is better

        # Semantic coherence check (similar texts should have similar embeddings)
        coherence_score = EmbeddingService._check_semantic_coherence(texts, embeddings)

        # Overall quality score
        quality_score = (norm_consistency * 0.4 + coherence_score * 0.6)
        quality_score = max(0, min(1, quality_score))  # Clamp to [0, 1]

        return {
            "quality_score": quality_score,
            "norm_consistency": norm_consistency,
            "semantic_coherence": coherence_score,
            "avg_norm": avg_norm,
            "dimension": dimensions[0]
        }

    @staticmethod
    def _check_semantic_coherence(texts: List[str], embeddings: List[List[float]]) -> float:
        """Check if semantically similar texts have similar embeddings."""
        if len(texts) < 3:
            return 0.5

        # Simple heuristic: check if similar length texts have similar embeddings
        coherence_pairs = 0
        total_pairs = 0

        for i in range(len(texts)):
            for j in range(i + 1, len(texts)):
                len_diff = abs(len(texts[i].split()) - len(texts[j].split()))
                similarity = EmbeddingService.compute_similarity(embeddings[i], embeddings[j])

                # Texts of similar length should have some similarity
                if len_diff <= 2:  # Similar length
                    total_pairs += 1
                    if similarity > 0.3:  # Reasonable similarity threshold
                        coherence_pairs += 1

        return coherence_pairs / total_pairs if total_pairs > 0 else 0.5

    @staticmethod
    def get_model_info() -> Dict[str, Any]:
        """Get information about the current embedding model."""
        return {
            "model_name": EmbeddingService._model_name or AISettings.EMBEDDING_MODEL,
            "is_loaded": EmbeddingService._model is not None,
            "expected_dimension": AISettings.EMBEDDING_DIMENSION
        }
