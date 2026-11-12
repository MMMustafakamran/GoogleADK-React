# Frontend Tools

> Let your agent interact with and update your application's UI.



<!-- interactive demo: frontend-tools -->


<Callout type="info" title="See this in Inspector">
  Open Inspector on localhost. Go to **Agents**, then **Frontend Tools**.
  Your tool and its schema are listed.

  More detail: [Inspector](/google-adk/inspector).
</Callout>


## What is this?

Frontend tools let your agent define and invoke client-side functions that run entirely in the user's browser. Because the handler executes on the frontend, it has direct access to component state, browser APIs, and any third-party UI library the page already uses. That's how an agent can "reach into" the app: update React state, trigger animations, read `localStorage`, pop a toast, or steer the user's view.

This page covers the "agent drives the UI" shape of frontend tools. The same primitive also powers Generative UI and Human-in-the-loop; see those pages for interaction patterns.

## When should I use this?

Use frontend tools when your agent needs to:

- Read or modify React component state
- Access browser APIs like `localStorage`, `sessionStorage`, or cookies
- Trigger UI updates, animations, or transitions
- Show alerts, toasts, or notifications
- Interact with third-party frontend libraries
- Perform anything that requires the user's immediate browser context

## How it works in code

<Steps>
  <Step>
    ### Install the ADK + AG-UI bridge

    ```bash
    pip install ag-ui-adk
    ```

  </Step>
  <Step>
    ### Add `AGUIToolset()` to your agent

    `AGUIToolset()` exposes CopilotKit's frontend tools to the model.
    Add it to your `LlmAgent`'s `tools=` list. Use an ADK-supported model
    available to your project.

    The callback below preserves the Gemini termination safeguard: it stops on
    final text with a `STOP` finish reason, while leaving partial responses and
    pending tool calls alone. It is defined here in full, not imported from
    `ag-ui-adk` or a showcase-only module.

    ```python
    from ag_ui_adk import AGUIToolset
    from google.adk.agents import LlmAgent
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


    agent = LlmAgent(
        name="assistant",
        model="gemini-3.1-flash-lite",
        instruction="Help the user and call the available frontend tools when appropriate.",
        tools=[AGUIToolset()],
        after_model_callback=stop_on_terminal_text,
    )
    ```

  </Step>
</Steps>

Register a frontend tool with `useFrontendTool`. Give it a name, a Zod schema for parameters, and a handler. The agent can then call it like any other tool and your frontend runs it in the browser.

```typescript
// src/app/demos/frontend-tools/page.tsx
import React, { useState } from "react";
import {
  CopilotKit,
  CopilotSidebar,
  useFrontendTool,
} from "@copilotkit/react-core/v2";
import { z } from "zod";
import { Background, DEFAULT_BACKGROUND } from "./background";
import { useFrontendToolsSuggestions } from "./suggestions";

export default function FrontendToolsDemo() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent="frontend_tools">
      <Chat />
    </CopilotKit>
  );
}

function Chat() {
  const [background, setBackground] = useState<string>(DEFAULT_BACKGROUND);

  useFrontendTool({
    name: "change_background",
    description:
      "Change the page background. Accepts any valid CSS background value — colors, linear or radial gradients, etc.",
    parameters: z.object({
      background: z
        .string()
        .describe("The CSS background value. Prefer gradients."),
    }),
    handler: async ({ background }) => {
      setBackground(background);
      return { status: "success" };
    },
  });
```

The handler receives the parsed, type-safe parameters and can do anything
the browser can: update state, call an API, touch the DOM. Its return value
is sent back to the agent as the tool result so the model can reason about
what happened.

```typescript
// src/app/demos/frontend-tools/page.tsx
    handler: async ({ background }) => {
      setBackground(background);
      return { status: "success" };
    },
```

## Registering a list of tools

`useFrontendTool` registers one tool per call, so it cannot be called in a loop
over a list whose length changes between renders. When the set of tools comes
from state, from props, or from a backend response, use
[`useFrontendTools`](/reference/hooks/useFrontendTools) instead. It takes an
array and runs a single effect over it, so the array can be empty on one render
and hold twenty entries on the next.

```tsx
useFrontendTools(
  reports.map((report) => ({
    name: `open_${report.id}`,
    description: `Open the ${report.title} report`,
    handler: async () => navigate(`/reports/${report.id}`),
  })),
  [navigate],
);
```

Tools that leave the array are unregistered, tools that join it are registered,
and a re-render that produces an equal list does not re-register anything. A
description built from your data stays current on its own. The second argument
is for values a handler closes over, such as `navigate` above.

<IntegrationGrid path="frontend-tools" />
