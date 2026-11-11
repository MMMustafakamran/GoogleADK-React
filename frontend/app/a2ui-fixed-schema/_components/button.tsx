// HARNESS: ../_components/button is imported by the Code tab's renderers.tsx but not shown on the page (FINDINGS.md #8). Minimal stand-in.
import React from "react";
export function Button({ className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`rounded-md bg-neutral-900 px-4 py-2 text-sm text-white ${className}`} {...props} />;
}
