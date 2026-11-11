# HARNESS: one FastAPI app on 8023 mounting the G3 (generative-ui) page agents at separate paths (brief: one app per group).
# None of the 7 generative-ui pages shows how its LlmAgent is served (the showcase's agent_server.py /
# registry.py are never published); ADKAgent + add_adk_fastapi_endpoint wiring follows the quickstart.
# Mount paths are the ones the pages' runtime routes call (`${AGENT_URL}/<path>`).
from fastapi import FastAPI
from ag_ui_adk import ADKAgent, add_adk_fastapi_endpoint

from agents.gen_ui_tool_based_agent import gen_ui_tool_based_agent
from agents.tool_rendering_agent import tool_rendering_agent
from agents.shared_state_streaming_agent import (  # same file as the state-rendering page's prose block (verbatim, shared with G5)
    shared_state_streaming_agent,
    SHARED_STATE_STREAMING_PREDICT_STATE,
)
from agents.byoc_agents import byoc_hashbrown_agent, byoc_json_render_agent
from agents.mcp_apps_agent import mcp_apps_agent
from agents.open_gen_ui_agents import open_gen_ui_agent, open_gen_ui_advanced_agent


def _wrap(a, **kw):
    return ADKAgent(adk_agent=a, app_name="demo_app", user_id="demo_user",
                    session_timeout_seconds=3600, use_in_memory_services=True, **kw)


app = FastAPI()
add_adk_fastapi_endpoint(app, _wrap(gen_ui_tool_based_agent), path="/gen-ui-tool-based")
add_adk_fastapi_endpoint(app, _wrap(tool_rendering_agent), path="/tool-rendering")
# HARNESS: the page defines SHARED_STATE_STREAMING_PREDICT_STATE but never shows where it goes;
# ADKAgent(predict_state=...) is the ag_ui_adk parameter for it.
add_adk_fastapi_endpoint(app, _wrap(shared_state_streaming_agent, predict_state=SHARED_STATE_STREAMING_PREDICT_STATE), path="/shared-state-streaming")
add_adk_fastapi_endpoint(app, _wrap(byoc_json_render_agent), path="/byoc_json_render")
add_adk_fastapi_endpoint(app, _wrap(byoc_hashbrown_agent), path="/byoc_hashbrown")
add_adk_fastapi_endpoint(app, _wrap(mcp_apps_agent), path="/mcp-apps")
add_adk_fastapi_endpoint(app, _wrap(open_gen_ui_agent), path="/open_gen_ui")
add_adk_fastapi_endpoint(app, _wrap(open_gen_ui_advanced_agent), path="/open_gen_ui_advanced")
