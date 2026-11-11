import { type Page } from 'playwright';
import { fileURLToPath } from 'url';
import { waitForPageReady } from './page-ready';
import { type PageActionHandler, type PageRecordConfig, type ActionContext } from '../core/types';
import { sendPrompt, waitForAgentResponseCompletion } from '../core/actions';
import { sleep } from '../core/overlays/cursor';
import { glideClick, glideTo } from './glide-click';
import { runStandardAction } from '../core/actions';
import { type DocEvidence, showFinding } from './doc-evidence';
import { checkpoint, mark, probeText } from '../core/timeline';
import { SELECTORS } from '../config/selectors.config';

/**
 * Finding clips: back to the doc, drag-select each cited text like a person, then the finding
 * pasted into Notepad in hurried casual words (AUTORECORDER.md section 2). Nothing drawn on the page.
 */
export const FINDING_NOTES: Record<string, string> = {
  "gen-ui-transports": [
    "transports page, agent side steps are only for the built-in agent and langgraph python",
    "for a langgraph python agent add CopilotKitMiddleware, nothing for google adk",
    "no adk agent code in the whole section",
    "asked to compare starter team and enterprise plans in a table",
    "agent gives a plain markdown table, no generative ui streamed or rendered",
  ].join('\n'),
  "gen-ui-markdown-mode": [
    "markdown mode page says any other agent needs one thing, put the context entries in its system prompt",
    "but never shows how for google adk, only built-in agent and langgraph python",
    "asked for the starter team enterprise plans in a table",
    "just a plain markdown table, no generative ui rendered at all",
  ].join('\n'),
  "headless-threads": [
    "page builds the thread list with useThreads agentId my-agent",
    "and opens one with CopilotChat threadId activeThreadId",
    "chat itself replies fine",
    "but the thread list stays empty, nothing to click",
    "so u cant open or switch any thread like the page shows",
  ].join('\n'),
  "gen-ui-hashbrown": [
    "hashbrown page shows only the renderer and the chat part",
    "says where available the code tab also has the runtime route and agent source",
    "for google adk theres no agent or route code at all",
    "asked for a q4 sales dashboard with a metric and pie chart",
    "agent just replies in text, nothing renders",
  ].join('\n'),
  "gen-ui-mcp-apps": [
    "route uses url process.env.MCP_SERVER_URL or mcp.excalidraw.com",
    "wired it exactly like that",
    "asked it to draw a simple flowchart",
    "agent says the excalidraw tool is not available",
    "so no mcp app ever shows up in the chat",
  ].join('\n'),
  "headless-ui": [
    "followed the quickstart, npx create-next-app@latest then the copilotkit steps",
    "todays create-next-app turns on cacheComponents in next.config",
    "with that the CopilotKit provider on this page crashes the whole route",
    "next says blocking route, unstable value randomUUID() in a Client Component",
    "so the headless chat never even shows up, page is just the error",
    "quickstart never says to turn cacheComponents off",
  ].join('\n'),
  "shared-state": [
    "page uses the CopilotKit provider from the quickstart setup",
    "create-next-app@latest now has cacheComponents on so the route dies with",
    "blocking route, unstable value randomUUID() in a Client Component",
    "notes card also crashes, Card is not defined, ui kit never shown",
    "backend shows only the LlmAgent, get_model set_notes _inject_preferences and _INSTRUCTION are never shown",
    "so u cant run the shared state demo as written",
  ].join('\n'),
  "subagents": [
    "subagents_agent.py starts with from agents.shared_chat import get_model, stop_on_terminal_text",
    "agents.shared_chat is never shown anywhere so the backend fails, ModuleNotFoundError no module named agents.shared_chat",
    "the file also never builds an ADKAgent or app",
    "frontend crashes too, blocking route unstable value randomUUID() from the quickstart setup with cacheComponents",
    "delegation-log uses SUB_AGENT_STYLE SubAgentName DelegationLogProps, never defined",
  ].join('\n'),
  "gen-ui-components": [
    "page is for google adk but the only backend is a tanstack ai openai BuiltInAgent",
    "no adk agent code in the whole components section",
    "it says already have copilotkit running, do step 3 only, so i did that on the adk quickstart agent",
    "asked for a plans table, agent just answers in markdown, no component renders",
    "also standardUI wont compile without npm install maplibre-gl, the install line doesnt have it",
  ].join('\n'),
  "gen-ui-surfaces": [
    "surfaces page has the frontend only, no adk backend anywhere",
    "wired the ProductRow fallback like the page shows on the adk quickstart agent",
    "asked for running shoes in the featured row",
    "agent cant see any products and no surface renders, just text",
    "Product and ProductRow are never defined either",
  ].join('\n'),
  "gen-ui-catalogs": [
    "catalogs page registers shopUI with generativeUI ui shopUI",
    "no adk backend shown, so ran it on the adk quickstart agent",
    "asked for two shoes as product cards",
    "agent sends back a raw html code block, no catalog components render",
  ].join('\n'),
  "gen-ui-standard-catalog": [
    "standard catalog page, generativeUI ui standardUI",
    "no adk agent code on the page or the section",
    "asked for a card with a welcome text",
    "reply is plain markdown, no catalog card renders",
  ].join('\n'),
  "gen-ui-state-actions": [
    "state and actions page, shopUI with state cart cartSchema",
    "snippets define shopUI 3 different ways and Cart CheckoutForm are never shown",
    "no adk backend either",
    "asked for a product card, got a markdown card, no state no actions",
  ].join('\n'),
  "gen-ui-theming": [
    "theming page sets --a2ui-color-accent and friends",
    "but theres no adk backend so nothing ever renders to theme",
    "asked for a card with a button",
    "got a markdown card with a blocked button, no themed component",
  ].join('\n'),
  "gen-ui-from-a2ui": [
    "from a2ui page registers appUI with Airport and Arrow renderers",
    "no adk agent code shown",
    "asked for sfo to jfk with airports and an arrow",
    "reply is just text, no airport or arrow components",
  ].join('\n'),
  "a2ui": [
    "a2ui page has only fragments",
    "CopilotKit a2ui catalog myCatalog, myCatalog is never defined, same for myAgent",
    "so the page crashes, myCatalog is not defined",
    "backend says from copilotkit import a2ui but no adk install step adds the copilotkit python package",
    "no google adk agent code at all",
  ].join('\n'),
  "a2ui-dynamic-schema": [
    "page.tsx imports Chat from ./chat",
    "./chat is never shown so next fails, module not found cant resolve ./chat",
    "the /api/copilotkit-declarative-gen-ui route is never shown either",
    "and the opt out tool is langgraph python, from ag_ui_langgraph import get_a2ui_tools, nothing for adk",
  ].join('\n'),
  "a2ui-fixed-schema": [
    "agent file starts with from agents.shared_chat import get_model, stop_on_terminal_text",
    "agents.shared_chat is never shown, ModuleNotFoundError no module named agents.shared_chat",
    "display_flight tool, LlmAgent and flight_schema.json never shown either",
    "filled the rest in to reach the page, card still says unable to display card, invalid component value",
    "so no flight card",
  ].join('\n'),
  "shared-state-agent-readonly": [
    "page.tsx imports ACTIVITIES and DemoLayout from ./demo-layout",
    "./demo-layout is never shown, same for ./suggestions",
    "next fails, module not found cant resolve ./demo-layout",
    "DemoContent is cut off before its return too, backend part is fine",
  ].join('\n'),
  "hitl": [
    "frontend snippet is cut off, Chat() ends after useHumanInTheLoop with no return or closing brace",
    "next fails to parse it, expected } got eof",
    "imports TimePickerCard from ./time-picker-card which is never shown",
    "backend does from agents.shared_chat import get_model, stop_on_terminal_text, never shown, ModuleNotFoundError",
    "agent hitl-in-chat never registered",
  ].join('\n'),
};

