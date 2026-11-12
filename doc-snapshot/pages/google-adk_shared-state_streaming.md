# State Streaming

> Stream partial agent state updates to the UI while a tool call is still running.


<!-- interactive demo: shared-state-streaming -->


## What is this?

By default, agent state only updates *between* backend checkpoints, so
a long-running tool call (writing a full document, drafting an email)
appears to the UI as one big burst at the end. For agent-native apps,
that feels broken: users expect to watch the output materialise.

**State streaming** forwards the value of a specific tool argument
straight into an agent state key *as the argument is being generated*.
The UI, subscribed via `useAgent`, re-renders every token.

## When should I use this?

Use state streaming whenever a tool's output is long-form text or a
growing structured value and you want the user to see it assemble in
real time. Common shapes:

- A collaborative writing agent that emits a document
- A research agent that accumulates a list of findings
- A planning agent that builds up a step-by-step plan

Without streaming, the user stares at a spinner. With streaming, they
see the answer grow token-by-token.

## The backend: one streaming state mapping

<Steps>
  <Step>
    ### Install the ADK + AG-UI bridge

    ```bash
    pip install ag-ui-adk
    ```

  </Step>
  <Step>
    ### Declare the predicted state mapping

    ADK state streaming uses `PredictStateMapping` to map the streaming
    `write_document` tool argument into `state["document"]`. Add
    `AGUIToolset()` to the agent so CopilotKit can forward the state deltas to
    the UI.

    
~~~~python title="shared_state_streaming_agent.py"
from __future__ import annotations

from ag_ui_adk import AGUIToolset
from ag_ui_adk.config import PredictStateMapping
from google.adk.agents import LlmAgent
from google.adk.tools import ToolContext

from agents.shared_chat import get_model, stop_on_terminal_text


def write_document(tool_context: ToolContext, document: str) -> dict:
    """Write a document into shared state.

    Whenever the user asks you to write or draft anything (essay, poem,
    email, summary, etc.), call this tool with the full content as a
    single string. The UI renders state["document"] live as you type.

    Argument name `document` mirrors langgraph-python's `write_document`
    signature so the shared D5 fixture (`tool_argument="document"`) and
    the LGP-aligned PredictStateMapping below stay in lock-step.
    """
    tool_context.state["document"] = document
    return {"status": "ok", "length": len(document)}


_INSTRUCTION = (
    "You are a collaborative writing assistant. Whenever the user asks "
    "you to write, draft, or revise any piece of text, ALWAYS call the "
    "`write_document` tool with the full content as a single string. "
    "Never paste the document into a chat message directly — the document "
    "belongs in shared state and the UI renders it live as you type."
)

shared_state_streaming_agent = LlmAgent(
    name="SharedStateStreamingAgent",
    model=get_model(),
    instruction=_INSTRUCTION,
    tools=[write_document, AGUIToolset()],
    after_model_callback=stop_on_terminal_text,
)


SHARED_STATE_STREAMING_PREDICT_STATE = [
    PredictStateMapping(
        state_key="document",
        tool="write_document",
        tool_argument="document",
        emit_confirm_tool=False,
        stream_tool_call=True,
    ),
]
~~~~


  </Step>
  <Step>
    ### Stop after the final model response

    The agent above imports `stop_on_terminal_text` and registers it as its
    `after_model_callback`. This prevents Gemini from issuing the same tool
    call again after its final text response. See the canonical
    [`stop_on_terminal_text` implementation](https://github.com/CopilotKit/CopilotKit/blob/main/showcase/integrations/google-adk/src/agents/shared_chat.py)
    when adapting the callback for your project.

  </Step>
</Steps>

The backend pattern is always the same: map one streaming tool argument
to one shared-state key. Middleware-backed frameworks usually expose
this as a declarative mapping — for example, LangGraph Python's
`StateStreamingMiddleware` with `StateItem(...)` entries, or
`copilotkitCustomizeConfig` with an `emitIntermediateState` mapping for
LangGraph TypeScript graphs. Direct SDK adapters do the same work in
their streaming loop by parsing partial tool arguments and emitting
`STATE_SNAPSHOT` whenever the mapped value changes. When the LLM streams
that argument, CopilotKit writes every partial value into shared state
before the tool even finishes executing.

```python
# src/agents/shared_state_streaming_agent.py
from __future__ import annotations

from ag_ui_adk import AGUIToolset
from ag_ui_adk.config import PredictStateMapping
from google.adk.agents import LlmAgent
from google.adk.tools import ToolContext

from agents.shared_chat import get_model, stop_on_terminal_text


def write_document(tool_context: ToolContext, document: str) -> dict:
    """Write a document into shared state.

    Whenever the user asks you to write or draft anything (essay, poem,
    email, summary, etc.), call this tool with the full content as a
    single string. The UI renders state["document"] live as you type.

    Argument name `document` mirrors langgraph-python's `write_document`
    signature so the shared D5 fixture (`tool_argument="document"`) and
    the LGP-aligned PredictStateMapping below stay in lock-step.
    """
    tool_context.state["document"] = document
    return {"status": "ok", "length": len(document)}


_INSTRUCTION = (
    "You are a collaborative writing assistant. Whenever the user asks "
    "you to write, draft, or revise any piece of text, ALWAYS call the "
    "`write_document` tool with the full content as a single string. "
    "Never paste the document into a chat message directly — the document "
    "belongs in shared state and the UI renders it live as you type."
)

shared_state_streaming_agent = LlmAgent(
    name="SharedStateStreamingAgent",
    model=get_model(),
    instruction=_INSTRUCTION,
    tools=[write_document, AGUIToolset()],
    after_model_callback=stop_on_terminal_text,
)


SHARED_STATE_STREAMING_PREDICT_STATE = [
    PredictStateMapping(
        state_key="document",
        tool="write_document",
        tool_argument="document",
        emit_confirm_tool=False,
        stream_tool_call=True,
    ),
]
```

A few things to note:

- The state key must exist in your agent state (`document` in this demo).
- The tool and argument names must match the exact LLM-facing tool call
  you want to forward (`write_document.document` here).
- When the tool call completes, its final return value is written to
  the same key, so the streamed partial eventually becomes the
  authoritative final value.

## The frontend: useAgent + OnStateChanged

The UI side is identical to any other shared-state subscription:
`useAgent` with `OnStateChanged` gives you a reactive `agent.state`.
Add `OnRunStatusChanged` if you want a "LIVE" / "done" indicator.

```typescript
// src/app/demos/shared-state-streaming/page.tsx
  // Subscribe to BOTH state changes and run-status changes. The former
  // drives the per-token document rerender; the latter toggles the
  // "LIVE" badge when the agent starts / stops.
  const { agent } = useAgent({
    agentId: "shared-state-streaming",
    updates: [UseAgentUpdate.OnStateChanged, UseAgentUpdate.OnRunStatusChanged],
  });
```

From there, `agent.state.document` is just a string that grows on every
token, and `agent.isRunning` tells you whether to show a streaming
indicator.

## Related

- **[Shared State (overview)](/google-adk/shared-state)** — the bidirectional
  read + write pattern this extends.
- **[Agent read-only context](/google-adk/shared-state/agent-readonly)** —
  for the inverse, UI → agent one-way channel.

<IntegrationGrid path="shared-state/streaming" exclude={["agno", "agent-spec", "spring-ai", "langroid"]} />
