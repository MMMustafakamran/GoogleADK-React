// HARNESS: plain index of the doc-page routes. The doc's app/page.tsx lives at app/quickstart/page.tsx.
// Each page route wraps itself in its own <CopilotKit> provider pointed at /api/copilotkit.
import Link from "next/link";

const ROUTES: { href: string; label: string }[] = [
  { href: "/quickstart", label: "Quickstart (use an existing agent)" },
  // page agents: add { href: "/<route>", label: "<doc page title>" } here
];

export default function Index() {
  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>GoogleADK-React QA harness</h1>
      <ul>
        {ROUTES.map((r) => (
          <li key={r.href}><Link href={r.href}>{r.label}</Link></li>
        ))}
      </ul>
    </main>
  );
}
