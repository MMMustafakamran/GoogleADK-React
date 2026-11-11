import {
  CopilotKitIntelligence,
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { HttpAgent } from "@ag-ui/client";

// HARNESS: every page agent is registered in this one runtime (below), but the browser opens one
// Intelligence socket per registered agent and with ~20 the thread join times out ("Timed out joining
// channel"). So each request gets a runtime holding only the agents its page uses (see handlerFor below).
const ALL_AGENTS = {
    my_agent: new HttpAgent({ url: "http://localhost:8020/" }), // HARNESS: port 8000 -> 8020 (QA-RULES §4)
    // HARNESS: the shared runtime for every page route. Page agents register their agent here by name:
    // my_page_agent: new HttpAgent({ url: "http://localhost:8021/" }), // HARNESS: <doc page> agent on 8021
    "gen-ui-tool-based": new HttpAgent({ url: "http://localhost:8023/gen-ui-tool-based" }), // HARNESS (G3): components-as-tools agent on 8023; page's route.ts uses AGENT_URL=:8000 + registry never shown
    "tool-rendering": new HttpAgent({ url: "http://localhost:8023/tool-rendering" }), // HARNESS (G3): tool-rendering agent on 8023; doc never shows registration
    frontend_tools: new HttpAgent({ url: "http://localhost:8022/frontend_tools" }), // HARNESS (G2): frontend-tools agent on 8022; doc never shows registration
    "reasoning-default": new HttpAgent({ url: "http://localhost:8022/reasoning" }), // HARNESS (G2): reasoning-messages; doc shows no agent/registration
    "reasoning-custom": new HttpAgent({ url: "http://localhost:8022/reasoning" }), // HARNESS (G2): generative-ui/reasoning; doc shows no agent/registration
    // HARNESS (G1): chat/sidebar/popup/headless-ui use agent ids never shown registered or backed; quickstart agent on :8020.
    agentic_chat: new HttpAgent({ url: "http://localhost:8020/" }),
    "prebuilt-sidebar": new HttpAgent({ url: "http://localhost:8020/" }),
    "prebuilt-popup": new HttpAgent({ url: "http://localhost:8020/" }),
    "headless-simple": new HttpAgent({ url: "http://localhost:8020/" }),
    // HARNESS (G6): HITL/subagents doc agents can't start (agents.shared_chat missing), ids never registered by doc; point at quickstart :8020.
    "hitl-in-chat": new HttpAgent({ url: "http://localhost:8020/" }),
    subagents: new HttpAgent({ url: "http://localhost:8020/" }),
    // HARNESS (G6): agent-app-context agent (doc agent.py + endpoint lines) on 8026.
    app_context: new HttpAgent({ url: "http://localhost:8026/" }),
    // HARNESS (G5): shared-state / a2ui page agent ids are never registered by the docs; G5 app on 8025 (g5_app.py).
    "shared-state-read-write": new HttpAgent({ url: "http://localhost:8025/shared-state" }),
    "shared-state-streaming": new HttpAgent({ url: "http://localhost:8025/streaming" }),
    "readonly-state-agent-context": new HttpAgent({ url: "http://localhost:8025/readonly" }),
    "a2ui-fixed-schema": new HttpAgent({ url: "http://localhost:8025/a2ui-fixed" }),
    // HARNESS (G5): rendering-in-app uses useAgent() with no agentId = "default"; quickstart agent on 8020.
    default: new HttpAgent({ url: "http://localhost:8020/" }),
    // HARNESS (A): headless-threads useThreads({ agentId: "my-agent" }) id never registered by the doc; quickstart agent on 8020.
    "my-agent": new HttpAgent({ url: "http://localhost:8020/" }),
    "declarative-gen-ui": new HttpAgent({ url: "http://localhost:8020/" }),
};

const makeRuntime = (agents: Record<string, HttpAgent>) => new CopilotRuntime({
  agents,
  intelligence: new CopilotKitIntelligence({
    apiKey: process.env.CPK_INTELLIGENCE_API_KEY!,
  }),
  // Threads are per-user. Without this, every visitor shares one history.
  identifyUser: (request) => ({
    id: request.headers.get("x-user-id") ?? "anonymous",
    name: request.headers.get("x-user-name") ?? "Anonymous",
  }),
});

// HARNESS (begin): per-page agent scoping. The page is read from the Referer; its agents are the
// registered ids that appear in its own source folder. Doc behaviour (Intelligence, identifyUser) is unchanged.
import fs from "node:fs";
import path from "node:path";
const APP_DIR = path.join(process.cwd(), "app");
const handlers = new Map<string, ReturnType<typeof createCopilotRuntimeHandler>>();
function agentsFor(pagePath: string): string[] {
  const dir = path.join(APP_DIR, ...pagePath.split("/").filter(Boolean));
  const found = new Set<string>();
  const walk = (d: string) => {
    let entries: fs.Dirent[] = [];
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const f = path.join(d, e.name);
      if (e.isDirectory()) { if (e.name !== "api") walk(f); continue; }
      if (!/\.(tsx?|jsx?)$/.test(e.name)) continue;
      const src = fs.readFileSync(f, "utf8");
      for (const id of Object.keys(ALL_AGENTS)) if (src.includes(`"${id}"`) || src.includes(`'${id}'`)) found.add(id);
    }
  };
  if (pagePath && pagePath !== "/") walk(dir);
  // useAgent() / providers without an id resolve "default"; shared files (app/providers.tsx) use my_agent,
  // which the folder walk can't see, so both are always included. Capped near 3 agents (socket timeout above).
  const extra = [...found].filter((id) => id !== "my_agent" && id !== "default").sort().slice(0, 2);
  return ["default", "my_agent", ...extra].sort();
}
function handlerFor(request: Request) {
  let page = "/";
  try { page = new URL(request.headers.get("referer") ?? "").pathname; } catch {}
  const ids = agentsFor(page);
  const key = ids.join(",");
  let h = handlers.get(key);
  if (!h) {
    const agents = Object.fromEntries(ids.map((id) => [id, ALL_AGENTS[id as keyof typeof ALL_AGENTS]]));
    h = createCopilotRuntimeHandler({ runtime: makeRuntime(agents), basePath: "/api/copilotkit" });
    handlers.set(key, h);
  }
  return h;
}
const handler = (request: Request) => handlerFor(request)(request);
// HARNESS (end)

export const GET = handler;
export const POST = handler;
