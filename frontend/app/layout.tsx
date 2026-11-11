// HARNESS: the doc's app/layout.tsx wraps {children} in <Providers>. Here every doc-page route has its
// own provider, so the root layout keeps the doc's imports minus Providers; the quickstart route's
// <Providers> wrap is in app/quickstart/layout.tsx, exactly as the doc writes it.
import "@copilotkit/react-core/v2/styles.css";
import './globals.css';

// ...

export default function RootLayout({ children }: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
