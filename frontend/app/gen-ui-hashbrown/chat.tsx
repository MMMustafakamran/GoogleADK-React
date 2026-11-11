"use client";
// HARNESS: ./chat.tsx is imported by the Code tab's page.tsx but not shown on the page (FINDINGS.md #26); copied from the CopilotKit showcase.

import {
  CopilotChat,
  CopilotChatAssistantMessage,
} from "@copilotkit/react-core/v2";
import { HashBrownRenderMessage } from "./hashbrown-renderer";
import { useByocHashbrownSuggestions } from "./suggestions";

export function Chat() {
  useByocHashbrownSuggestions();

  return (
    <CopilotChat
      className="h-full"
      messageView={{
        // The renderer reads only `message` from the slot props; cast to the
        // wider CopilotChatAssistantMessage signature to satisfy the slot type.
        assistantMessage:
          HashBrownRenderMessage as unknown as typeof CopilotChatAssistantMessage,
      }}
    />
  );
}