"use client";
import { CopilotChat, useInterrupt } from "@copilotkit/react-core/v2"; // HARNESS: doc snippet shows no imports
function ApprovalInterrupt() {
  useInterrupt({
    render: ({ interrupt, resolve, cancel }) => (
      <div className="p-3 border rounded">
        <p>{interrupt?.message ?? "Approve this action?"}</p>
        <div className="mt-2 flex gap-2">
          <button onClick={() => resolve({ approved: true })}>Approve</button>
          <button onClick={() => cancel()}>Cancel</button>
        </div>
      </div>
    ),
  });
  return null;
}
// HARNESS: minimal page mounting ApprovalInterrupt + a chat
export default function Page() { return (<div style={{ height: "100vh" }}><ApprovalInterrupt /><CopilotChat /></div>); }