/** Every `text` checked against the rendered doc page HTML (2026-11-11). */
export const FINDING_EVIDENCE: Record<string, DocEvidence[]> = {
  "gen-ui-transports": [
    { text: "For a LangGraph Python agent, add CopilotKitMiddleware", caption: "Agent-side step only for built-in agent / LangGraph Python" },
  ],
  "gen-ui-markdown-mode": [
    { text: "Any other agent needs one thing: put the run's context entries into its system prompt.", caption: "No ADK agent code; plain markdown table" },
  ],
  "headless-threads": [
    { text: "useThreads({ agentId: \"my-agent\" })", caption: "Thread list stays empty" },
    { text: "<CopilotChat threadId={activeThreadId} />", caption: "No thread can be opened" },
  ],
  "gen-ui-hashbrown": [
    { text: "Where available, the Code tab also includes the imported metric-card.tsx, chart components, types.ts, suggestion setup, runtime route, and agent source.", caption: "No ADK agent / runtime route shown" },
  ],
  "gen-ui-mcp-apps": [
    { text: "url: process.env.MCP_SERVER_URL || \"https://mcp.excalidraw.com\",", caption: "Agent says the Excalidraw tool is not available" },
  ],
  "headless-ui": [
    { text: "<CopilotKit runtimeUrl=\"/api/copilotkit-mcp-apps\" agent={AGENT_ID}>", caption: "Provider crashes: Blocking Route randomUUID() with cacheComponents from create-next-app@latest" },
  ],
  "shared-state": [
    { text: "agentId: \"shared-state-read-write\",", caption: "No provider snippet on this page; route dies with Blocking Route randomUUID()" },
    { text: "tools=[set_notes, AGUIToolset()],", caption: "set_notes never shown" },
    { text: "before_model_callback=_inject_preferences,", caption: "_inject_preferences never shown" },
  ],
  "subagents": [
    { text: "from agents.shared_chat import get_model, stop_on_terminal_text", caption: "agents.shared_chat never published: ModuleNotFoundError" },
    { text: "<CopilotKit runtimeUrl=\"/api/copilotkit\" agent=\"subagents\">", caption: "Provider: Blocking Route randomUUID()" },
  ],
  "gen-ui-components": [
    { text: "npm install @copilotkit/react-core @copilotkit/runtime @tanstack/ai @tanstack/ai-openai", caption: "TanStack AI backend only, no ADK; no maplibre-gl" },
    { text: "Already have CopilotKit running? Do step 3 only.", caption: "Step 3 alone renders no component on ADK" },
    { text: "For a LangGraph Python agent, add CopilotKitMiddleware", caption: "Agent-side step only for LangGraph" },
  ],
  "gen-ui-surfaces": [
    { text: "fallback={<ProductRow products={products} />}", caption: "No ADK backend; no surface renders" },
  ],
  "gen-ui-catalogs": [
    { text: "generativeUI={{ ui: shopUI }}", caption: "No ADK backend; raw HTML reply" },
  ],
  "gen-ui-standard-catalog": [
    { text: "generativeUI={{ ui: standardUI }}", caption: "No ADK backend; markdown reply" },
  ],
  "gen-ui-state-actions": [
    { text: "state: { cart: cartSchema },", caption: "No ADK backend; no state/actions" },
  ],
  "gen-ui-theming": [
    { text: "\"--a2ui-color-accent\": \"#d97706\",", caption: "No ADK backend; nothing themed renders" },
  ],
  "gen-ui-from-a2ui": [
    { text: "generativeUI={{ ui: appUI }}", caption: "No ADK backend; no Airport/Arrow" },
  ],
  "a2ui": [
    { text: "a2ui={{ catalog: myCatalog }}", caption: "myCatalog never defined" },
    { text: "from copilotkit import a2ui", caption: "No install step for the copilotkit Python package" },
  ],
  "a2ui-dynamic-schema": [
    { text: "import { Chat } from \"./chat\";", caption: "./chat never shown: Module not found" },
    { text: "runtimeUrl=\"/api/copilotkit-declarative-gen-ui\"", caption: "Route never shown" },
    { text: "from ag_ui_langgraph import get_a2ui_tools", caption: "LangGraph code on the ADK page" },
  ],
  "a2ui-fixed-schema": [
    { text: "from agents.shared_chat import get_model, stop_on_terminal_text", caption: "agents.shared_chat never published" },
    { text: "FLIGHT_SCHEMA = _load_schema(\"flight_schema.json\")", caption: "flight_schema.json never shown" },
  ],
  "shared-state-agent-readonly": [
    { text: "import { ACTIVITIES, DemoLayout } from \"./demo-layout\";", caption: "./demo-layout never shown: Module not found" },
  ],
  "hitl": [
    { text: "from agents.shared_chat import get_model, stop_on_terminal_text", caption: "agents.shared_chat never published" },
    { text: "import { TimePickerCard, TimeSlot } from \"./time-picker-card\";", caption: "./time-picker-card never shown" },
  ],
};

