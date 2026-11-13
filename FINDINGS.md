# Findings — GoogleADK-React
Open doc defects only, for https://docs.copilotkit.ai/google-adk (React). Numbers are stable IDs (code cites `FINDINGS.md #N`); gaps are removed findings. LLM replies via Gemini (`tools/gemini_pool.py` on :8029 forwards the model calls; OpenAI only as last-resort fallback): the doc's agent code is unchanged.
Stack: `@copilotkit/react-core`/`react-ui`/`runtime` 1.86.0 (declared ^1.86.0), `@ag-ui/client` 1.0.2 (doc pin), `next` 16.4.6, `react` 19.3.0, `maplibre-gl` 5.24.0 (HARNESS, #4), `google-adk` 2.14.0, `ag-ui-adk` 0.12.0, `google-genai` 2.34.0, `fastapi` 0.162.4, `uvicorn` 0.54.0. Node 26.7.0, npm 12.0.2, Python 3.13.15 (backend venv), uv 0.12.5, Windows 11 Pro. Docs: https://docs.copilotkit.ai/google-adk (snapshot 2026-11-11)

## Dev blockers (seen with `npm run dev` and normal use of the page)

### [Quickstart](https://docs.copilotkit.ai/google-adk/quickstart) — "Use an existing agent"
**#1 The quickstart's `create-next-app@latest` setup turns on `cacheComponents`, and the doc's CopilotKit provider then trips it: some pages die with a full-page "Blocking Route" error.**
- **Doc:** `npx create-next-app@latest` (scaffolds `cacheComponents: true` in `next.config.ts`), then the `<CopilotKit runtimeUrl="/api/copilotkit" ...>` provider in a Client Component. The page never mentions `cacheComponents`.
- **Error:** `Error: Route "/<route>": Next.js encountered the unstable value require('node:crypto').randomUUID() in a Client Component. This value would be evaluated during the prerender, instead of recomputed on each visit.` Logged on every page (a few with `Date.now()` instead). On Shared State it is a full-page Blocking Route error and nothing renders (probe `shared-state`). Not worked around (owner decision): that page stays ❌ with this error. On Headless UI it is now console-only and the page works (probes 2026-11-13).

### [Components and surfaces](https://docs.copilotkit.ai/google-adk/generative-ui/components) (whole section)
**#3 No Google ADK backend anywhere in the Components & Surfaces section: the ADK agent never renders a component.**
- **Doc:** the section's setup is `npm install @copilotkit/react-core @copilotkit/runtime @tanstack/ai @tanstack/ai-openai` with a TanStack AI / OpenAI `BuiltInAgent` runtime; no ADK agent code or ADK step on Components, Surfaces, Catalogs, Standard catalog, State and actions, Theming or Adopt from A2UI.
- **Result:** with the quickstart ADK agent behind the doc's frontend, every page answers in plain text/markdown and no catalog component renders. Transports and Markdown mode: the agent replies in text; no generative UI is streamed or rendered (their agent-side steps cover only the built-in agent and LangGraph, see #19). Components: markdown table for "Compare the Starter, Team, and Enterprise plans". Surfaces: "since I don't know which store or website you're currently browsing" (agent can't see the products). Catalogs: the agent answers on its own (the reply shape varies run to run), the catalog's `ProductCard` never renders. Standard catalog: markdown "welcome card". State and actions: markdown "Product Card: Trail Runner", no state/actions. Theming: only text or a code block, no themed component. Adopt from A2UI: `[SFO] San Francisco ─── ✈️ ───> [JFK] New York` as text; the Airport/Arrow renderers are never shown.

### Shared: `agents.shared_chat` (Fixed Schema A2UI, Sub-agents)
**#5 Agent files import `agents.shared_chat`, which these pages never show or link.**
- **Doc:** `from agents.shared_chat import get_model, stop_on_terminal_text` in the Code-tab agents of Fixed Schema A2UI (`a2ui_fixed_agent.py`) and Sub-agents (`subagents_agent.py`). `get_model` is defined nowhere on either page and neither links the file. (State Streaming and HITL Overview link the showcase `shared_chat.py`, which has both functions but imports the unpublished `agents._header_forwarding`: a minor note there.)
- **Error:** `ModuleNotFoundError: No module named 'agents.shared_chat'`; the backend won't start.

