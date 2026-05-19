# ---- Stage 1: Build frontend ----
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: Download Piper voices ----
FROM python:3.13-slim AS voices

RUN pip install --no-cache-dir huggingface_hub
WORKDIR /data/voices
RUN python3 -c "
from huggingface_hub import hf_hub_download
hf_hub_download(repo_id='rhasspy/piper-voices', filename='es/es_MX/claude/high/es_MX-claude-high.onnx', local_dir='.')
hf_hub_download(repo_id='rhasspy/piper-voices', filename='es/es_MX/claude/high/es_MX-claude-high.onnx.json', local_dir='.')
hf_hub_download(repo_id='rhasspy/piper-voices', filename='en/en_US/amy/medium/en_US-amy-medium.onnx', local_dir='.')
hf_hub_download(repo_id='rhasspy/piper-voices', filename='en/en_US/amy/medium/en_US-amy-medium.onnx.json', local_dir='.')
" && \
    mv es/es_MX/claude/high/es_MX-claude-high.onnx* . && \
    mv en/en_US/amy/medium/en_US-amy-medium.onnx* . && \
    rm -rf es en

# ---- Stage 3: Final runtime ----
FROM python:3.13-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir piper-tts==1.4.2

COPY backend/ ./backend/
COPY --from=frontend-builder /app/frontend/dist ./backend/static/
COPY --from=voices /data/voices /data/voices

RUN mkdir -p /data/chroma

ENV PYTHONUNBUFFERED=1
ENV PIPER_VOICES_DIR=/data/voices
ENV CHROMA_DIR=/data/chroma

EXPOSE 8080

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]