/** Level-2 pages (already reported by the team): clip ends after the demo. */
export const KNOWN_ISSUE = new Set<string>([]);

export async function writeFinding(page: Page, id: string, config?: PageRecordConfig): Promise<void> {
  if (!FINDING_NOTES[id] || !config) return;
  if (KNOWN_ISSUE.has(id)) return;
  await showFinding(page, config, FINDING_EVIDENCE[id], FINDING_NOTES[id]);
}

/** The standard prompt-and-reply take, then the finding in Notepad. */
export const runStandardWithFinding: PageActionHandler = async (page, config, root, ctx) => {
  try {
    await runStandardAction(page, config, root, ctx);
  } finally {
    // A failed take still gets its explanation.
    await writeFinding(page, config.id, config);
  }
};

const NEXT_ERROR_DIALOG = 'nextjs-portal [data-nextjs-dialog], nextjs-portal [role=dialog]';

/**
 * Pages whose route never renders a chat (compile error, Blocking Route, runtime crash): don't wait
 * 60 s for an input that never comes. Show the Next error overlay, fail the take, then the finding.
 * If the chat does render (route fixed upstream), fall back to the standard take.
 */
export const runRouteErrorWithFinding: PageActionHandler = async (page, config, root, ctx) => {
  try {
    const input = page.locator(SELECTORS.chatInput).first();
    const dialog = page.locator(NEXT_ERROR_DIALOG).first();
    const which = await Promise.race([
      input.waitFor({ state: 'visible', timeout: 12000 }).then(() => 'chat' as const),
      dialog.waitFor({ state: 'visible', timeout: 12000 }).then(() => 'error' as const),
    ]).catch(() => 'none' as const);
    if (which === 'chat') {
      await runStandardAction(page, config, root, ctx);
      return;
    }
    const shown = (await dialog.isVisible().catch(() => false)) ? dialog : page.locator('body');
    const text = ((await shown.innerText().catch(() => '')) || '').replace(/\s+/g, ' ').trim().slice(0, 200);
    mark('error', text || 'route rendered no chat');
    void checkpoint('chat', 'chat input rendered', () => null);
    await glideTo(page, shown, 6000);
    ctx.fail(`Route never rendered a chat: ${text || 'no chat input, no error overlay'}`);
  } finally {
    await writeFinding(page, config.id, config);
  }
};

