"use client";
// HARNESS: `./chat` (Chat) is imported by the page but never shown; the page says "a plain <CopilotChat /> is enough".
import { CopilotChat } from "@copilotkit/react-core/v2";

export function Chat() {
  return <CopilotChat agentId="mcp-apps" className="h-full rounded-2xl" />;
}
