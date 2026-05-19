# Multi-stage Dockerfile for TravelBuddy.
# Stage 1 builds the React SPA, Stage 2 downloads Piper voice models from
# Hugging Face, and Stage 3 assembles the lean production runtime.

# ---- Stage 1: Build frontend ----
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: Download Piper voices ----
FROM python:3.12-slim AS voices

RUN pip install --no-cache-dir huggingface_hub
COPY scripts/download_voices.py /tmp/download_voices.py
RUN python3 /tmp/download_voices.py

# ---- Stage 3: Final runtime ----
FROM python:3.12-slim

WORKDIR /app

# libsndfile is required at runtime by the sentence-transformers model
# used in the RAG retriever tool.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir --default-timeout=300 -r requirements.txt && \
    pip install --no-cache-dir --default-timeout=300 piper-tts==1.4.2

COPY backend/ ./backend/
COPY --from=frontend-builder /app/frontend/dist ./backend/static/
COPY --from=voices /data/voices /data/voices

# Pre-create the ChromaDB persistence directory so the RAG ingest script
# can write without requiring a volume mount on first run.
RUN mkdir -p /data/chroma

ENV PYTHONUNBUFFERED=1
ENV PIPER_VOICES_DIR=/data/voices
ENV CHROMA_DIR=/data/chroma

EXPOSE 8080

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]
