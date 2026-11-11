"use client";
// HARNESS: `./chat` (Chat) is imported by the page but never shown; the page says "render <CopilotChat>".
import { CopilotChat } from "@copilotkit/react-core/v2";

export function Chat() {
  return <CopilotChat agentId="open-gen-ui" className="h-full rounded-2xl" />;
}