### [A2UI](https://docs.copilotkit.ai/google-adk/generative-ui/a2ui)
**#6 The page is only fragments: `myCatalog` and `myAgent` are never defined, and there is no ADK agent code.**
- **Doc:** `<CopilotKit runtimeUrl="/api/copilotkit" a2ui={{ catalog: myCatalog }}>`, `agents: { default: myAgent }`, `from copilotkit import a2ui` (needs the Python `copilotkit` package, which no ADK install step adds).
- **Error:** `myCatalog is not defined`; the route 500s (`Route "/a2ui": Could not validate instant because an error prevented the target segment from rendering`).

### [Dynamic Schema A2UI](https://docs.copilotkit.ai/google-adk/generative-ui/a2ui/dynamic-schema)
**#7 The Code tab's frontend imports files that no tab shows.**
- **Doc:** Code-tab `page.tsx`: `import { Chat } from "./chat";`; Code-tab `renderers.tsx`: `import { Badge } from "../_components/badge";` and `import { Button } from "../_components/button";`; Code-tab `route.ts`: `import { extractForwardedHeaders } from "@/lib/header-forwarding";`. None of these files is on the page. The opt-out tool snippet is LangGraph Python (`from ag_ui_langgraph import get_a2ui_tools`) on the Google ADK page.
- **Error:** `./app/a2ui-dynamic-schema/page.tsx:32:1 Error: Module not found: Can't resolve './chat'` (also `Can't resolve '../_components/badge'` and `'../_components/button'`); the route 500s.

### [Fixed Schema A2UI](https://docs.copilotkit.ai/google-adk/generative-ui/a2ui/fixed-schema)
**#8 The Code tab's frontend imports files that no tab shows, and with them filled in the flight card shows no flight data.**
- **Doc:** Code-tab `page.tsx`: `import { Chat } from "./chat";`; Code-tab `renderers.tsx`: `import { Card } from "../_components/card";` plus `../_components/badge`, `../_components/button`, `../_components/separator`; Code-tab `route.ts` needs `@/lib/header-forwarding`. None of these files is on the page. Backend: #5.
- **Result:** with those files stubbed (HARNESS) and every Code-tab file verbatim, the agent calls `display_flight` and the card renders ("Flight Details", "Book flight"), but the airports, airline and price stay empty: the fields bound to the data model (`{ "path": "/origin" }` etc.) render blank.

### [Shared State](https://docs.copilotkit.ai/google-adk/shared-state)
**#9 The agent snippet uses helpers that are never shown, and the frontend is only fragments.**
- **Doc:** `LlmAgent(..., model=get_model(), instruction=_INSTRUCTION, tools=[set_notes, AGUIToolset()], before_model_callback=_inject_preferences, after_model_callback=stop_on_terminal_text)` with "See src/agents/shared_state_read_write_agent.py"; `NotesCard` uses Card/Button/CardHeader from an unshown UI kit; agent `shared-state-read-write` never registered.
- **Error:** none of those names resolve; the page also dies with #1's Blocking Route error.

