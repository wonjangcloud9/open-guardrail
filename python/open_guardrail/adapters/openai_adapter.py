"""OpenAI Python SDK adapter for open-guardrail."""

from __future__ import annotations

from typing import Any, Sequence

from open_guardrail.core import Guard, Pipeline
from open_guardrail.decorators import GuardrailBlocked


def guardrailed_chat(
    client: Any,
    guards: Sequence[Guard],
    *,
    model: str = "gpt-4o",
    messages: list[dict[str, str]],
    on_block: str = "raise",
    guard_input: bool = True,
    guard_output: bool = True,
    **kwargs: Any,
) -> Any:
    """Wrap OpenAI chat completion with guardrails.

    Usage:
        from openai import OpenAI
        from open_guardrail.adapters.openai_adapter import guardrailed_chat
        from open_guardrail.guards import prompt_injection, pii, toxicity

        client = OpenAI()
        response = guardrailed_chat(
            client,
            [prompt_injection(action="block"), pii(action="mask"), toxicity(action="block")],
            model="gpt-4o",
            messages=[{"role": "user", "content": "Hello!"}],
        )
    """
    pipeline = Pipeline(guards)

    # Guard input messages
    if guard_input:
        user_messages = [m for m in messages if m.get("role") == "user"]
        if user_messages:
            last_user_msg = user_messages[-1].get("content", "")
            result = pipeline.run(str(last_user_msg), "input")
            if not result.passed:
                if on_block == "raise":
                    raise GuardrailBlocked(result)
                return _make_blocked_response(result)
            # Use guarded text if modified
            if result.output:
                user_messages[-1]["content"] = result.output

    # Call OpenAI
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        **kwargs,
    )

    # Guard output
    if guard_output:
        content = response.choices[0].message.content or ""
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
