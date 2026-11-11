"use client";
// HARNESS: route-scoped provider wrapping the doc's provider snippet (the root layout has none).
import { CopilotKitProvider } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css"; // HARNESS: stylesheet from the components page step 3
import { standardUI } from "@copilotkit/react-core/v2/generative-ui";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <CopilotKitProvider
      runtimeUrl="/api/copilotkit"
      generativeUI={{
        ui: standardUI,
        theme: {
          "--a2ui-color-accent": "#d97706",
          "--a2ui-font-family": "Inter, sans-serif",
          "--a2ui-radius-md": "10px",
        },
      }}
    >
      {children}
    </CopilotKitProvider>
  );
}
