# G2 page agents on 8022, one FastAPI app (HARNESS: several pages mounted on one port).
from fastapi import FastAPI
from ag_ui_adk import ADKAgent, add_adk_fastapi_endpoint

# --- Doc: https://docs.copilotkit.ai/google-adk/frontend-tools (Add AGUIToolset() to your agent, verbatim) ---
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
# --- end doc ---

# HARNESS: the doc shows only the LlmAgent; wrapping/serving copied from the quickstart (main.py).
frontend_tools_agent = ADKAgent(adk_agent=agent, app_name="frontend_tools", user_id="demo_user",
                                session_timeout_seconds=3600, use_in_memory_services=True)


# HARNESS: Voice and both Reasoning pages show no ADK agent at all (voice: "agent_server.py" mounts /voice,
# never shown; reasoning: no model/agent that emits reasoning). Stand-in = the quickstart agent from main.py.
def _quickstart(app_name: str) -> ADKAgent:
    return ADKAgent(
        adk_agent=LlmAgent(name="assistant", model="gemini-3.8-flash", instruction="Be helpful and fun!"),
        app_name=app_name, user_id="demo_user", session_timeout_seconds=3600, use_in_memory_services=True,
    )


app = FastAPI()
add_adk_fastapi_endpoint(app, frontend_tools_agent, path="/frontend_tools")
add_adk_fastapi_endpoint(app, _quickstart("voice"), path="/voice")
add_adk_fastapi_endpoint(app, _quickstart("reasoning"), path="/reasoning")
