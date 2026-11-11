# Findings — GoogleADK-React
Open doc defects only, for https://docs.copilotkit.ai/google-adk (React). Numbers are stable IDs (code cites `FINDINGS.md #N`); gaps are removed findings. LLM replies via OpenAI fallback (Gemini free quota exhausted): the doc's agent code is unchanged, `tools/gemini_pool.py` on :8029 forwards the model calls.
Stack: `@copilotkit/react-core`/`react-ui`/`runtime` 1.86.0 (declared ^1.86.0), `@ag-ui/client` 1.0.2 (doc pin), `next` 16.4.6, `react` 19.3.0, `maplibre-gl` 5.24.0 (HARNESS, #4), `google-adk` 2.14.0, `ag-ui-adk` 0.12.0, `google-genai` 2.34.0, `fastapi` 0.162.4, `uvicorn` 0.54.0. Node 26.7.0, npm 12.0.2, Python 3.13.15 (backend venv), uv 0.12.5, Windows 11 Pro. Docs: https://docs.copilotkit.ai/google-adk (snapshot 2026-11-11)

## Dev blockers (seen with `npm run dev` and normal use of the page)

### [Quickstart](https://docs.copilotkit.ai/google-adk/quickstart) — "Use an existing agent"
**#1 The quickstart's `create-next-app@latest` setup turns on `cacheComponents`, and the doc's CopilotKit provider then trips it: some pages die with a full-page "Blocking Route" error.**
- **Doc:** `npx create-next-app@latest` (scaffolds `cacheComponents: true` in `next.config.ts`), then the `<CopilotKit runtimeUrl="/api/copilotkit" ...>` provider in a Client Component. The page never mentions `cacheComponents`.
- **Error:** `Error: Route "/<route>": Next.js encountered the unstable value require('node:crypto').randomUUID() in a Client Component. This value would be evaluated during the prerender, instead of recomputed on each visit.` Logged on every page (a few with `Date.now()` instead). On Headless UI, Shared State and Sub-agents it is a full-page Blocking Route error and nothing renders (probes `headless-ui`, `shared-state`, `subagents`). Not worked around (owner decision): those pages stay ❌ with this error.

### [Components and surfaces](https://docs.copilotkit.ai/google-adk/generative-ui/components) (whole section)
**#3 No Google ADK backend anywhere in the Components & Surfaces section: the ADK agent never renders a component.**
- **Doc:** the section's setup is `npm install @copilotkit/react-core @copilotkit/runtime @tanstack/ai @tanstack/ai-openai` with a TanStack AI / OpenAI `BuiltInAgent` runtime; no ADK agent code or ADK step on Components, Surfaces, Catalogs, Standard catalog, State and actions, Theming or Adopt from A2UI.
- **Result:** with the quickstart ADK agent behind the doc's frontend, every page answers in plain text/markdown and no catalog component renders. Transports and Markdown mode: the agent replies with a plain markdown table; no generative UI is streamed or rendered (their agent-side steps cover only the built-in agent and LangGraph, see #19). Components: markdown table for "Compare the Starter, Team, and Enterprise plans". Surfaces: "since I don't know which store or website you're currently browsing" (agent can't see the products). Catalogs: a raw `html` code block. Standard catalog: markdown "welcome card". State and actions: markdown "Product Card: Trail Runner", no state/actions. Theming: markdown card with `Click Me! 🚀 [blocked]`. Adopt from A2UI: `[SFO] San Francisco ─── ✈️ ───> [JFK] New York` as text; the Airport/Arrow renderers are never shown.

**#4 Importing the generative UI catalog breaks the build: `maplibre-gl` isn't installed.**
- **Doc:** "npm install @copilotkit/react-core @copilotkit/runtime @tanstack/ai @tanstack/ai-openai"; Standard catalog: "Run `npm install maplibre-gl` if your agent draws maps. Without it, the map shows a list of the places."
- **Error:** `Module not found: Can't resolve 'maplibre-gl'` at `node_modules/@copilotkit/react-core/dist/v2/generative-ui.mjs:2946` (`await import("maplibre-gl")`), route 500. Only an optional peer of react-core 1.86.0, but Next/Turbopack still fails. **Confirmed by harness:** `npm install maplibre-gl` (5.24.0) removes the error.

### Shared: `agents.shared_chat` (Fixed Schema A2UI, State Streaming, HITL Overview, Sub-agents)
**#5 Agent files import `agents.shared_chat`, which no page publishes.**
- **Doc:** `from agents.shared_chat import get_model, stop_on_terminal_text` (fixed-schema, shared-state streaming, `hitl_in_chat_agent.py`, `subagents_agent.py`). `get_model` is never shown; the streaming page links the showcase only for `stop_on_terminal_text`, which itself needs the unpublished `agents._header_forwarding`.
- **Error:** `ModuleNotFoundError: No module named 'agents.shared_chat'`; the backend won't start. The HITL and Sub-agents agent files also never build an `ADKAgent` / FastAPI app.

