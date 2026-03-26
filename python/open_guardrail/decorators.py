"""FastAPI-style decorators for guardrailing functions."""

from __future__ import annotations

import functools
from typing import Any, Callable, Optional, Sequence

from open_guardrail.core import Guard, Pipeline, GuardResult


def guardrail(
    *guards: Guard,
    on_block: str = "raise",
) -> Callable:
    """Decorator to add guardrails to any function.

    Usage:
        @guardrail(prompt_injection(action="block"), pii(entities=["email"], action="mask"))
        def ask_llm(prompt: str) -> str:
            return call_llm(prompt)

        # Input is automatically guarded before the function runs.
        # If blocked, raises GuardrailBlocked or returns fallback.

    Args:
        *guards: Guard instances to apply
        on_block: "raise" (default) or a fallback string to return
    """
    pipeline = Pipeline(guards)

    def decorator(fn: Callable) -> Callable:
        @functools.wraps(fn)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            text = args[0] if args else kwargs.get("prompt", kwargs.get("text", ""))
            result = pipeline.run(str(text), "input")

            if not result.passed:
                if on_block == "raise":
                    raise GuardrailBlocked(result)
                return on_block

            guarded_input = result.output if result.output else str(text)
            if args:
                args = (guarded_input, *args[1:])
            else:
                first_key = next(iter(kwargs))
                kwargs[first_key] = guarded_input

            output = fn(*args, **kwargs)

            output_result = pipeline.run(str(output), "output")
            if not output_result.passed:
                if on_block == "raise":
                    raise GuardrailBlocked(output_result)
                return on_block

            return output_result.output if output_result.output else output

        wrapper._pipeline = pipeline
        return wrapper

    return decorator


def guard_input(*guards: Guard, on_block: str = "raise") -> Callable:
    """Guard only the input (first argument)."""
    pipeline = Pipeline(guards)

    def decorator(fn: Callable) -> Callable:
        @functools.wraps(fn)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            text = args[0] if args else kwargs.get("prompt", kwargs.get("text", ""))
            result = pipeline.run(str(text), "input")

            if not result.passed:
                if on_block == "raise":
                    raise GuardrailBlocked(result)
                return on_block

            guarded = result.output if result.output else str(text)
            if args:
                return fn(guarded, *args[1:], **kwargs)
            first_key = next(iter(kwargs))
            kwargs[first_key] = guarded
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def guard_output(*guards: Guard, on_block: str = "raise") -> Callable:
    """Guard only the output (return value)."""
    pipeline = Pipeline(guards)

    def decorator(fn: Callable) -> Callable:
        @functools.wraps(fn)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            output = fn(*args, **kwargs)
            result = pipeline.run(str(output), "output")

            if not result.passed:
                if on_block == "raise":
                    raise GuardrailBlocked(result)
                return on_block

            return result.output if result.output else output

        return wrapper

    return decorator


class GuardrailBlocked(Exception):
    """Raised when a guardrail blocks the request."""

    def __init__(self, result: Any) -> None:
        self.result = result
        blocked = [r for r in result.results if not r.passed]
        guard_name = blocked[0].guard_name if blocked else "unknown"
        message = blocked[0].message if blocked and blocked[0].message else "Blocked by guardrail"
        super().__init__(f"[{guard_name}] {message}")