/**
 * Generative UI pages: the reply must render a surface (`data-generative-ui-surface`) and no
 * "Unable to display" error card. Otherwise the take fails, then the finding.
 */
export const runSurfaceWithFinding: PageActionHandler = async (page, config, root, ctx) => {
  try {
    await runStandardAction(page, config, root, ctx);
    const surface = page.locator('[data-generative-ui-surface]');
    const errorCard = page.getByText('Unable to display', { exact: false }).first();
    const rendered = (await surface.count()) > 0;
    const broken = await errorCard.isVisible().catch(() => false);
    void checkpoint('render', 'generative UI surface rendered', () => (rendered && !broken ? probeText(surface.last()) : null));
    if (broken) {
      await glideTo(page, errorCard, 2500);
      ctx.fail(`Surface error: ${(await errorCard.innerText().catch(() => '')).slice(0, 160)}`);
    } else if (!rendered) {
      ctx.fail('No generative UI surface rendered; the reply is plain text/markdown.');
    }
  } finally {
    await writeFinding(page, config.id, config);
  }
};

/**
 * Page actions for Google ADK + React (generic helpers kept from the Antigravity template). Each one drives the feature its doc page
 * teaches and checks the effect the page promises. A missing effect calls ctx.fail, so a
 * broken page records as a failing clip instead of a quiet pass.
 */

async function settle(page: Page, msgCount: number, ctx: ActionContext): Promise<void> {
  try {
    await waitForAgentResponseCompletion(page, 2500, msgCount);
  } catch (e) {
    ctx.warn(`Reply did not complete cleanly: ${String(e).slice(0, 160)}`);
  }
}

/** Frontend Tools: the agent calls change_background and the page background changes. */
export const runFrontendToolsAction: PageActionHandler = async (page, config, _root, ctx) => {
  const bg = page.locator('[data-testid="frontend-tools-background"]');
  const before = await bg.getAttribute('data-background-value').catch(() => null);
  const msgCount = await sendPrompt(page, config.prompt, { timeoutMs: 15000 });
  const changed = await page
    .waitForFunction(
      (prev) => document.querySelector('[data-testid="frontend-tools-background"]')?.getAttribute('data-background-value') !== prev,
      before,
      { timeout: 60000 },
    )
    .then(() => true)
    .catch(() => false);
  if (!changed) ctx.fail('change_background never ran: the background did not change.');
  await settle(page, msgCount, ctx);
  await sleep(2500);
};

/** Topic the last picker card showed (read before the slot is clicked; the card then collapses). */
let lastTopic: string | null = null;

/** HITL and useInterrupt: a picker appears in the chat, the user picks a slot, the run resumes. */
function pickSlotAction(slotLabel: string): PageActionHandler {
  return async (page: Page, config: PageRecordConfig, _root, ctx) => {
    const msgCount = await sendPrompt(page, config.prompt, { timeoutMs: 15000 });
    const slot = page.getByRole('button', { name: slotLabel }).first();
    const appeared = await slot.waitFor({ state: 'visible', timeout: 90000 }).then(() => true).catch(() => false);
    if (!appeared) {
      ctx.fail(`The time picker never appeared (no "${slotLabel}" button).`);
      return;
    }
    // Show the card's header first: on the useInterrupt page it reads "a call" (payload lost, FINDINGS.md #20).
    await glideTo(page, page.getByText('Book a call', { exact: false }).first(), 2500);
    lastTopic = (await page.locator('[data-testid="time-picker-card"] h3').first().textContent().catch(() => null))?.trim() ?? null;
    await glideClick(page, slot);
    await sleep(1500);
    await settle(page, msgCount, ctx);
    await sleep(3000);
  };
}

/** Headless interrupts: the hook should surface the pending interrupt. It never does on Antigravity. */
export const runHeadlessInterruptAction: PageActionHandler = async (page, config, _root, ctx) => {
  await sendPrompt(page, config.prompt, { timeoutMs: 15000 });
  const surfaced = await page
    .getByRole('button', { name: 'Tomorrow 2:00 PM' })
    .waitFor({ state: 'visible', timeout: 20000 })
    .then(() => true)
    .catch(() => false);
  if (!surfaced) mark('error');
  await glideTo(page, page.locator('[data-testid="app-surface"]'), 3000);
  await writeFinding(page, config.id, config);
  if (!surfaced) ctx.fail('Headless hook never received the interrupt: "no pending interrupt" (FINDINGS.md #31).');
};

