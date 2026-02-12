from ai.embeddings.embedding_service import EmbeddingService
from ai.embeddings.vector_store import VectorStore

class SkillIngestor:
    def __init__(self, store: VectorStore):
        self.store = store

    def ingest(self, skill_id: int, skill_description: str):
        chunks = skill_description.split("\n\n")

        for chunk in chunks:
            emb = EmbeddingService.embed(chunk)
            self.store.add(
                emb,
                {
                    "type": "skill",
                    "skill_id": skill_id,
                    "content": chunk,
                },
            )
