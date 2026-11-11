"use client";
// HARNESS (G6): route-scoped provider (doc shows none for this snippet); runtime /api/copilotkit.
import { CopilotKit } from "@copilotkit/react-core/v2";
export default function L({ children }: { children: React.ReactNode }) {
  return <CopilotKit runtimeUrl="/api/copilotkit" agent="app_context" useSingleEndpoint={false}>{children}</CopilotKit>;
}
