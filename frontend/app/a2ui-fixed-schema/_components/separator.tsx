// HARNESS: ../_components/separator is imported by the Code tab's renderers.tsx but not shown on the page (FINDINGS.md #8). Minimal stand-in.
import React from "react";
export function Separator({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div role="separator" className={`h-px ${className}`} {...props} />;
}
