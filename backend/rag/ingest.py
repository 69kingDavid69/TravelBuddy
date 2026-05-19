"""Ingestion script: fetch a URL, chunk it, embed, and store in ChromaDB.

Usage:
    python -m backend.rag.ingest --url https://en.wikivoyage.org/wiki/Medell%C3%ADn
"""
import argparse
import sys

import httpx
from bs4 import BeautifulSoup
from langchain.text_splitter import RecursiveCharacterTextSplitter


def ingest(url: str, chroma_dir: str = "/data/chroma") -> None:
    print(f"Fetching {url} ...")
    resp = httpx.get(
        url,
        timeout=30,
        follow_redirects=True,
        headers={"User-Agent": "TravelBuddy-Ingest/1.0"},
    )
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")
    elements = soup.find_all(["p", "h1", "h2", "h3", "h4", "li"])
    raw_text = "\n".join(
        el.get_text(separator=" ", strip=True)
        for el in elements
        if el.get_text(strip=True)
    )

    if not raw_text.strip():
        print("ERROR: no text content extracted from the page.", file=sys.stderr)
        sys.exit(1)

    splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=120)
    chunks = splitter.split_text(raw_text)
    print(f"Split into {len(chunks)} chunks.")

    print("Loading embedding model (first run may download ~120 MB) ...")
    from sentence_transformers import SentenceTransformer

    model = SentenceTransformer(
        "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    )
    embeddings = model.encode(chunks, show_progress_bar=True).tolist()

    import chromadb

    client = chromadb.PersistentClient(path=chroma_dir)
    collection = client.get_or_create_collection("travel_docs")

    collection.upsert(
        documents=chunks,
        embeddings=embeddings,
        metadatas=[{"source_url": url} for _ in chunks],
        ids=[f"chunk_{i}" for i in range(len(chunks))],
    )

    print(f"Successfully indexed {len(chunks)} chunks from {url}")
    print(f"Vector store location: {chroma_dir}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest a URL into the travel knowledge base")
    parser.add_argument("--url", required=True, help="URL to fetch and index")
    parser.add_argument("--chroma-dir", default="/data/chroma", help="ChromaDB directory path")
    args = parser.parse_args()
    ingest(args.url, args.chroma_dir)
