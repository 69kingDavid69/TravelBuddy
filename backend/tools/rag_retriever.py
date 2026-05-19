from pydantic import BaseModel, Field
from langchain_core.tools import tool
from backend.settings import settings

_embedding_model = None


def _get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        from sentence_transformers import SentenceTransformer
        _embedding_model = SentenceTransformer(
            "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
        )
    return _embedding_model


class RAGInput(BaseModel):
    query: str = Field(description="Query to search in the travel destination knowledge base")
    k: int = Field(default=4, description="Number of chunks to retrieve")


@tool("rag_retriever", args_schema=RAGInput)
def rag_retriever(query: str, k: int = 4) -> list[dict]:
    """Retrieve relevant information from the configured travel destination knowledge base."""
    try:
        import chromadb

        client = chromadb.PersistentClient(path=settings.CHROMA_DIR)
        try:
            collection = client.get_collection("travel_docs")
        except Exception:
            return [
                {
                    "chunk": "The travel knowledge base has not been populated yet. "
                             "Run the ingest script with: python -m backend.rag.ingest --url <URL>",
                    "source_url": "",
                    "score": 0.0,
                }
            ]

        model = _get_embedding_model()
        embedding = model.encode(query).tolist()
        results = collection.query(query_embeddings=[embedding], n_results=k)

        return [
            {
                "chunk": doc,
                "source_url": results["metadatas"][0][i].get("source_url", ""),
                "score": float(results["distances"][0][i]),
            }
            for i, doc in enumerate(results["documents"][0])
        ]
    except Exception as exc:
        return [{"chunk": f"RAG retrieval error: {exc}", "source_url": "", "score": 0.0}]