/** Shared State: the UI writes a name into state, the agent reads it and writes a note back. */
export const runSharedStateAction: PageActionHandler = async (page, config, _root, ctx) => {
  const name = page.locator('[data-testid="pref-name"]');
  await glideClick(page, name);
  await name.pressSequentially('Zara', { delay: 120 });
  await name.blur();
  await sleep(1200);
  const msgCount = await sendPrompt(page, config.prompt, { timeoutMs: 15000 });
  const noted = await page
    .locator('[data-testid="notes-list"] li')
    .first()
    .waitFor({ state: 'visible', timeout: 90000 })
    .then(() => true)
    .catch(() => false);
  if (!noted) ctx.fail('set_notes never updated the notes panel.');
  await settle(page, msgCount, ctx);
  await glideTo(page, page.locator('[data-testid="notes-list"]'), 2500);
};

/** Inspector: run one turn, open the launcher, walk the panes the doc names. */
export const runInspectorAction: PageActionHandler = async (page, config, _root, ctx) => {
  const msgCount = await sendPrompt(page, config.prompt, { timeoutMs: 15000 });
  await settle(page, msgCount, ctx);
  const inspector = page.locator('cpk-web-inspector');
  if ((await inspector.count()) === 0) {
    ctx.fail('No <cpk-web-inspector> on the page.');
    return;
  }
  await glideClick(page, inspector.locator('button').first());
  await sleep(2500);
  for (const pane of ['Agent', 'AG-UI Events', 'Frontend Tools', 'Rich Threads']) {
    const link = inspector.getByText(pane, { exact: true }).first();
    if (await link.isVisible().catch(() => false)) {
      await glideClick(page, link);
      await sleep(3500);
    } else if (pane !== 'Frontend Tools') {
      ctx.warn(`Inspector pane "${pane}" not found.`);
    }
  }
};

export const runHitlAction = pickSlotAction('Tomorrow 2:00 PM');
const pickSlot = pickSlotAction('Tomorrow 2:00 PM');
/**
 * useInterrupt (level 2, ❌): runs only on harness wiring (the page's backend is LangGraph, #19, and
 * `gen-ui-interrupt` is never registered, #22). Even then the card reads "a call": the doc's
 * frontend reads `event.value`, empty for an Antigravity interrupt (#20).
 */
export const runUseInterruptAction: PageActionHandler = async (page, config, root, ctx) => {
  lastTopic = null;
  await pickSlot(page, config, root, ctx);
  if (lastTopic === 'a call') {
    mark('error', 'card header reads "a call": interrupt payload lost (event.value)');
    ctx.fail('The card shows "a call" instead of the topic: event.value is empty for Antigravity (FINDINGS.md #20). Backend on the page is LangGraph (#19).');
  }
  await writeFinding(page, config.id, config);
};

/** State Rendering: set_steps streams the plan into agent state; the steps panel re-renders mid-run. */
export const runStateRenderingAction: PageActionHandler = async (page, config, _root, ctx) => {
  await sendPrompt(page, config.prompt, { timeoutMs: 15000 });
  const firstStep = page.locator('[data-testid="step-item"]').first();
  const appeared = await firstStep.waitFor({ state: 'visible', timeout: 120000 }).then(() => true).catch(() => false);
  if (!appeared) {
    mark('error');
    ctx.fail('set_steps never rendered: the steps panel stayed empty.');
    return;
  }
  mark('action', 'steps rendered from agent state');
  await glideTo(page, page.locator('[data-testid="steps-panel"]'), 2000);
  // The agent mostly talks through set_steps tool calls, not chat text, so the chat-reply wait
  // gives up early. Follow the run itself: the LIVE badge (OnRunStatusChanged) goes away at the end.
  const finished = await page
    .locator('[data-testid="live-badge"]')
    .waitFor({ state: 'detached', timeout: 240000 })
    .then(() => true)
    .catch(() => false);
  if (!finished) ctx.warn('Run still LIVE after 4 minutes.');
  await sleep(2000);
  const statuses = await page.locator('[data-testid="step-item"]').evaluateAll((els) => els.map((e) => e.getAttribute('data-status')));
  if (!statuses.length || statuses.some((s) => s !== 'completed')) {
    ctx.warn(`Run ended with steps not all completed: ${statuses.join(', ')}`);
  }
  await glideTo(page, page.locator('[data-testid="steps-progress"]'), 2500);
};

/** Sub-Agents: the supervisor delegates; each sub-agent call lands in the delegation log mid-run. */
export const runSubagentsAction: PageActionHandler = async (page, config, root, ctx) => {
  try {
    await runSubagentsTake(page, config, root, ctx);
  } finally {
    // FINDINGS.md #49: on today's versions the sub-agents server never starts.
    await writeFinding(page, config.id, config);
  }
};

