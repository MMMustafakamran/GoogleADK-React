"use client"; // HARNESS: the doc shows only the useAgent fragment; everything else is guesswork
import { CopilotKit, CopilotSidebar, useAgent, UseAgentUpdate } from "@copilotkit/react-core/v2"; // HARNESS

function Doc() {
  // Subscribe to BOTH state changes and run-status changes. The former
  // drives the per-token document rerender; the latter toggles the
  // "LIVE" badge when the agent starts / stops.
  const { agent } = useAgent({
    agentId: "shared-state-streaming",
    updates: [UseAgentUpdate.OnStateChanged, UseAgentUpdate.OnRunStatusChanged],
  });
  const doc = (agent.state as { document?: string } | undefined)?.document; // HARNESS
  return (
    <div style={{ padding: 24 }}>
      <div>{agent.isRunning ? "LIVE" : "done"}</div>
      <pre data-testid="document" style={{ whiteSpace: "pre-wrap" }}>{doc ?? "(no document yet)"}</pre>
    </div>
  );
}

export default function Page() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent="shared-state-streaming">{/* HARNESS */}
      <Doc />
      <CopilotSidebar defaultOpen />
    </CopilotKit>
  );
}
