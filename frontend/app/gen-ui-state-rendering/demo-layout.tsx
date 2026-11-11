"use client";
// HARNESS: `./demo-layout` (DemoLayout) is imported by the page but never shown. The page has no chat,
// so the reader has to guess one; stand-in = DocumentView (published) beside a CopilotChat.
import { CopilotChat } from "@copilotkit/react-core/v2";
import { DocumentView } from "./document-view";

export function DemoLayout({ document, isStreaming }: { document: string; isStreaming: boolean }) {
  return (
    <div className="flex h-screen w-full">
      <div className="flex-1 overflow-auto p-4">
        <DocumentView content={document} isStreaming={isStreaming} />
      </div>
      <div className="w-[420px] border-l">
        <CopilotChat agentId="shared-state-streaming" className="h-full" />
      </div>
    </div>
  );
}
