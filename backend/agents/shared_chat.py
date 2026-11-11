# HARNESS: `agents.shared_chat` is imported by the shared-state, streaming and fixed-schema pages but never
# published on them. The streaming page links the showcase file, which itself needs an unpublished
# `agents._header_forwarding`. Minimal stand-in: get_model() returns the showcase DEFAULT_MODEL string,
# stop_on_terminal_text is the one printed on the agent-readonly page.
from google.adk.agents.callback_context import CallbackContext
from google.adk.models.llm_response import LlmResponse


def get_model():
    return "gemini-3.1-flash-lite"  # HARNESS: showcase DEFAULT_MODEL


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
    invocation = getattr(callback_context, "_invocation_context", None)
    if invocation is not None:
        try:
            invocation.end_invocation = True
        except AttributeError:
            pass
