#!/usr/bin/env bash
# HARNESS: starts every GoogleADK-React server on its harness port (QA-RULES §4: never 3000/8000).
#   8020 quickstart ADK agent (backend/main.py)
#   8021-8029 reserved for page agents (see the PAGE AGENTS block below)
#   3020 Next.js frontend (runtime at /api/copilotkit)
# The doc says `export GOOGLE_API_KEY=...`; the harness keeps it in backend/.env and loads it via --env-file.
cd "$(dirname "$0")"
mkdir -p logs
(cd backend && uv run --env-file .env uvicorn main:app --port 8020 > ../logs/backend-8020.log 2>&1) &

# ── PAGE AGENTS: append one line per page backend (ports 8021-8029), e.g.
# (cd backend && uv run --env-file .env uvicorn <module>:app --port 8021 > ../logs/backend-8021.log 2>&1) &
# ── END PAGE AGENTS

(cd frontend && npm run dev > ../logs/frontend-3020.log 2>&1) &
wait
