# Doc: google-adk/shared-state/agent-readonly (verbatim)
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