const runSubagentsTake: PageActionHandler = async (page, config, _root, ctx) => {
  const msgCount = await sendPrompt(page, config.prompt, { timeoutMs: 15000 });
  const entries = page.locator('[data-testid="delegation-entry"]');
  // Stop waiting as soon as the run errors (e.g. "fetch failed" when the sub-agents server is
  // down, FINDINGS.md #49): minutes of a frozen chat explain nothing.
  const runError = page.locator('[data-testid="copilot-error-banner"]').or(page.getByText(/fetch failed|Agent error/i)).first();
  const outcome = await Promise.race([
    entries.first().waitFor({ state: 'visible', timeout: 180000 }).then(() => 'delegated' as const),
    runError.waitFor({ state: 'visible', timeout: 180000 }).then(() => 'error' as const),
  ]).catch(() => 'timeout' as const);
  if (outcome !== 'delegated') {
    mark('error');
    if (outcome === 'error') await glideTo(page, runError, 2500).catch(() => {});
    await sleep(3000);
    ctx.fail(
      outcome === 'error'
        ? 'The run failed before any delegation (error shown in the chat).'
        : 'No delegation ever reached the log (agent.state.delegations stayed empty).',
    );
    return;
  }
  mark('action', 'first delegation in the log');
  await glideTo(page, entries.first(), 2000);
  await settle(page, msgCount, ctx);
  const fired = await page
    .locator('[data-testid="subagent-indicators"] [data-fired="true"]')
    .evaluateAll((els) => els.map((e) => e.getAttribute('data-role')));
  if (fired.length < 3) ctx.warn(`Supervisor called only: ${fired.join(', ') || 'none'} (doc: research, write, critique).`);
  await glideTo(page, page.locator('[data-testid="delegation-count"]'), 1500);
  // Scroll the log (the wheel scrolls what is under the cursor) so every delegation is seen.
  await glideTo(page, entries.first(), 500);
  for (let i = 0; i < 4; i++) {
    await page.mouse.wheel(0, 250);
    await sleep(700);
  }
  await sleep(1500);
};

/** Open, close, and feedback: the sidebar starts closed, so open it with the page's own button first. */
export const runChatControlsAction: PageActionHandler = async (page, config, root, ctx) => {
  const open = page.getByRole('button', { name: 'Ask the assistant' }).first();
  if (await open.isVisible({ timeout: 10000 }).catch(() => false)) {
    mark('click', 'Ask the assistant');
    await glideClick(page, open);
    await sleep(1500);
  } else {
    ctx.warn('No "Ask the assistant" button on the page.');
  }
  await runStandardAction(page, config, root, ctx);
};

// ---------------------------------------------------------------------------------------------
// Threads pages, tested with the CopilotKit Intelligence key (2026-11-10). Runtime:
// frontend/app/api/copilotkit-threads (the headless page's server.ts). Threads are per user
// (antigravity-qa-user) and persist between runs, so older rows can already be listed.
// ---------------------------------------------------------------------------------------------
const DRAWER_ROW = 'copilotkit-threads-drawer li[role="option"][data-thread-id]';
const promptHead = (config: PageRecordConfig) => config.prompt.slice(0, 24);

/** Threads Drawer: chat once, the thread is listed, New Conversation resets the chat, the row replays it. */
export const runThreadsDrawerAction: PageActionHandler = async (page, config, root, ctx) => {
  await page.locator('copilotkit-threads-drawer').first().waitFor({ state: 'attached', timeout: 30000 }).catch(() => {});
  await sleep(3000); // the drawer loads its list
  const rowsBefore = await page.locator(DRAWER_ROW).count();
  await runStandardAction(page, config, root, ctx);
  const mine = page.locator(DRAWER_ROW).filter({ hasText: promptHead(config) });
  const listed = await page
    .waitForFunction((n) => (document.querySelector('copilotkit-threads-drawer')?.shadowRoot
      ?.querySelectorAll('li[role="option"][data-thread-id]').length ?? 0) > n, rowsBefore, { timeout: 45000, polling: 500 })
    .then(() => true)
    .catch(() => false);
  void checkpoint('thread', 'the new conversation is listed in the drawer', async () => `${await page.locator(DRAWER_ROW).count()} row(s), was ${rowsBefore}`, {
    ok: () => listed,
  });
  if (!listed) {
    ctx.fail('The Threads Drawer did not list the new conversation.');
    return;
  }
  await sleep(4000); // the thread name fills in
  await glideTo(page, page.locator(DRAWER_ROW).first(), 2000);
  mark('click', 'New Conversation');
  await glideClick(page, page.getByText('New Conversation', { exact: true }).first());
  const userBubble = page.getByText(config.prompt, { exact: false }).first();
  const reset = await userBubble.waitFor({ state: 'hidden', timeout: 15000 }).then(() => true).catch(() => false);
  void checkpoint('new', '"New Conversation" clears the chat', async () => reset);
  if (!reset) ctx.fail('"New Conversation" did not reset the chat.');
  await sleep(2500);
  mark('click', 'reopen thread');
  const row = (await mine.count()) > 0 ? mine.first() : page.locator(DRAWER_ROW).first();
  await glideClick(page, row);
  const replayed = await userBubble.waitFor({ state: 'visible', timeout: 20000 }).then(() => true).catch(() => false);
  void checkpoint('replay', 'selecting the thread replays its history', () => probeText(page.getByText(config.prompt, { exact: false })));
  if (!replayed) ctx.fail('Selecting the thread in the drawer did not replay its conversation.');
  await sleep(4000);
};

