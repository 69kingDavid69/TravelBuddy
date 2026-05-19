#!/usr/bin/env bash
# start_local.sh — Start the TravelBuddy backend and frontend for local development.
#
# Usage:
#   bash scripts/start_local.sh
#
# Requirements:
#   - Python virtual environment at .venv/ (run: python3 -m venv .venv && .venv/bin/pip install -r backend/requirements.txt)
#   - Node dependencies installed (run: cd frontend && npm install)
#   - .env file present with at least DEEPSEEK_API_KEY (or LLM_API_KEY) set
#
# Both servers are killed cleanly when you press Ctrl+C.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# ── Colour helpers ────────────────────────────────────────────────────────────
BOLD='\033[1m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
RESET='\033[0m'

log()  { echo -e "${BOLD}[TravelBuddy]${RESET} $*"; }
ok()   { echo -e "${GREEN}[TravelBuddy]${RESET} $*"; }
warn() { echo -e "${YELLOW}[TravelBuddy]${RESET} $*"; }
err()  { echo -e "${RED}[TravelBuddy]${RESET} $*" >&2; }

# ── Pre-flight checks ─────────────────────────────────────────────────────────
if [ ! -f ".env" ]; then
  err ".env not found. Copy .env.example and fill in your API keys:"
  err "  cp .env.example .env"
  exit 1
fi

if [ ! -d ".venv" ]; then
  err "Python virtual environment not found. Run:"
  err "  python3 -m venv .venv && .venv/bin/pip install -r backend/requirements.txt"
  exit 1
fi

if [ ! -d "frontend/node_modules" ]; then
  warn "node_modules missing — installing frontend dependencies..."
  (cd frontend && npm install --silent)
  ok "Frontend dependencies installed."
fi

# ── Trap: kill both servers on exit ──────────────────────────────────────────
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo ""
  log "Shutting down..."
  [ -n "$BACKEND_PID" ]  && kill "$BACKEND_PID"  2>/dev/null && ok "Backend stopped."
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null && ok "Frontend stopped."
  exit 0
}
trap cleanup INT TERM

# ── Start backend ─────────────────────────────────────────────────────────────
log "Starting backend  ${CYAN}http://localhost:8000${RESET}"
.venv/bin/uvicorn backend.main:app --port 8000 --reload \
  --log-level warning 2>&1 | sed "s/^/${CYAN}[backend] ${RESET}/" &
BACKEND_PID=$!

# Give uvicorn a moment to bind the port before starting the frontend
sleep 2

# ── Start frontend ────────────────────────────────────────────────────────────
log "Starting frontend ${CYAN}http://localhost:5173${RESET}"
(cd frontend && npm run dev -- --host 2>&1) | sed "s/^/${GREEN}[frontend]${RESET} /" &
FRONTEND_PID=$!

# ── Ready banner ──────────────────────────────────────────────────────────────
sleep 3
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
ok "TravelBuddy is running!"
echo -e "  ${CYAN}Frontend${RESET}  →  http://localhost:5173"
echo -e "  ${CYAN}Backend ${RESET}  →  http://localhost:8000"
echo -e "  ${CYAN}Health  ${RESET}  →  http://localhost:8000/health"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "  Press ${BOLD}Ctrl+C${RESET} to stop both servers."
echo ""

# ── Wait for either process to exit ──────────────────────────────────────────
wait "$BACKEND_PID" "$FRONTEND_PID"