### [Agent Read-Only Context](https://docs.copilotkit.ai/google-adk/shared-state/agent-readonly)
**#10 `page.tsx` imports files that are never shown.**
- **Doc:** Code-tab `page.tsx`: `import { ACTIVITIES, DemoLayout } from "./demo-layout";` and `import { useReadonlyStateAgentContextSuggestions } from "./suggestions";`; neither file is on the page (the step snippet is also cut off before `DemoContent`'s `return`; the Code tab has the full file). Code-tab `route.ts` also needs `@/lib/header-forwarding`.
- **Error:** `./app/shared-state-agent-readonly/page.tsx:11:1 Error: Module not found: Can't resolve './demo-layout'` (and `'./suggestions'`).

### [Sub-agents](https://docs.copilotkit.ai/google-adk/multi-agent/subagents)
**#12 The Code tab's `page.tsx` imports four files that no tab shows.**
- **Doc:** Code-tab `page.tsx`: `./subagent-activity-card`, `./demo-layout`, `./active-subagent`, `./suggestions`; none is on the page. Code-tab `route.ts` needs `@/lib/header-forwarding`. Backend: #5.
- **Error:** `Error: Module not found: Can't resolve './<file>'` for these imports (which one Next reports first varies, e.g. `'./active-subagent'` or `'./subagent-activity-card'`); the route 500s.

### [Headless Threads](https://docs.copilotkit.ai/google-adk/headless-threads)
**#25 The thread list stays empty: the two snippets use different agents, and rows can't be opened.**
- **Doc:** `useThreads({ agentId: "my-agent" })` in the sidebar, `<CopilotChat threadId={activeThreadId} />` (no agentId, so it runs on `default`); `ThreadSidebar` never calls `onSelectThread`.
- **Result:** with only `my-agent` registered the page throws `useAgent: Agent 'default' not found after runtime sync … Known agents: [my-agent]`; with both registered the chat works but the list shows no threads and no row opens. `verifyAppSession` and the "my-agent" placeholder are also never resolved.
- **Confirmed by harness:** switching `useThreads` to `agentId: "default"` (temporary, reverted) fills the list with past threads.

### [Hashbrown](https://docs.copilotkit.ai/google-adk/generative-ui/hashbrown)
**#26 The page can't be built from the doc: the agent mount and three frontend files are never shown.**
- **Doc:** the Code tab's `byoc_agents.py` says the agent is mounted in `registry.py`, which is never shown. The Code tab's `page.tsx` imports `./chat`, `hashbrown-renderer.tsx` imports `./types`, the charts import `./chart-config`: none of these is shown either.
- **Result:** as published the page fails on the missing imports and the agent has no route; filling them in needs guesswork.
- **Confirmed by harness:** with the missing files taken from the showcase and the agent mounted at the route's `/declarative-hashbrown` path (HARNESS), the dashboard renders ("Q4 Sales Performance", TOTAL REVENUE metric, segment chart; probes 2026-11-13, 3/3).

### [MCP Apps](https://docs.copilotkit.ai/google-adk/generative-ui/mcp-apps)
**#27 The MCP server URL redirects, so tool discovery fails.**
- **Doc:** `url: process.env.MCP_SERVER_URL || "https://mcp.excalidraw.com",` (the page's own Intelligence snippet uses `/mcp`).
- **Error:** `MCP tool discovery failed … [TypeError: fetch failed] { [cause]: Error: unexpected redirect }` (308 to `/mcp`); no MCP app ever renders in the chat (on 2026-11-13 the agent did not reply at all, 3/3 probes).

### [Governed Action Approval UI](https://docs.copilotkit.ai/google-adk/human-in-the-loop/governed-actions)
**#21 No approval card appears: the page shows no agent, and the quickstart agent never gets the approval tool.**
- **Doc:** the page shows only frontend code (a `useInterrupt` card and a `useHumanInTheLoop` approval tool); `executeSideEffect` is never defined, and `useInterrupt` is the hook #20 says is not available on ADK. No agent and no backend step.
- **Result:** on the quickstart agent, "Send an email to bob@example.com saying hi." gets a text reply and no approval card, every run.
- **Confirmed by harness:** on an agent with `AGUIToolset` (the Frontend Tools agent) and a prompt naming the tool, the "User approval required" card appears.

### [Reasoning](https://docs.copilotkit.ai/google-adk/generative-ui/reasoning) / [Reasoning Messages](https://docs.copilotkit.ai/google-adk/custom-look-and-feel/reasoning-messages)
**#28 No reasoning card appears on Google ADK: both pages show no ADK agent and no way to make Gemini emit reasoning.**
- **Doc:** "Some models (`gpt-6-luna`, Anthropic's thinking variants) emit reasoning tokens" / "No configuration is needed; if your model emits reasoning tokens, the card appears automatically"; Reasoning Messages: "The only requirement is connecting your agent to CopilotKit; no extra props or configuration needed". Only frontend code; no ADK agent, no Gemini thinking setting (`include_thoughts`).
- **Result:** on the quickstart ADK agent served by Gemini (pool log: `200 model=gemini-3.8-flash`), "Think step by step: what is 17 times 23?" gets a plain markdown answer; no "Thinking…" / "Thought for X seconds" card on either page (probes `reasoning`, `reasoning-messages`, 2026-11-12).

## Minor notes
- **#4** [Components](https://docs.copilotkit.ai/google-adk/generative-ui/components) / [Standard catalog](https://docs.copilotkit.ai/google-adk/generative-ui/components/standard-catalog): the doc calls `maplibre-gl` optional, but importing `@copilotkit/react-core/v2/generative-ui` without it fails with `Module not found: Can't resolve 'maplibre-gl'`; `npm install maplibre-gl` fixes it.
- **#5** [State Streaming](https://docs.copilotkit.ai/google-adk/shared-state/streaming) / [HITL Overview](https://docs.copilotkit.ai/google-adk/human-in-the-loop): the agent imports `agents.shared_chat`; the page links the showcase `shared_chat.py` (has `get_model` and `stop_on_terminal_text`), which itself imports the unpublished `agents._header_forwarding` (drop that import to run it). Blocker on Fixed Schema and Sub-agents, which don't link it (Dev blockers).
- **#11** [HITL Overview](https://docs.copilotkit.ai/google-adk/human-in-the-loop): the step snippet of `page.tsx` stops after `useHumanInTheLoop({...});` (the full file is only in the Code tab); the step-section agent tells the model to call `generate_task_steps` while the frontend tool is `book_call` (the Code-tab agent uses `book_call`); the Code-tab `route.ts` needs the unshown `@/lib/header-forwarding`.
- **#2** [Quickstart](https://docs.copilotkit.ai/google-adk/quickstart): the runtime route throws `CopilotKitIntelligence apiKey is required and cannot be blank` (500 on `/api/copilotkit/info`) until `CPK_INTELLIGENCE_API_KEY` is set; the "running without Intelligence" fallback is only in a callout after the code.
- **#13** [Render agent state in your app](https://docs.copilotkit.ai/google-adk/shared-state/rendering-in-app): `Canvas.tsx` uses `useEffect` with no `"use client"`: `You're importing a module that depends on useEffect into a React Server Component module.` `useAgent()` with no agentId needs an agent named `default`.
- **#14** [CopilotChat](https://docs.copilotkit.ai/google-adk/prebuilt-components/chat): `useAgenticChatSuggestions()` comes from `./suggestions` (imported in the Code tab, no import in the prose snippet), a file the page never shows.
- **#15** [CopilotSidebar](https://docs.copilotkit.ai/google-adk/prebuilt-components/sidebar): the Code tab's `page.tsx` imports `MainContent` from `./main-content` and `Suggestions` from `./suggestions-mount`; neither file is shown.
- **#16** [Open, close, and feedback](https://docs.copilotkit.ai/google-adk/prebuilt-components/chat-controls): `analytics` in the feedback snippet is never defined.
- **#17** [Headless UI](https://docs.copilotkit.ai/google-adk/custom-look-and-feel/headless-ui): snippets are fragments (`visible`, Avatar, cn, AttachmentChip never shown); agent `headless-simple` never registered; react-markdown / remark-gfm / lucide-react install not mentioned.
- **#18** [State Rendering](https://docs.copilotkit.ai/google-adk/generative-ui/state-rendering): `DemoLayout` is never shown; `predict_state` placement never shown.
- **#19** [Transports](https://docs.copilotkit.ai/google-adk/generative-ui/components/transports) / [Markdown mode](https://docs.copilotkit.ai/google-adk/generative-ui/components/markdown-mode): agent-side steps cover only the built-in agent and LangGraph Python (`CopilotKitMiddleware`); Markdown mode only says any other agent must put the run's context entries into its system prompt, with no ADK code for how.
- **#20** [Pausing the Agent for Input](https://docs.copilotkit.ai/google-adk/human-in-the-loop/useInterrupt) / [Headless Interrupts](https://docs.copilotkit.ai/google-adk/human-in-the-loop/headless): the page says "Not available on this framework.", yet useInterrupt still shows Code/Demo tabs with an interrupt agent.
- **#22** [WebMCP](https://docs.copilotkit.ai/google-adk/webmcp): `searchOrders()` never defined; `document.modelContext` needs a Chrome flag (not testable in the recorder's Chromium).
- **#23** [Agent App Context](https://docs.copilotkit.ai/google-adk/agent-app-context): `agent.py` imports `add_adk_fastapi_endpoint` but never creates the app or mounts it.

## Build-only
