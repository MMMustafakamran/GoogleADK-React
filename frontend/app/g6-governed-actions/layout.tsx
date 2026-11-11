"use client";
// HARNESS (G6): route-scoped provider (doc shows none for this snippet); runtime /api/copilotkit.
// The page shows no agent: the quickstart agent (my_agent) is used, as a reader following the docs has it.
import { CopilotKit } from "@copilotkit/react-core/v2";
export default function L({ children }: { children: React.ReactNode }) {
  return <CopilotKit runtimeUrl="/api/copilotkit" agent="my_agent" useSingleEndpoint={false}>{children}</CopilotKit>;
}
