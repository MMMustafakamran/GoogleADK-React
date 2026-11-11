"use client";
// HARNESS (G6): the doc never shows the subagents page.tsx; minimal guess per its prose:
// useAgent({ updates: [OnStateChanged, OnRunStatusChanged] }) + agent.state.delegations -> DelegationLog.
import { CopilotKit, CopilotChat, useAgent, UseAgentUpdate } from "@copilotkit/react-core/v2";
import { DelegationLog } from "./delegation-log";
function Inner() {
  const { agent } = useAgent({ agentId: "subagents", updates: [UseAgentUpdate.OnStateChanged, UseAgentUpdate.OnRunStatusChanged] });
  const delegations = (agent.state as any)?.delegations ?? [];
  return (<div style={{ display: "grid", gridTemplateColumns: "1fr 420px", height: "100vh" }}>
    <DelegationLog delegations={delegations} isRunning={agent.isRunning} />
    <CopilotChat agentId="subagents" /></div>);
}
export default function Page() {
  return (<CopilotKit runtimeUrl="/api/copilotkit" agent="subagents" useSingleEndpoint={false}><Inner /></CopilotKit>);
}
