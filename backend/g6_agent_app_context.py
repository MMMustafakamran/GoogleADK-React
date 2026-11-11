import json

from ag_ui_adk import ADKAgent, CONTEXT_STATE_KEY, add_adk_fastapi_endpoint
from google.adk.agents import LlmAgent
from google.adk.agents.readonly_context import ReadonlyContext

BASE_INSTRUCTION = """You are a helpful assistant that can help emailing colleagues.

Answer only about the colleagues the page below sent you. If that list is empty, say the
page sent no colleagues. If it holds colleagues but none of them match what the user asked
about, say so and name the ones the page did send. Never invent a colleague."""


def render_context(state) -> str:
    """Turn the entries the frontend sent into prompt text."""
    entries = state.get(CONTEXT_STATE_KEY) or []
    if not entries:
        return "The page sent no context entries."

    blocks = []
    for entry in entries:
        description = entry.get("description", "(no description)")
        value = entry.get("value", "")
        # `value` arrives already JSON-encoded as a string. Anything else is encoded
        # here so a dict never reaches the prompt as a Python repr.
        if not isinstance(value, str):
            value = json.dumps(value, ensure_ascii=False)
        blocks.append(f"### {description}\n{value}")
    return "\n\n".join(blocks)


# An InstructionProvider, not a string.
def build_instruction(ctx: ReadonlyContext) -> str:
    return f"{BASE_INSTRUCTION}\n\n## Context from the page\n\n{render_context(ctx.state)}\n"


colleagues_agent = LlmAgent(
    name="colleagues_agent",
    model="gemini-3.8-flash",
    instruction=build_instruction,
)

adk_agent = ADKAgent(
    adk_agent=colleagues_agent,
    app_name="demo_app",
    user_id="demo_user",
    use_in_memory_services=True,
)

# HARNESS: the doc's agent.py imports add_adk_fastapi_endpoint but never creates a FastAPI app or mounts the
# endpoint; added the quickstart's two lines so uvicorn can serve it (g6_agent_app_context:app on 8026).
from fastapi import FastAPI  # HARNESS
app = FastAPI()  # HARNESS
add_adk_fastapi_endpoint(app, adk_agent, path="/")  # HARNESS
