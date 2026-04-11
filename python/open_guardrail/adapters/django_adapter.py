"""Django adapter for open-guardrail."""
from __future__ import annotations

from typing import Callable, Sequence

from open_guardrail.core import Guard, Pipeline


class GuardrailMiddleware:
    """Django middleware for guardrailing requests."""

    _guards: Sequence[Guard] = ()
    _on_block: str = "reject"

    def __init__(self, get_response: Callable):
        self.get_response = get_response

    @classmethod
    def configure(
        cls,
        guards: Sequence[Guard],
        on_block: str = "reject",
    ):
        """Set guards at startup (call before adding to MIDDLEWARE)."""
        cls._guards = guards
        cls._on_block = on_block

    def __call__(self, request):
        if not self.__class__._guards:
            return self.get_response(request)

        pipeline = Pipeline(self.__class__._guards)

        text = ""
        if request.body:
            text = request.body.decode("utf-8", errors="ignore")
        elif request.GET:
            text = " ".join(request.GET.values())

        if text:
            result = pipeline.run(text, "input")
            if not result.passed:
                from django.http import JsonResponse

                blocked = [
                    r for r in result.results if not r.passed
                ]
                return JsonResponse(
                    {
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
                    },
                    status=403,
                )

        return self.get_response(request)
