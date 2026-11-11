"use client"; // HARNESS: the snippet omits it; CopilotKit is a client component.

// --- Doc: https://docs.copilotkit.ai/google-adk/voice (Frontend, verbatim) ---
// src/app/demos/voice/page.snippet.tsx
import { CopilotChat, CopilotKit } from "@copilotkit/react-core/v2";

export default function VoicePage() {
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit-voice"
      agent="voice-demo"
      useSingleEndpoint={false}
    >
      <CopilotChat />
    </CopilotKit>
  );
}
