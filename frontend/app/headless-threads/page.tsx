"use client"; // HARNESS: the doc snippets have no "use client"; useState/useThreads need it.

// --- Doc: https://docs.copilotkit.ai/google-adk/headless-threads (ThreadSidebar.tsx, verbatim) ---
import { useThreads } from "@copilotkit/react-core/v2"; // [!code highlight]

function ThreadSidebar({ onSelectThread }: { onSelectThread?: (id: string) => void }) { // HARNESS: doc's ThreadSidebar takes no props, but App passes onSelectThread
  const { // [!code highlight:6]
    threads,
    isLoading,
    renameThread,
    archiveThread,
    deleteThread,
  } = useThreads({ agentId: "my-agent" });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {threads.map((thread) => (
        <div key={thread.id}>
          <span>{thread.name ?? "New conversation"}</span>
          <button onClick={() => renameThread(thread.id, "Renamed")}>
            Rename
          </button>
          <button onClick={() => archiveThread(thread.id)}>
            Archive
          </button>
        </div>
      ))}
    </div>
  );
}

// --- Doc: same page (App.tsx, verbatim) ---
import { CopilotChat } from "@copilotkit/react-core/v2"; // [!code highlight]
import { useState } from "react";

function App() {
  const [activeThreadId, setActiveThreadId] = useState<string | undefined>();

  return (
    <div className="flex">
      <ThreadSidebar onSelectThread={setActiveThreadId} />
      <CopilotChat threadId={activeThreadId} /> {/* [!code highlight] */}
    </div>
  );
}

// HARNESS: the page shows no export or provider. Mounted under the shared runtime, which already has the doc's
// server.ts CopilotKitIntelligence option (identifyUser from headers instead of the never-shown verifyAppSession).
import { CopilotKitProvider } from "@copilotkit/react-core/v2";

// HARNESS (A): CopilotChat has no agentId, so it needs agent "default" next to the sidebar's "my-agent" (runtime scoping reads ids from this file).
export default function HeadlessThreadsPage() {
  return (
    <CopilotKitProvider runtimeUrl="/api/copilotkit">
      <App />
    </CopilotKitProvider>
  );
}
