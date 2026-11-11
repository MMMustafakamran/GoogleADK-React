// HARNESS: `@/lib/header-forwarding` is imported by the generative-ui pages' runtime routes
// (json-render, hashbrown, mcp-apps, open-generative-ui) but never published. The routes say it
// forwards the inbound `x-aimock-context` header (showcase test tooling); minimal stand-in.
import type { NextRequest } from "next/server";

export function extractForwardedHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {};
  const v = req.headers.get("x-aimock-context");
  if (v) headers["x-aimock-context"] = v;
  return headers;
}
