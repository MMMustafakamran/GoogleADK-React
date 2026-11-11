# HARNESS: one FastAPI app on 8025 mounting the G5 page agents at separate paths (brief: one app per group).
# The pages only say "Expose this agent through your ADKAgent endpoint"; ADKAgent wiring follows the quickstart.
from fastapi import FastAPI
from ag_ui_adk import ADKAgent, add_adk_fastapi_endpoint

from agents.shared_state_read_write_agent import shared_state_read_write_agent
from agents.shared_state_streaming_agent import (
    shared_state_streaming_agent,
    SHARED_STATE_STREAMING_PREDICT_STATE,
)
from agents.readonly_context_agent import agent as readonly_agent
from agents.a2ui_fixed_agent import a2ui_fixed_agent


def _wrap(a, **kw):
    return ADKAgent(adk_agent=a, app_name="demo_app", user_id="demo_user",
                    session_timeout_seconds=3600, use_in_memory_services=True, **kw)


app = FastAPI()
add_adk_fastapi_endpoint(app, _wrap(shared_state_read_write_agent), path="/shared-state")
# HARNESS: the streaming page defines SHARED_STATE_STREAMING_PREDICT_STATE but never shows where it goes;
# ADKAgent(predict_state=...) is the ag_ui_adk parameter for it.
add_adk_fastapi_endpoint(app, _wrap(shared_state_streaming_agent, predict_state=SHARED_STATE_STREAMING_PREDICT_STATE), path="/streaming")
add_adk_fastapi_endpoint(app, _wrap(readonly_agent), path="/readonly")
add_adk_fastapi_endpoint(app, _wrap(a2ui_fixed_agent), path="/a2ui-fixed")
# HARNESS: the Code tab's route.ts for fixed-schema calls `${AGENT_URL}/a2ui_fixed_schema`; same agent at that path.
add_adk_fastapi_endpoint(app, _wrap(a2ui_fixed_agent), path="/a2ui_fixed_schema")

# HARNESS: HITL Overview Code-tab agent (hitl_in_chat_book_call_agent.py). The Code tab's route.ts maps
# "hitl-in-chat" to `${AGENT_URL}/hitl-in-chat`; the page never shows the backend app (registry.py), so it is mounted here.
from agents.hitl_in_chat_book_call_agent import hitl_in_chat_book_call_agent
add_adk_fastapi_endpoint(app, _wrap(hitl_in_chat_book_call_agent), path="/hitl-in-chat")