/** Headless Threads: chat once, the useThreads sidebar lists it, selecting another row switches the chat, and back. */
export const runHeadlessThreadsAction: PageActionHandler = async (page, config, root, ctx) => {
  await runStandardAction(page, config, root, ctx);
  // The doc's ThreadSidebar: <div><span>{name}</span><button>Rename</button><button>Archive</button></div>
  const rows = page.locator('div:has(> button:text-is("Rename")) > span');
  const listed = await rows.first().waitFor({ state: 'visible', timeout: 45000 }).then(() => true).catch(() => false);
  void checkpoint('thread', 'the useThreads sidebar lists the thread (Rename / Archive row)', async () => `${await rows.count()} row(s)`, {
    ok: () => listed,
  });
  if (!listed) {
    ctx.fail('The chat ran, but the useThreads sidebar lists no threads.');
    return;
  }
  await sleep(4000); // the thread name fills in
  const userBubble = page.getByText(config.prompt, { exact: false }).first();
  const other = rows.filter({ hasNotText: promptHead(config) });
  if ((await other.count()) > 0) {
    mark('click', 'other thread');
    await glideClick(page, other.first());
    const switched = await userBubble.waitFor({ state: 'hidden', timeout: 20000 }).then(() => true).catch(() => false);
    void checkpoint('switch', 'selecting another thread switches the chat away from this one', async () => switched);
    if (!switched) ctx.fail('Selecting another thread in the sidebar did not switch the chat.');
    await sleep(3000);
  }
  mark('click', 'reopen thread');
  const mine = rows.filter({ hasText: promptHead(config) });
  await glideClick(page, (await mine.count()) > 0 ? mine.first() : rows.first());
  const replayed = await userBubble.waitFor({ state: 'visible', timeout: 20000 }).then(() => true).catch(() => false);
  void checkpoint('replay', 'selecting the thread replays its history', () => probeText(page.getByText(config.prompt, { exact: false })));
  if (!replayed) ctx.fail('Selecting the thread in the sidebar did not replay its conversation.');
  await sleep(4000);
};

/** headless-threads (FINDINGS.md #25): the take, then the finding. */
export const runHeadlessThreadsWithFinding: PageActionHandler = async (page, config, root, ctx) => {
  try {
    await runHeadlessThreadsAction(page, config, root, ctx);
  } finally {
    await writeFinding(page, config.id, config);
  }
};

/** Pages whose reply must render something in the chat (selector); otherwise the take fails, then the finding. */
function renderedWithFinding(selector: string, what: string): PageActionHandler {
  return async (page, config, root, ctx) => {
    try {
      await runStandardAction(page, config, root, ctx);
      const el = page.locator(selector);
      const ok = (await el.count()) > 0;
      void checkpoint('render', what, () => (ok ? probeText(el.last()) : null));
      if (!ok) ctx.fail(`Nothing rendered: ${what} missing; the reply is text only.`);
    } finally {
      await writeFinding(page, config.id, config);
    }
  };
}
/** gen-ui-hashbrown (#26): a chart/metric must render in the reply. */
export const runHashbrownWithFinding = renderedWithFinding(`${SELECTORS.assistantMessage} svg, ${SELECTORS.assistantMessage} canvas`, 'hashbrown chart in the reply');
/** gen-ui-mcp-apps (#27): the MCP app iframe must render. */
export const runMcpAppsWithFinding = renderedWithFinding('iframe', 'MCP app iframe');

// ---------------------------------------------------------------------------------------------
// ✅ pages whose effect is not a plain chat reply (CI 2026-11-11 recorded them badly).
// ---------------------------------------------------------------------------------------------

/** gen-ui-state-rendering: the agent writes into the Document pane (agent state), no chat reply. */
export const runDocumentStateAction: PageActionHandler = async (page, config, _root, ctx) => {
  await sendPrompt(page, config.prompt, { timeoutMs: 15000 });
  const content = page.locator('[data-testid="document-content"]');
  const filled = await page
    .waitForFunction(() => (document.querySelector('[data-testid="document-content"]')?.textContent ?? '').trim().length > 0, null, { timeout: 120000, polling: 500 })
    .then(() => true)
    .catch(() => false);
  if (!filled) {
    mark('error');
    ctx.fail('The Document pane stayed empty: no text streamed into agent state.');
    return;
  }
  mark('action', 'document streaming from agent state');
  await glideTo(page, content, 1500);
  // The LIVE badge (isStreaming) goes away when the run ends.
  const finished = await page
    .locator('[data-testid="document-live-badge"]')
    .waitFor({ state: 'detached', timeout: 180000 })
    .then(() => true)
    .catch(() => false);
  if (!finished) ctx.warn('Document still LIVE after 3 minutes.');
  void checkpoint('document', 'the Document pane holds the written text', () => probeText(content));
  await glideTo(page, page.locator('[data-testid="document-char-count"]'), 2500);
};

