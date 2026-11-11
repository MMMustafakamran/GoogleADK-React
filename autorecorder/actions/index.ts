/**
 * Which handler serves which page id. Pages not listed here use runStandardAction
 * (send the page's prompt, wait for the reply).
 */
import { type ActionContext, type PageActionHandler, type PageRecordConfig } from '../core/types';
import { runStandardAction } from '../core/actions';
import { type Page } from 'playwright';

import { waitForPageReady } from './page-ready';
import {
  runFrontendToolsAction,
  runHeadlessInterruptAction,
  runHitlAction,
  runInspectorAction,
  runSharedStateAction,
  runStandardWithFinding,
  runStateRenderingAction,
  runSubagentsAction,
  runChatControlsAction,
  runUseInterruptAction,
  runThreadsDrawerAction,
  runHeadlessThreadsAction,
  runRouteErrorWithFinding,
  runSurfaceWithFinding,
  runHeadlessThreadsWithFinding,
  runHashbrownWithFinding,
  runMcpAppsWithFinding,
  runDocumentStateAction,
  runAttachmentsAction,
  runJsonRenderAction,
} from './adk.actions';

/** Keys are page ids from `config/pages.config.ts`. Doctor flags any orphans. */
export const ACTION_MAP: Record<string, PageActionHandler> = {
  // Level-1 pages whose route never renders a chat (Blocking Route, Module not found, parse error, crash).
  'headless-ui': runRouteErrorWithFinding,
  'shared-state': runRouteErrorWithFinding,
  subagents: runRouteErrorWithFinding,
  a2ui: runRouteErrorWithFinding,
  'a2ui-dynamic-schema': runRouteErrorWithFinding,
  'shared-state-agent-readonly': runRouteErrorWithFinding,
  hitl: runRouteErrorWithFinding,
  // Level-1 generative UI pages: the reply must render a surface.
  'gen-ui-components': runSurfaceWithFinding,
  'gen-ui-surfaces': runSurfaceWithFinding,
  'gen-ui-catalogs': runSurfaceWithFinding,
  'gen-ui-standard-catalog': runSurfaceWithFinding,
  'gen-ui-state-actions': runSurfaceWithFinding,
  'gen-ui-theming': runSurfaceWithFinding,
  'gen-ui-from-a2ui': runSurfaceWithFinding,
  'a2ui-fixed-schema': runSurfaceWithFinding,
  'gen-ui-transports': runSurfaceWithFinding,
  'gen-ui-markdown-mode': runSurfaceWithFinding,
  // Track A follow-up (FINDINGS.md #25-#27).
  'headless-threads': runHeadlessThreadsWithFinding,
  'gen-ui-hashbrown': runHashbrownWithFinding,
  'gen-ui-mcp-apps': runMcpAppsWithFinding,
  // Plain ✅ clip: open the chat with the first "Ask the assistant" button before typing.
  'chat-controls': runChatControlsAction,
  // ✅ pages whose effect is not a plain chat reply.
  'gen-ui-state-rendering': runDocumentStateAction,
  'multimodal-attachments': runAttachmentsAction,
  'gen-ui-json-render': runJsonRenderAction,
};

export async function executePageAction(
  page: Page,
  config: PageRecordConfig,
  rootPath: string,
  ctx: ActionContext,
): Promise<void> {
  // A dev server compiles client chunks lazily, so markup can be on screen before
  // anything is wired to it. Wait for the page to settle before any handler runs.
  await waitForPageReady(page, { label: config.id });

  const handler = ACTION_MAP[config.id] ?? runStandardAction;
  await handler(page, config, rootPath, ctx);
}
