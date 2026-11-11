/**
 * One entry per tested doc page of https://docs.copilotkit.ai/google-adk, in the order
 * the clips are numbered. docUrl, demoUrl and the filename are derived from project.config.ts.
 *
 * Every demo route is served from the root of the app (demoSuffix is ''), because this harness
 * puts each doc page on its own route rather than a `/demo-chat` sub-page.
 * Not registered: intelligence/*, backend/*, deploy pages (QA-RULES §9).
 */
import { definePages } from '../core/types';

/** Registered but not recorded, with the reason printed on every run. */
export const SKIP_RECORDING: Record<string, string> = {};

export const PAGES = definePages([
  {
    id: 'quickstart',
    name: 'Quickstart (use an existing agent)',
    videoName: 'Quickstart',
    docPath: 'quickstart',
    route: 'quickstart',
    // Versions first: they're what makes the clip evidence.
    ideFile: 'frontend/VERSIONS.md',
    startLine: 6,
    endLine: 20,
    extraTabs: [
      { filePath: 'frontend/package.json', startLine: 11, endLine: 19 },
      { filePath: 'backend/main.py', startLine: 1, endLine: 24 },
      { filePath: 'frontend/app/api/copilotkit/[[...slug]]/route.ts', startLine: 1, endLine: 40 },
      { filePath: 'frontend/app/layout.tsx', startLine: 1, endLine: 15 },
      { filePath: 'frontend/app/quickstart/page.tsx', startLine: 1, endLine: 14 },
    ],
    prompt: 'Tell me in one sentence what this app can do.',
    waitAfterPromptMs: 3000,
  },
  // Page agents: add one entry per doc page below (id, name, videoName, docPath, route, ideFile, lines, prompt).
]);
