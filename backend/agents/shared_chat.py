# HARNESS: `agents.shared_chat` is imported by the fixed-schema, shared-state, streaming, HITL and sub-agents
# agent files. The streaming and HITL pages link the showcase shared_chat.py (it has get_model and
# stop_on_terminal_text), but that file itself imports the unpublished `agents._header_forwarding`.
# Minimal stand-in: get_model() returns the showcase DEFAULT_MODEL string, stop_on_terminal_text is the one
# printed on the agent-readonly page. See FINDINGS.md #5.
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
