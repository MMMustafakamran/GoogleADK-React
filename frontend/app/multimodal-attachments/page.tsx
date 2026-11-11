"use client"; // HARNESS: the snippet is a bare JSX fragment; wrapped in a client page.

// --- Doc: https://docs.copilotkit.ai/google-adk/multimodal-attachments (Quick start, page.tsx, verbatim) ---
import { CopilotChat } from "@copilotkit/react-core/v2";

// HARNESS: the page shows no provider or component; mounted under the quickstart's <CopilotKit agent="my_agent">.
import { CopilotKit } from "@copilotkit/react-core/v2";

export default function MultimodalAttachmentsPage() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent="my_agent" useSingleEndpoint={false}>
      <div style={{ height: "100vh" }}>
<CopilotChat
  agentId="my_agent" // HARNESS: doc has the placeholder "my-agent" (no agent by that name); the quickstart agent is my_agent
  attachments={{ enabled: true }} // [!code highlight]
/>
      </div>
    </CopilotKit>
  );
}
