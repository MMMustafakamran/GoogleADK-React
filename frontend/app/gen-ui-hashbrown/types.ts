// HARNESS: ./types.ts is imported by the Code tab's hashbrown-renderer.tsx but not shown on the page (FINDINGS.md #26); copied from the CopilotKit showcase.
export const SALES_STAGES = [
  "prospect",
  "qualified",
  "proposal",
  "negotiation",
  "closed-won",
  "closed-lost",
] as const;

export type SalesStage = (typeof SALES_STAGES)[number];