const ATTACH_FIXTURE = fileURLToPath(new URL('../fixtures/red-circle.png', import.meta.url)); // HARNESS test asset

/** multimodal-attachments: attach a small image with the chat's "+" control, then ask about it. */
export const runAttachmentsAction: PageActionHandler = async (page, config, root, ctx) => {
  const add = page.locator('[data-testid="copilot-add-menu-button"]').first();
  let attached = false;
  if (await add.isVisible({ timeout: 15000 }).catch(() => false)) {
    mark('click', 'Add attachments');
    await glideClick(page, add);
    await sleep(800);
    const item = page.getByRole('menuitem').filter({ hasText: /attach|upload|file|photo|image/i }).first();
    const chooser = page.waitForEvent('filechooser', { timeout: 8000 }).catch(() => null);
    if (await item.isVisible({ timeout: 3000 }).catch(() => false)) await glideClick(page, item);
    const fc = await chooser;
    if (fc) {
      await fc.setFiles(ATTACH_FIXTURE);
      attached = true;
    }
  }
  if (!attached) {
    // No chooser opened (menu shape changed): put the file on the chat's own file input.
    await page.keyboard.press('Escape').catch(() => {});
    const input = page.locator('input[type="file"]').first();
    attached = await input.setInputFiles(ATTACH_FIXTURE).then(() => true).catch(() => false);
  }
  const queued = page.locator('[data-testid="copilot-attachment-queue"]').first();
  const shown = attached && (await queued.waitFor({ state: 'visible', timeout: 15000 }).then(() => true).catch(() => false));
  void checkpoint('attach', 'the image shows in the attachment queue', async () => shown);
  if (!shown) {
    mark('error');
    ctx.fail('The attach control did not queue the image.');
    return;
  }
  mark('action', 'image attached');
  await glideTo(page, queued, 1500);
  await runStandardAction(page, config, root, ctx);
  const sent = page.locator('img[src^="data:"], img[src^="blob:"], img[alt*="red-circle"]').first();
  void checkpoint('sent', 'the sent message carries the image', async () => (await sent.count()) > 0);
};

const JSON_RENDER_OUTPUT = '[data-testid="metric-card"], [data-testid="bar-chart"], [data-testid="pie-chart"]';

/**
 * Wait for the json-render output, or for a text-only reply that has stopped changing.
 * The page swaps in its own assistant message slot and the agent can take over 30 s, so the
 * standard reply wait (which threw in CI and locally on the raw-JSON reply) is not used.
 */
async function waitJsonRender(page: Page, timeoutMs: number): Promise<'rendered' | 'text' | 'timeout'> {
  const deadline = Date.now() + timeoutMs;
  let last = '';
  let stableSince = Date.now();
  while (Date.now() < deadline) {
    if (await page.locator(JSON_RENDER_OUTPUT).first().isVisible().catch(() => false)) return 'rendered';
    const text = await page.locator(SELECTORS.assistantMessage).last().innerText({ timeout: 1000 }).catch(() => '');
    if (text !== last) {
      last = text;
      stableSince = Date.now();
    } else if (text.trim().length > 0 && Date.now() - stableSince > 10000) {
      return 'text';
    }
    await sleep(1000);
  }
  return 'timeout';
}

/** gen-ui-json-render: the reply must render a metric card or chart; one retry in a new thread. */
export const runJsonRenderAction: PageActionHandler = async (page, config, _root, ctx) => {
  for (let attempt = 1; attempt <= 2; attempt++) {
    await sendPrompt(page, config.prompt, { timeoutMs: 15000 });
    const outcome = await waitJsonRender(page, 150000);
    const out = page.locator(JSON_RENDER_OUTPUT);
    void checkpoint('render', `json-render dashboard (try ${attempt})`, async () => (outcome === 'rendered' ? probeText(out.first()) : outcome));
    if (outcome === 'rendered') {
      await sleep(3000); // the rest of the spec streams in
      mark('action', 'dashboard rendered');
      await glideTo(page, out.first(), 2500);
      if ((await out.count()) > 1) await glideTo(page, out.last(), 2500);
      return;
    }
    if (attempt === 1) {
      ctx.warn(`No metric card or chart rendered (${outcome}); retrying once in a new thread.`);
      await sleep(2000);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await waitForPageReady(page, { label: config.id });
    }
  }
  mark('error');
  ctx.fail('No metric card or chart rendered after two tries: the reply stayed raw JSON / text.');
};
