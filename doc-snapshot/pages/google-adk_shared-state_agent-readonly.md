# Agent Read-Only Context

> Publish UI values to the agent as a one-way read-only channel via useAgentContext.



<!-- interactive demo: readonly-state-agent-context -->


<Callout type="info" title="See this in Inspector">
  Open Inspector on localhost. Go to **Agents**, then **Context**.
  The values you publish with `useAgentContext` appear here.

  More detail: [Inspector](/google-adk/inspector).
</Callout>


## What is this?

Sometimes you want the agent to *know* something about the current UI, like the logged-in user, the current page, or a recent activity log, but you don't want the agent to be able to modify it. That's what
`useAgentContext` is for: a one-way **UI → agent** channel for
read-only context.

Unlike full shared state (where the agent can call tools that mutate
the state back to the UI), `useAgentContext` values are pure inputs.
The agent sees them on every turn via the runtime's context injection,
but it has no setter and no tool to write them back.

## When should I use this?

Reach for `useAgentContext` instead of full shared state when:

- The value is **UI-owned** and has no meaning to the agent beyond
  "what the user is looking at right now".
- The agent should read but never write (user identity, feature flags,
  selected record, scroll position).
- You want the value to automatically unregister on unmount (e.g. the
  "current record" context disappears when you leave the page).

Think of it as "props for the agent".

## How it works in code

<Steps>
  <Step>
    ### Install the ADK + AG-UI bridge

    ```bash
    pip install ag-ui-adk
    ```

  </Step>
  <Step>
    ### Read CopilotKit context before each model call

    The adapter copies the AG-UI request's `context` list into ADK session
    state at `CONTEXT_STATE_KEY` (the public constant for `"_ag_ui_context"`).
    Read it from an instruction provider's `ctx.state`, a callback's
    `callback_context.state`, or a tool's `tool_context.state`.

    Each entry is a dictionary with `description` and `value` strings.
    Object and array values registered with `useAgentContext` arrive as JSON
    strings; use `json.loads(entry["value"])` when you need structured data.

    An instruction provider can include the context in the model's prompt.
    The fully defined callback preserves the Gemini termination safeguard
    without stopping partial responses or pending tool calls:

    ```python
    from ag_ui_adk import AGUIToolset, CONTEXT_STATE_KEY
    from google.adk.agents import LlmAgent
    from google.adk.agents.readonly_context import ReadonlyContext
    from google.adk.agents.callback_context import CallbackContext
    from google.adk.models.llm_response import LlmResponse

    def stop_on_terminal_text(
        callback_context: CallbackContext, llm_response: LlmResponse
    ) -> None:
        content = llm_response.content
        if llm_response.partial or not content or content.role != "model":
            return
        finish_reason = llm_response.finish_reason
        if getattr(finish_reason, "name", finish_reason) != "STOP":
            return
        parts = content.parts or []
        if not any(part.text for part in parts) or any(part.function_call for part in parts):
            return
        # ADK's invocation context is private; tolerate SDK changes.
        invocation = getattr(callback_context, "_invocation_context", None)
        if invocation is not None:
            try:
                invocation.end_invocation = True
            except AttributeError:
                pass

    def instructions(ctx: ReadonlyContext) -> str:
        entries = ctx.state.get(CONTEXT_STATE_KEY, [])
        context = "\n".join(
            f"{entry['description']}: {entry['value']}" for entry in entries
        )
        return (
            "Help the user using the following read-only application context.\n"
            + context
        )

    agent = LlmAgent(
        name="assistant",
        model="gemini-3.1-flash-lite",
        instruction=instructions,
        tools=[AGUIToolset()],
        after_model_callback=stop_on_terminal_text,
    )
    ```

    `AGUIToolset()` exposes frontend tools; it does not automatically add
    context to the model's instructions. The instruction provider above
    performs that step. Expose this agent through your `ADKAgent` endpoint.

  </Step>
</Steps>

Call `useAgentContext({ description, value })` once per value you want
to publish. Each call registers a dynamic context entry with the
runtime that is:

- Refreshed whenever `value` changes (React re-renders).
- Automatically removed when the component unmounts.
- Surfaced to the agent via the backend's `CopilotKitMiddleware`, which
  threads the entries into the model's message history on every turn.

```typescript
// src/app/demos/readonly-state-agent-context/page.tsx
  useAgentContext({
    description: "The currently logged-in user's display name",
    value: userName,
  });
  useAgentContext({
    description: "The user's IANA timezone (used when mentioning times)",
    value: userTimezone,
  });
  useAgentContext({
    description: "The user's recent activity in the app, newest first",
    value: recentActivity,
  });
```

The `description` is important: it's a short human-readable label the
agent sees alongside the value, so it knows what to do with it. Treat
it like a parameter docstring.

## Wire it to your own state

`useAgentContext` doesn't care where the value comes from: local
state, a React Context, Redux, a query cache, anything. The only
requirement is that the identity of the value is stable enough for
React to avoid a render loop. In the demo we use a handful of
`useState` hooks; in a real app these would likely come from an auth
provider, a router hook, and your domain state stores.

```typescript
// src/app/demos/readonly-state-agent-context/page.tsx
import React, { useState } from "react";
import {
  CopilotKit,
  CopilotPopup,
  useAgentContext,
} from "@copilotkit/react-core/v2";

import { ACTIVITIES, DemoLayout } from "./demo-layout";
import { useReadonlyStateAgentContextSuggestions } from "./suggestions";

export default function ReadonlyStateAgentContextDemo() {
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      agent="readonly-state-agent-context"
    >
      <DemoContent />
      <CopilotPopup
        agentId="readonly-state-agent-context"
        defaultOpen={true}
        labels={{ chatInputPlaceholder: "Ask about your context..." }}
      />
    </CopilotKit>
  );
}

function DemoContent() {
  const [userName, setUserName] = useState("Atai");
  const [userTimezone, setUserTimezone] = useState("America/Los_Angeles");
  const [recentActivity, setRecentActivity] = useState<string[]>([
    ACTIVITIES[0],
    ACTIVITIES[2],
  ]);
```

## Read-only, by design

Because the agent never sees a setter or a mutation tool for these
values, there's no way for a confused LLM to "update" them. That
makes `useAgentContext` the right tool whenever the value in question
is an input, not a field: the "context object passed to the agent on
every turn", rather than "shared workspace you both edit".

When you need both reads *and* writes, you want full
**[shared state](/google-adk/shared-state)** instead.

## Related

- **[Shared State (overview)](/google-adk/shared-state)** — bidirectional
  reads + writes.
- **[State streaming](/google-adk/shared-state/streaming)** — stream
  agent-written state back to the UI during a run.
