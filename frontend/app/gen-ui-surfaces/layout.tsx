"use client";
// HARNESS: route-scoped provider wrapping the doc's provider snippet (the root layout has none).
import { CopilotKitProvider } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css"; // HARNESS: stylesheet from the components page step 3
import { shopUI } from "./catalog"; // HARNESS: catalog from the Catalogs page (the surfaces page imports ./catalog without showing it)

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <CopilotKitProvider runtimeUrl="/api/copilotkit" generativeUI={{ ui: shopUI }}>
      {children}
    </CopilotKitProvider>
  );
}
