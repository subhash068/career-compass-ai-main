from typing import List, Dict, Any, Optional
from ai.embeddings.embedding_service import EmbeddingService
from ai.embeddings.vector_store import VectorStore
from ai.config.ai_settings import AISettings
from ai.evaluation.ai_quality import AIQualityMetrics


class JobIngestor:
    """
    Enhanced job ingestor with chunking, evaluation, and metadata enrichment.
    Phase 3A: Improved text processing and quality assessment.
    """

    def __init__(self, store: VectorStore):
        self.store = store

    def ingest(
        self,
        job_id: int,
        job_description: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Ingest job description with enhanced chunking and evaluation.
        """
        if not job_description or not job_description.strip():
            return {"success": False, "error": "empty_description"}

        # Enhanced chunking
        chunks = self._chunk_job_description(job_description)

        if not chunks:
            return {"success": False, "error": "no_chunks_generated"}

        # Prepare metadata
        base_metadata = {
            "type": "job",
            "job_id": job_id,
            "content_type": "job_description"
        }
        if metadata:
            base_metadata.update(metadata)

        # Ingest chunks
        successful_chunks = 0
        failed_chunks = []

        for i, chunk in enumerate(chunks):
            try:
                # Generate embedding with metadata
                embedding_result = EmbeddingService.embed_with_metadata(
                    chunk,
                    {**base_metadata, "chunk_index": i, "total_chunks": len(chunks)}
                )

                # Add to vector store
                success = self.store.add(embedding_result["embeddings"][0], embedding_result["metadata"][0])
                if success:
                    successful_chunks += 1
                else:
                    failed_chunks.append(i)

            except Exception as e:
                failed_chunks.append(i)

        # Quality evaluation
        quality_eval = self._evaluate_ingestion_quality(job_description, chunks, successful_chunks)

        return {
            "success": successful_chunks > 0,
            "total_chunks": len(chunks),
            "successful_chunks": successful_chunks,
            "failed_chunks": failed_chunks,
            "quality_evaluation": quality_eval,
            "job_id": job_id
        }

    def _chunk_job_description(self, description: str) -> List[str]:
        """
        Enhanced chunking strategy for job descriptions.
        Splits on semantic boundaries while maintaining context.
        """
        # First, split on double newlines (paragraphs)
        paragraphs = [p.strip() for p in description.split("\n\n") if p.strip()]

        chunks = []
        current_chunk = ""
        max_chunk_length = 500  # Characters

        for paragraph in paragraphs:
            # If adding this paragraph would exceed max length, save current chunk
            if len(current_chunk) + len(paragraph) > max_chunk_length and current_chunk:
                chunks.append(current_chunk.strip())
                current_chunk = paragraph
            else:
                # Add paragraph to current chunk
                if current_chunk:
                    current_chunk += "\n\n" + paragraph
                else:
                    current_chunk = paragraph

        # Add final chunk
        if current_chunk:
            chunks.append(current_chunk.strip())

        # Filter out very short chunks (likely noise)
        chunks = [chunk for chunk in chunks if len(chunk) > 50]

        return chunks

    def _evaluate_ingestion_quality(
        self,
        original_text: str,
        chunks: List[str],
        successful_chunks: int
    ) -> Dict[str, Any]:
        """Evaluate the quality of the ingestion process."""
        total_chunks = len(chunks)

        if total_chunks == 0:
            return {"quality_score": 0.0, "reason": "no_chunks"}

        # Success rate
        success_rate = successful_chunks / total_chunks

        # Chunk quality metrics
        avg_chunk_length = sum(len(chunk) for chunk in chunks) / total_chunks
        chunk_length_variance = np.var([len(chunk) for chunk in chunks])

        # Ideal chunk length around 200-400 characters
        length_score = 1.0 if 200 <= avg_chunk_length <= 400 else 0.7

        # Lower variance is better (more consistent chunks)
        consistency_score = max(0.5, 1 - chunk_length_variance / 10000)

        # Coverage score (how much of original text is preserved)
        total_chunk_length = sum(len(chunk) for chunk in chunks)
        coverage_score = min(total_chunk_length / len(original_text), 1.0)

        # Overall quality
        quality_score = (
            success_rate * 0.4 +
            length_score * 0.2 +
            consistency_score * 0.2 +
            coverage_score * 0.2
        )

        return {
            "quality_score": quality_score,
            "success_rate": success_rate,
            "avg_chunk_length": avg_chunk_length,
            "chunk_length_variance": chunk_length_variance,
            "coverage_score": coverage_score,
            "total_chunks": total_chunks
        }

    def batch_ingest(
        self,
        jobs_data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Ingest multiple jobs efficiently.
        jobs_data should be list of dicts with 'job_id' and 'description' keys.
        """
        total_jobs = len(jobs_data)
        successful_jobs = 0
        failed_jobs = []
        total_chunks = 0

        for job_data in jobs_data:
            try:
                result = self.ingest(
                    job_data["job_id"],
                    job_data["description"],
                    job_data.get("metadata", {})
                )

                if result["success"]:
                    successful_jobs += 1
                    total_chunks += result["successful_chunks"]
                else:
                    failed_jobs.append(job_data["job_id"])

            except Exception as e:
                failed_jobs.append(job_data["job_id"])

        return {
            "total_jobs": total_jobs,
            "successful_jobs": successful_jobs,
            "failed_jobs": failed_jobs,
            "total_chunks_created": total_chunks,
            "success_rate": successful_jobs / total_jobs if total_jobs > 0 else 0
        }
