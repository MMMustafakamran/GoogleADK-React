// Doc: rendering-in-app app/page.tsx (verbatim; import path ../components/Canvas resolves from app/<route>/ via HARNESS ../../ below)
import { CopilotKit, CopilotSidebar } from "@copilotkit/react-core/v2";
import { Canvas } from "../../components/Canvas" /* HARNESS: route is one level deeper than app/page.tsx */;

export default function Page() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <div className="app-shell">
        {/* Your app UI, driven by agent.state */}
        <Canvas />
        {/* Chat is just another consumer of the same agent */}
        <CopilotSidebar />
      </div>
    </CopilotKit>
  );
}
