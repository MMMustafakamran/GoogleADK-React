// HARNESS: ../_components/badge is imported by the Code tab's renderers.tsx but not shown on the page (FINDINGS.md #8). Minimal stand-in.
import React from "react";
export function Badge({ className = "", variant: _variant, ...props }: React.HTMLAttributes<HTMLSpanElement> & { variant?: string }) {
  return <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${className}`} {...props} />;
}
