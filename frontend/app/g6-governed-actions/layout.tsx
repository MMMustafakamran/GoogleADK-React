"use client";
// HARNESS (G6): route-scoped provider (doc shows none for this snippet); runtime /api/copilotkit.
// HARNESS (A): agent my_agent -> frontend_tools (8022): quickstart agent has no AGUIToolset, so frontend HITL tools never reach the model; doc page shows no agent.
import { CopilotKit } from "@copilotkit/react-core/v2";
export default function L({ children }: { children: React.ReactNode }) {
  return <CopilotKit runtimeUrl="/api/copilotkit" agent="frontend_tools" useSingleEndpoint={false}>{children}</CopilotKit>;
}
