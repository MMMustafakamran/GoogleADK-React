"use client"; // HARNESS: route wrapper; the page shows no page component for this demo
import { CopilotKit, CopilotChat } from "@copilotkit/react-core/v2";
import { catalog } from "./a2ui/catalog"; // HARNESS: doc snippet uses undefined `myCatalog`; the catalog.ts export is `catalog`
const myCatalog = catalog; // HARNESS: see above

export default function Page() {
  const children = <CopilotChat agentId="a2ui-fixed-schema" />; // HARNESS: chat surface never shown; agent id from the doc runtime snippet
  return (
    // Doc (verbatim) + HARNESS agent="a2ui-fixed-schema" (doc names it only in the runtime snippet)
<CopilotKit runtimeUrl="/api/copilotkit" a2ui={{ catalog: myCatalog }} agent="a2ui-fixed-schema">
  {children}
</CopilotKit>
  );
}
