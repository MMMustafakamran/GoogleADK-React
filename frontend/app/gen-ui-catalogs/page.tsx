"use client";
import { CopilotChat } from "@copilotkit/react-core/v2";

export default function Page() {
  return (
    <>

      <CopilotChat agentId="my_agent" />{/* HARNESS: agentId -> the quickstart ADK agent */}
    </>
  );
}
