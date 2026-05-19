# ---- Stage 1: Build frontend ----
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
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

RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir --default-timeout=300 -r requirements.txt && \
    pip install --no-cache-dir --default-timeout=300 piper-tts==1.4.2

COPY backend/ ./backend/
COPY --from=frontend-builder /app/frontend/dist ./backend/static/
COPY --from=voices /data/voices /data/voices

RUN mkdir -p /data/chroma

ENV PYTHONUNBUFFERED=1
ENV PIPER_VOICES_DIR=/data/voices
ENV CHROMA_DIR=/data/chroma

EXPOSE 8080

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]
