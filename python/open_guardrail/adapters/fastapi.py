"""FastAPI adapter for open-guardrail."""
from __future__ import annotations

import json
from functools import wraps
from typing import Callable, Sequence

from open_guardrail.core import Guard, Pipeline


class GuardrailMiddleware:
    """ASGI middleware that guards request bodies."""

    def __init__(
        self,
        app,
        guards: Sequence[Guard],
        on_block: str = "reject",
    ):
        self.app = app
        self.pipeline = Pipeline(guards)
        self.on_block = on_block

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        body_parts: list[bytes] = []

        async def receive_wrapper():
            message = await receive()
            if message.get("type") == "http.request":
                body = message.get("body", b"")
                if body:
                    body_parts.append(body)
                    text = body.decode("utf-8", errors="ignore")
                    result = self.pipeline.run(text, "input")
                    if not result.passed:
                        scope["_guardrail_blocked"] = result
            return message

        async def send_wrapper(message):
            if scope.get("_guardrail_blocked"):
                if message["type"] == "http.response.start":
                    await send({
                        "type": "http.response.start",
                        "status": 403,
                        "headers": [
                            (b"content-type", b"application/json"),
                        ],
                    })
                    return
                if message["type"] == "http.response.body":
                    result = scope["_guardrail_blocked"]
                    blocked = [
                        r for r in result.results if not r.passed
                    ]
                    body = json.dumps({
                        "error": "blocked_by_guardrail",
                        "guard": (
                            blocked[0].guard_name
                            if blocked
                            else "unknown"
                        ),
                        "message": (
                            blocked[0].message
                            if blocked and blocked[0].message
                            else "Blocked"
                        ),
                    }).encode()
                    await send({
                        "type": "http.response.body",
                        "body": body,
                    })
                    return
            await send(message)

        await self.app(scope, receive_wrapper, send_wrapper)


def guardrail_route(
    *guards: Guard,
    on_block: str = "raise",
):
    """Decorator for individual FastAPI route handlers."""
    pipeline = Pipeline(guards)

    def decorator(fn: Callable) -> Callable:
        @wraps(fn)
        async def wrapper(*args, **kwargs):
            for _key, val in kwargs.items():
                if hasattr(val, "body"):
                    try:
                        body = await val.body()
                        text = body.decode("utf-8", errors="ignore")
                        result = pipeline.run(text, "input")
                        if not result.passed:
                            if on_block == "raise":
                                from open_guardrail.decorators import (
                                    GuardrailBlocked,
                                )

                                raise GuardrailBlocked(result)
                            # lazy import to avoid hard dependency
                            from fastapi.responses import JSONResponse

                            return JSONResponse(
                                status_code=403,
                                content={"error": "blocked"},
                            )
                    except (AttributeError, UnicodeDecodeError):
                        pass
            return await fn(*args, **kwargs)

        return wrapper

    return decorator
