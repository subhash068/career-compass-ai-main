from ai.embeddings.embedding_service import EmbeddingService
from ai.embeddings.vector_store import VectorStore

class LearningResourceIngestor:
    def __init__(self, store: VectorStore):
        self.store = store

    def ingest(self, course_id: int, course_description: str):
        chunks = course_description.split("\n\n")

        for chunk in chunks:
            emb = EmbeddingService.embed(chunk)
            self.store.add(
                emb,
                {
                    "type": "course",
                    "course_id": course_id,
                    "content": chunk,
                },
            )
