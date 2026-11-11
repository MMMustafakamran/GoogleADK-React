// HARNESS: the page renders chat with no <CopilotKit> shown; wrap it in the quickstart's Providers (agent my_agent on :8020).
import { Providers } from "../../providers";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}
