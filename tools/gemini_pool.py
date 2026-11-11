"""HARNESS: local Gemini key/model pool (free-tier quota is 5 req/min per model per key).

The ADK backends reach Gemini through this proxy via GOOGLE_GEMINI_BASE_URL=http://localhost:8029
(an env setting read by google-genai; the doc's agent code is unchanged). For each request it tries
every key on the requested model, then the same on each fallback model, and moves on whenever Google
answers 429 (quota) or 503 (overloaded). The doc's own model is always tried first; a fallback answer
is logged so a clip can be checked.

Keys never live in the repo:
  GEMINI_POOL_KEYS      comma-separated keys (CI: from secrets), or
  GEMINI_POOL_KEYFILES  comma-separated paths to files holding one key each (local).
Run: uv run python ../tools/gemini_pool.py   (from backend/, port 8029; PORT overrides)
"""
import asyncio, itertools, os, re, sys, time

import httpx
import uvicorn
from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import Response, StreamingResponse
from starlette.routing import Route

UPSTREAM = "https://generativelanguage.googleapis.com"
FALLBACK = [m.strip() for m in os.getenv(
    "GEMINI_POOL_FALLBACK", "gemini-3.8-flash,gemini-3-flash-preview,gemini-3.5-flash-lite").split(",") if m.strip()]
RETRY = {429, 503}


def load_keys():
    keys = [k.strip() for k in os.getenv("GEMINI_POOL_KEYS", "").split(",") if k.strip()]
    for f in [p.strip() for p in os.getenv("GEMINI_POOL_KEYFILES", "").split(",") if p.strip()]:
        try:
            k = open(f, encoding="utf-8-sig").read().strip()
            if k:
                keys.append(k)
        except OSError as e:
            print(f"[pool] cannot read key file {f}: {e}", file=sys.stderr)
    return list(dict.fromkeys(keys))


KEYS = load_keys()
rr = itertools.count()
# per attempt: give up on a hung upstream fast and try the next key/model (read covers time to first byte)
client = httpx.AsyncClient(timeout=httpx.Timeout(float(os.getenv("GEMINI_POOL_TIMEOUT", "45")), connect=10.0))
cool = {}  # (key index, model) -> time it may be used again
DELAY_RE = re.compile(rb'"retryDelay":\s*"(\d+(?:\.\d+)?)s"')
MAX_WAIT = float(os.getenv("GEMINI_POOL_MAX_WAIT", "90"))
MODEL_RE = re.compile(r"(/models/)([^/:]+)(:)")


def log(msg):
    print(f"[pool {time.strftime('%H:%M:%S')}] {msg}", flush=True)


async def proxy(request: Request):
    path = request.url.path
    body = await request.body()
    params = [(k, v) for k, v in request.query_params.multi_items() if k != "key"]
    headers = {k: v for k, v in request.headers.items()
               if k.lower() not in ("host", "x-goog-api-key", "content-length", "accept-encoding")}
    m = MODEL_RE.search(path)
    asked = m.group(2) if m else None
    models = [asked] + [x for x in FALLBACK if x != asked] if asked else [None]
    start = next(rr)
    last = None
    deadline = time.time() + MAX_WAIT
    while True:
        for model in models:
            p = MODEL_RE.sub(lambda mm: f"{mm.group(1)}{model}{mm.group(3)}", path, count=1) if model else path
            for i in range(len(KEYS)):
                ki = (start + i) % len(KEYS)
                if cool.get((ki, model), 0) > time.time():
                    continue
                h = dict(headers, **{"x-goog-api-key": KEYS[ki]})
                req = client.build_request(request.method, UPSTREAM + p, params=params, headers=h, content=body)
                try:
                    r = await client.send(req, stream=True)
                except httpx.HTTPError as e:
                    log(f"{type(e).__name__} model={model} key#{ki + 1} -> next")
                    cool[(ki, model)] = time.time() + 20
                    continue
                if r.status_code in RETRY:
                    data = await r.aread()
                    await r.aclose()
                    last = (r.status_code, data)
                    d = DELAY_RE.search(data)
                    wait = float(d.group(1)) if d else (60 if r.status_code == 429 else 10)
                    cool[(ki, model)] = time.time() + min(wait, 3600)
                    log(f"{r.status_code} model={model} key#{ki + 1} cool {wait:.0f}s -> next")
                    continue
                if model != asked:
                    log(f"FALLBACK served {asked} with {model} key#{ki + 1} ({r.status_code})")
                else:
                    log(f"{r.status_code} model={model} key#{ki + 1}")
                out_h = {k: v for k, v in r.headers.items()
                         if k.lower() not in ("content-length", "content-encoding", "transfer-encoding", "connection")}

                async def gen(resp=r):
                    try:
                        async for chunk in resp.aiter_bytes():  # decoded; content-encoding header is dropped below
                            yield chunk
                    finally:
                        await resp.aclose()
                return StreamingResponse(gen(), status_code=r.status_code, headers=out_h)
        # everything is cooling: wait for the first pair to free up, within MAX_WAIT
        soonest = min([cool.get((k, m), 0) for k in range(len(KEYS)) for m in models])
        if soonest > deadline:
            break
        await asyncio.sleep(max(0.5, soonest - time.time()))
    log(f"all keys/models exhausted for {asked}")
    return Response(last[1] if last else b'{"error":"pool exhausted"}',
                    status_code=last[0] if last else 429,
                    media_type="application/json")


app = Starlette(routes=[Route("/{path:path}", proxy, methods=["GET", "POST"])])

if __name__ == "__main__":
    if not KEYS:
        sys.exit("[pool] no keys: set GEMINI_POOL_KEYS or GEMINI_POOL_KEYFILES")
    log(f"{len(KEYS)} keys, fallback {FALLBACK}")
    uvicorn.run(app, host="127.0.0.1", port=int(os.getenv("PORT", "8029")), log_level="warning")
