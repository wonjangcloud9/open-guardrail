"""Anthropic Python SDK adapter for open-guardrail."""

from __future__ import annotations

from typing import Any, Sequence

from open_guardrail.core import Guard, Pipeline
from open_guardrail.decorators import GuardrailBlocked


def guardrailed_message(
    client: Any,
    guards: Sequence[Guard],
    *,
    model: str = "claude-sonnet-4-20250514",
    messages: list[dict[str, Any]],
    max_tokens: int = 1024,
    on_block: str = "raise",
    guard_input: bool = True,
    guard_output: bool = True,
    **kwargs: Any,
) -> Any:
    """Wrap Anthropic message creation with guardrails.

    Usage:
        from anthropic import Anthropic
        from open_guardrail.adapters.anthropic_adapter import guardrailed_message
        from open_guardrail.guards import prompt_injection, pii

        client = Anthropic()
        response = guardrailed_message(
            client,
            [prompt_injection(action="block"), pii(action="mask")],
            model="claude-sonnet-4-20250514",
            messages=[{"role": "user", "content": "Hello!"}],
        )
    """
    pipeline = Pipeline(guards)

    # Guard input
    if guard_input:
        user_msgs = [m for m in messages if m.get("role") == "user"]
        if user_msgs:
            last_content = user_msgs[-1].get("content", "")
            # Handle list content (Anthropic format)
            if isinstance(last_content, list):
                text_parts = [
                    p.get("text", "")
                    for p in last_content
                    if p.get("type") == "text"
                ]
                text = " ".join(text_parts)
            else:
                text = str(last_content)

            result = pipeline.run(text, "input")
            if not result.passed:
                if on_block == "raise":
                    raise GuardrailBlocked(result)
                return _make_blocked_response(result)

    # Call Anthropic
    response = client.messages.create(
        model=model,
        messages=messages,
        max_tokens=max_tokens,
        **kwargs,
    )

    # Guard output
    if guard_output:
        content = ""
        for block in response.content:
            if hasattr(block, "text"):
                content += block.text

        result = pipeline.run(content, "output")
        if not result.passed:
            if on_block == "raise":
                raise GuardrailBlocked(result)
            return _make_blocked_response(result)

    return response


def _make_blocked_response(result):
    """Create a mock response indicating blocking."""
    blocked = [r for r in result.results if not r.passed]
    return {
        "blocked": True,
        "guard": blocked[0].guard_name if blocked else "unknown",
        "message": (
            blocked[0].message
            if blocked and blocked[0].message
            else "Blocked by guardrail"
        ),
    }