### [A2UI](https://docs.copilotkit.ai/google-adk/generative-ui/a2ui)
**#6 The page is only fragments: `myCatalog` and `myAgent` are never defined, and there is no ADK agent code.**
- **Doc:** `<CopilotKit runtimeUrl="/api/copilotkit" a2ui={{ catalog: myCatalog }}>`, `agents: { default: myAgent }`, `from copilotkit import a2ui` (needs the Python `copilotkit` package, which no ADK install step adds).
- **Error:** `myCatalog is not defined`; the route 500s (`Route "/a2ui": Could not validate instant because an error prevented the target segment from rendering`).

### [Dynamic Schema A2UI](https://docs.copilotkit.ai/google-adk/generative-ui/a2ui/dynamic-schema)
**#7 `page.tsx` imports `./chat` and a runtime route that are never shown.**
- **Doc:** `import { Chat } from "./chat";` and `runtimeUrl="/api/copilotkit-declarative-gen-ui"`; `renderers.tsx` has no imports. The opt-out tool snippet is LangGraph Python (`from ag_ui_langgraph import get_a2ui_tools`).
- **Error:** `./app/a2ui-dynamic-schema/page.tsx:7:1 Error: Module not found: Can't resolve './chat'`.

### [Fixed Schema A2UI](https://docs.copilotkit.ai/google-adk/generative-ui/a2ui/fixed-schema)
**#8 The flight card can't be built from the page: tool, agent and schema are never shown.**
- **Doc:** `FLIGHT_SCHEMA = _load_schema("flight_schema.json")`; the `display_flight` tool, the `LlmAgent` and `flight_schema.json` are never shown; `renderers.tsx` has no imports (Card, Badge, Separator, ...). Backend also #5.
- **Result:** with the missing pieces filled in (HARNESS), the reply says "Your United flight from SFO to JFK for $289 is displayed." but the card shows `Unable to display Card: invalid component value. Ask the assistant to correct this component and try again.`

### [Shared State](https://docs.copilotkit.ai/google-adk/shared-state)
**#9 The agent snippet uses helpers that are never shown, and the frontend is only fragments.**
- **Doc:** `LlmAgent(..., model=get_model(), instruction=_INSTRUCTION, tools=[set_notes, AGUIToolset()], before_model_callback=_inject_preferences, after_model_callback=stop_on_terminal_text)` with "See src/agents/shared_state_read_write_agent.py"; `NotesCard` uses Card/Button/CardHeader from an unshown UI kit; agent `shared-state-read-write` never registered.
- **Error:** none of those names resolve; the page also dies with #1's Blocking Route error.

### [Agent Read-Only Context](https://docs.copilotkit.ai/google-adk/shared-state/agent-readonly)
**#10 `page.tsx` imports files that are never shown.**
- **Doc:** `import { ACTIVITIES, DemoLayout } from "./demo-layout";` (and `./suggestions`); `DemoContent` is cut off before its `return`.
- **Error:** `./app/shared-state-agent-readonly/page.tsx:10:1 Error: Module not found: Can't resolve './demo-layout'`.

### [HITL Overview](https://docs.copilotkit.ai/google-adk/human-in-the-loop)
**#11 The frontend snippet is cut off mid-component.**
- **Doc:** `Chat()` ends after `useHumanInTheLoop({...});` with no `return` or closing brace; imports `{ TimePickerCard, TimeSlot } from "./time-picker-card"` (never shown); agent `hitl-in-chat` never registered; the agent instruction says to call `generate_task_steps` while the frontend tool is `book_call`. Backend: #5.
- **Error:** `./app/g6-hitl/page.tsx:70:1 Error: Expected '}', got '<eof>' ... Parsing ecmascript source code failed`.

### [Sub-agents](https://docs.copilotkit.ai/google-adk/multi-agent/subagents)
**#12 The frontend can't be built from the page.**
- **Doc:** `delegation-log.tsx` uses `SUB_AGENT_STYLE`, `SubAgentName`, `DelegationLogProps`, never defined; `page.tsx` is never shown. Backend: #5. The page also dies with #1's Blocking Route error.

### [Headless Threads](https://docs.copilotkit.ai/google-adk/headless-threads)
**#25 The thread list stays empty: the two snippets use different agents, and rows can't be opened.**
- **Doc:** `useThreads({ agentId: "my-agent" })` in the sidebar, `<CopilotChat threadId={activeThreadId} />` (no agentId, so it runs on `default`); `ThreadSidebar` never calls `onSelectThread`.
- **Result:** with only `my-agent` registered the page throws `useAgent: Agent 'default' not found after runtime sync … Known agents: [my-agent]`; with both registered the chat works but the list shows no threads and no row opens. `verifyAppSession` and the "my-agent" placeholder are also never resolved.
- **Confirmed by harness:** switching `useThreads` to `agentId: "default"` (temporary, reverted) fills the list with past threads.

