// HARNESS: the doc's app/layout.tsx body, scoped to the quickstart route (see app/layout.tsx).
import { Providers } from "../providers";

export default function QuickstartLayout({ children }: {children: React.ReactNode}) {
  return (
    <Providers>
      {children}
    </Providers>
  );
}
