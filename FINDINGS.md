# Findings — GoogleADK-React
Open doc defects only, for https://docs.copilotkit.ai/google-adk (React). Numbers are stable IDs (code cites `FINDINGS.md #N`); gaps are removed findings.
Stack: `@copilotkit/react-core`/`react-ui`/`runtime` 1.86.0 (declared ^1.86.0), `@ag-ui/client` 1.0.2 (doc pin), `next` 16.4.6, `react` 19.3.0, `google-adk` 2.14.0, `ag-ui-adk` 0.12.0, `google-genai` 2.34.0, `fastapi` 0.162.4, `uvicorn` 0.54.0. Node 26.7.0, npm 11, Python 3.13.15, uv 0.12.5, Windows 11 Pro. Docs: https://docs.copilotkit.ai/google-adk (snapshot 2026-11-11)

## Dev blockers

(none confirmed yet: the quickstart's agent reply is untested while the Gemini key is out of credit)

## Minor notes

### [Quickstart](https://docs.copilotkit.ai/google-adk/quickstart) — "Use an existing agent"
- **#1** `npx create-next-app@latest` now scaffolds `cacheComponents: true`; the doc's `Providers` then logs `Next.js encountered the unstable value require('node:crypto').randomUUID() in a Client Component` on every load (Next "Issues" pill). The page doesn't mention it.
- **#2** The runtime route throws `CopilotKitIntelligence apiKey is required and cannot be blank` (500 on `/api/copilotkit/info`) until `CPK_INTELLIGENCE_API_KEY` is set; the "running without Intelligence" fallback is only in a callout after the code.

## Build-only