### [Hashbrown](https://docs.copilotkit.ai/google-adk/generative-ui/hashbrown)
**#26 No ADK agent or runtime route on the page; nothing renders.**
- **Doc:** "Where available, the Code tab also includes … runtime route, and agent source" — the page shows the frontend only, no ADK agent and no route.
- **Result:** with the showcase agent wired in (HARNESS) the backend answers 200 with `ui[]` plus extra `root`/`elements` keys, and the hashbrown renderer draws nothing.

### [MCP Apps](https://docs.copilotkit.ai/google-adk/generative-ui/mcp-apps)
**#27 The MCP server URL redirects, so tool discovery fails.**
- **Doc:** `url: process.env.MCP_SERVER_URL || "https://mcp.excalidraw.com",` (the page's own Intelligence snippet uses `/mcp`).
- **Error:** `MCP tool discovery failed … [TypeError: fetch failed] { [cause]: Error: unexpected redirect }` (308 to `/mcp`); the agent replies that the Excalidraw drawing tool isn't available.

## Minor notes
- **#2** [Quickstart](https://docs.copilotkit.ai/google-adk/quickstart): the runtime route throws `CopilotKitIntelligence apiKey is required and cannot be blank` (500 on `/api/copilotkit/info`) until `CPK_INTELLIGENCE_API_KEY` is set; the "running without Intelligence" fallback is only in a callout after the code.
- **#13** [Render agent state in your app](https://docs.copilotkit.ai/google-adk/shared-state/rendering-in-app): `Canvas.tsx` uses `useEffect` with no `"use client"`: `You're importing a module that depends on useEffect into a React Server Component module.` `useAgent()` with no agentId needs an agent named `default`. (Level pending re-probe.)
- **#14** [CopilotChat](https://docs.copilotkit.ai/google-adk/prebuilt-components/chat): `useAgenticChatSuggestions()` is called but never defined or imported; agent `agentic_chat` never registered.
- **#15** [CopilotSidebar](https://docs.copilotkit.ai/google-adk/prebuilt-components/sidebar) / [CopilotPopup](https://docs.copilotkit.ai/google-adk/prebuilt-components/popup): `MainContent` and `Suggestions` are used but never shown.
- **#16** [Open, close, and feedback](https://docs.copilotkit.ai/google-adk/prebuilt-components/chat-controls): `analytics` in the feedback snippet is never defined.
- **#17** [Headless UI](https://docs.copilotkit.ai/google-adk/custom-look-and-feel/headless-ui): snippets are fragments (`visible`, Avatar, cn, AttachmentChip never shown); agent `headless-simple` never registered; react-markdown / remark-gfm / lucide-react install not mentioned.
- **#18** [State Rendering](https://docs.copilotkit.ai/google-adk/generative-ui/state-rendering): `DemoLayout` is never shown; `predict_state` placement never shown.
- **#19** [Transports](https://docs.copilotkit.ai/google-adk/generative-ui/components/transports) / [Markdown mode](https://docs.copilotkit.ai/google-adk/generative-ui/components/markdown-mode): agent-side instructions name only the built-in agent and LangGraph Python (`CopilotKitMiddleware`), nothing for ADK.
- **#20** [Pausing the Agent for Input](https://docs.copilotkit.ai/google-adk/human-in-the-loop/useInterrupt) / [Headless Interrupts](https://docs.copilotkit.ai/google-adk/human-in-the-loop/headless): page says "Not available on this framework." (useInterrupt still shows code and a demo); the `.md` export ships LangGraph-style code with no warning.
- **#21** [Governed Action Approval UI](https://docs.copilotkit.ai/google-adk/human-in-the-loop/governed-actions): `executeSideEffect` never defined; relies on `useInterrupt`, which #20 says is not available on ADK. The page shows no agent: the approval tool only reaches the model on an agent with `AGUIToolset` (shown on Frontend Tools).
- **#22** [WebMCP](https://docs.copilotkit.ai/google-adk/webmcp): `searchOrders()` never defined; `document.modelContext` needs a Chrome flag (not testable in the recorder's Chromium).
- **#23** [Agent App Context](https://docs.copilotkit.ai/google-adk/agent-app-context): `agent.py` imports `add_adk_fastapi_endpoint` but never creates the app or mounts it.
- **#24** [Standard catalog](https://docs.copilotkit.ai/google-adk/generative-ui/components/standard-catalog): component links in the "What is in it" table lack the `/google-adk` prefix.

## Build-only
