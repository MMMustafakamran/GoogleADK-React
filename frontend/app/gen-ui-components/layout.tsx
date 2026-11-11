// HARNESS: the doc's app/layout.tsx body, scoped to this route (the root layout has no provider).
import { Providers } from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}
