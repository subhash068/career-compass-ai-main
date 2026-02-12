from ai.embeddings.embedding_service import EmbeddingService
from ai.embeddings.vector_store import VectorStore

class ResumeIngestor:
    def __init__(self, store: VectorStore):
        self.store = store

    def ingest(self, user_id: int, resume_text: str):
        chunks = resume_text.split("\n\n")

        for chunk in chunks:
            emb = EmbeddingService.embed(chunk)
            self.store.add(
                emb,
                {
                    "type": "resume",
                    "user_id": user_id,
                    "content": chunk,
                },
            )
