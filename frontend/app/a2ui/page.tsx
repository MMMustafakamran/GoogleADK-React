"use client"; // HARNESS: page wrapper so the doc's provider snippet can mount as a route
// Doc: google-adk/generative-ui/a2ui "Pass a catalog on the provider" (verbatim below). myCatalog and children are never defined on the page.
import { CopilotKit } from "@copilotkit/react-core/v2";

export default function Page({ children }: { children?: React.ReactNode }) { // HARNESS: route wrapper
  return (
<CopilotKit runtimeUrl="/api/copilotkit" a2ui={{ catalog: myCatalog }}>
  {children}
</CopilotKit>
  );
}
