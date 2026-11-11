"use client";
// HARNESS (G6): minimal page mounting the doc's two components + a chat.
import { CopilotChat } from "@copilotkit/react-core/v2";
import { GovernedActionApproval, GovernedActionTool } from "./governed";
export default function Page() {
  return (<div style={{ height: "100vh" }}><GovernedActionApproval /><GovernedActionTool /><CopilotChat agentId="my_agent" /* HARNESS: quickstart agent; the page shows no agent */ /></div>);
}
