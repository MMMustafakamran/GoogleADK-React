#!/usr/bin/env bash
# HARNESS: starts every GoogleADK-React server on its harness port (QA-RULES §4: never 3000/8000).
#   8020 quickstart ADK agent (backend/main.py)
#   8021-8029 reserved for page agents (see the PAGE AGENTS block below)
#   3020 Next.js frontend (runtime at /api/copilotkit)
# The doc says `export GOOGLE_API_KEY=...`; the harness keeps it in backend/.env and loads it via --env-file.
cd "$(dirname "$0")"
mkdir -p logs
# HARNESS: Gemini key/model pool on 8029 (free-tier quota). backend/.env sets GOOGLE_GEMINI_BASE_URL to it.
# Keys: GEMINI_POOL_KEYS (CI secrets) or GEMINI_POOL_KEYFILES (local key files outside the repo).
(cd backend && uv run python ../tools/gemini_pool.py > ../logs/gemini-pool-8029.log 2>&1) &
(cd backend && uv run --env-file .env uvicorn main:app --port 8020 > ../logs/backend-8020.log 2>&1) &

# ── PAGE AGENTS: append one line per page backend (ports 8021-8029), e.g.
# (cd backend && uv run --env-file .env uvicorn <module>:app --port 8021 > ../logs/backend-8021.log 2>&1) &
(cd backend && uv run --env-file .env uvicorn g5_app:app --port 8025 > ../logs/backend-8025.log 2>&1) &  # G5 shared-state + a2ui-fixed
(cd backend && uv run --env-file .env uvicorn g2_agents:app --port 8022 > ../logs/backend-8022.log 2>&1) & # G2: frontend-tools, voice, reasoning
(cd backend && uv run --env-file .env uvicorn g3_app:app --port 8023 > ../logs/backend-8023.log 2>&1) & # G3: generative-ui pages
(cd backend && uv run --env-file .env uvicorn g6_agent_app_context:app --port 8026 > ../logs/backend-8026.log 2>&1) & # G6: agent-app-context
# ── END PAGE AGENTS

(cd frontend && npm run dev > ../logs/frontend-3020.log 2>&1) &
wait
