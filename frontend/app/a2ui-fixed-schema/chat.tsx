// HARNESS: ./chat is imported by the Code tab's page.tsx but not shown on the page (FINDINGS.md #8).
// Minimal stand-in: the prebuilt chat on the page's agent.
"use client";
import { CopilotChat } from "@copilotkit/react-core/v2";

export function Chat() {
  return <CopilotChat agentId="a2ui-fixed-schema" className="h-full" />;
}
