# State Rendering

> Render your agent's state with custom UI components in real-time.


<!-- interactive demo: shared-state-streaming -->


## What is this?

State rendering lets you build UI that reflects your agent's state in real-time. As your agent progresses through nodes and emits state updates, your frontend renders those changes, showing progress, drafts, or intermediate results.

<Callout type="info">
  **Free course:** See this pattern built end-to-end in [Build Interactive Agents with Generative UI](https://www.deeplearning.ai/short-courses/build-interactive-agents-with-generative-ui/) — a free DeepLearning.AI short course taught by CopilotKit's CEO covering the full Generative UI spectrum (Controlled, Declarative, and Open-Ended).
</Callout>

## When should I use this?

Use state rendering when you want to:

- Show real-time progress (e.g. "Researching... 2/5 complete")
- Display drafts that update as the agent works
- Build dashboards that reflect agent state
- Render structured output outside of the chat

## How it works in code

On the frontend, subscribe to the agent's state. Each time the backend
forwards a fresh value, your component re-renders with the latest partial
output.

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

On the backend, a state-streaming mapping forwards a specific tool argument
straight into a state key *as it's being generated*. Some frameworks provide
that as middleware; direct SDK adapters can emit `STATE_SNAPSHOT` events from
their streaming loop. Either way, the UI can watch the answer assemble
token-by-token rather than appearing in one burst between checkpoints.

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

<IntegrationGrid
  path="generative-ui/state-rendering"
  exclude={["agno", "agent-spec"]}
/>
