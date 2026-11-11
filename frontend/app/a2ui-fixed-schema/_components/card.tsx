// HARNESS: ../_components/card is imported by the Code tab's renderers.tsx but not shown on the page (FINDINGS.md #8). Minimal stand-in.
import React from "react";
export function Card({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-xl border border-neutral-200 bg-white shadow-sm ${className}`} {...props} />;
}
