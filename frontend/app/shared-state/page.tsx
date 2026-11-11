"use client"; // HARNESS: the doc shows only fragments of page.tsx; this wrapper is guesswork
import { CopilotKit, CopilotSidebar, useAgent, UseAgentUpdate } from "@copilotkit/react-core/v2"; // HARNESS: imports never shown
import { NotesCard } from "./notes-card";

type Preferences = Record<string, unknown>; // HARNESS: never defined on the page
type RWAgentState = { preferences?: Preferences; notes?: string[] }; // HARNESS: never defined on the page

function Demo() {
  // Subscribe the component to agent state changes. Any time the agent
  // mutates its state (e.g. via its `set_notes` tool) this hook fires,
  // we re-render, and the sidebar panels reflect the new values.
  const { agent } = useAgent({
    agentId: "shared-state-read-write",
    updates: [UseAgentUpdate.OnStateChanged],
  });
  const agentState = agent.state as RWAgentState | undefined; // HARNESS: agentState never defined
  // Doc (verbatim):
  const handlePreferencesChange = (next: Preferences) => {
    agent.setState({
      ...(agentState as object | undefined),
      preferences: next,
      notes: agentState?.notes ?? [],
    } as RWAgentState);
  };
  return ( // HARNESS: layout never shown
    <div style={{ padding: 24 }}>
      <button onClick={() => handlePreferencesChange({ name: "Zara" })}>Set name Zara</button>
      <NotesCard notes={agentState?.notes ?? []} onClear={() => agent.setState({ ...agentState, notes: [] })} />
    </div>
  );
}

export default function Page() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent="shared-state-read-write">{/* HARNESS: provider never shown */}
      <Demo />
      <CopilotSidebar defaultOpen />
    </CopilotKit>
  );
}
