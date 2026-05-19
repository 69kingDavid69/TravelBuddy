#!/usr/bin/env bash
# setup_local.sh — Downloads the Piper binary and voice models needed for local
# development. Run this once from the project root before `docker compose up`.
set -euo pipefail

PIPER_VERSION="2023.11.14-2"
VOICES_DIR="./data/voices"
PIPER_DIR="./data/piper"

HF_BASE="https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0"
GH_BASE="https://github.com/rhasspy/piper/releases/download/${PIPER_VERSION}"

# ── 1. Create directories ──────────────────────────────────────────────────────
mkdir -p "${VOICES_DIR}" "${PIPER_DIR}"

# ── 2. Download Piper binary for Linux x86_64 ─────────────────────────────────
PIPER_ARCHIVE="piper_linux_x86_64.tar.gz"
echo "[1/3] Downloading Piper binary (Linux x86_64) ..."
curl -fsSL "${GH_BASE}/${PIPER_ARCHIVE}" \
  | tar -xz -C "${PIPER_DIR}" --strip-components=1
echo "      Piper binary → ${PIPER_DIR}/piper"

# ── 3. Download Spanish voice ─────────────────────────────────────────────────
echo "[2/3] Downloading Spanish voice (es_MX-claude-high) ..."
curl -fsSL -o "${VOICES_DIR}/es_MX-claude-high.onnx" \
  "${HF_BASE}/es/es_MX/claude/high/es_MX-claude-high.onnx"
curl -fsSL -o "${VOICES_DIR}/es_MX-claude-high.onnx.json" \
  "${HF_BASE}/es/es_MX/claude/high/es_MX-claude-high.onnx.json"
echo "      Saved to ${VOICES_DIR}/"

# ── 4. Download English voice ─────────────────────────────────────────────────
echo "[3/3] Downloading English voice (en_US-amy-medium) ..."
curl -fsSL -o "${VOICES_DIR}/en_US-amy-medium.onnx" \
  "${HF_BASE}/en/en_US/amy/medium/en_US-amy-medium.onnx"
curl -fsSL -o "${VOICES_DIR}/en_US-amy-medium.onnx.json" \
  "${HF_BASE}/en/en_US/amy/medium/en_US-amy-medium.onnx.json"
echo "      Saved to ${VOICES_DIR}/"

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "Setup complete."
echo ""
echo "Voice models:"
ls -lh "${VOICES_DIR}"
echo ""
echo "Next steps:"
echo "  1. Copy .env.example to .env and set DEEPSEEK_API_KEY"
echo "  2. docker compose up --build"
echo "  3. Open http://localhost:8080"
echo ""
echo "To ingest a URL for RAG (run after the container is up):"
echo "  docker compose exec app python -m backend.rag.ingest --url <URL>"
