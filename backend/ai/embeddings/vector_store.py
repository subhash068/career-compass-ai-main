import faiss
import numpy as np

class VectorStore:
    def __init__(self, dim: int = 384):
        self.index = faiss.IndexFlatL2(dim)
        self.metadata = []

    def add(self, embedding: list[float], meta: dict):
        self.index.add(np.array([embedding]).astype("float32"))
        self.metadata.append(meta)

    def search(self, embedding: list[float], k: int = 5):
        D, I = self.index.search(
            np.array([embedding]).astype("float32"), k
        )
        return [self.metadata[i] for i in I[0]]
