"""Try to parse JSON; attempt simple repairs."""

import json
import re
import time

from open_guardrail.core import GuardResult


def _try_repair(text: str) -> str | None:
    s = text.strip()
    # Fix trailing commas before } or ]
    s = re.sub(r",\s*([}\]])", r"\1", s)
    # Add missing closing braces/brackets
    opens = s.count("{") - s.count("}")
    s += "}" * max(opens, 0)
    brackets = s.count("[") - s.count("]")
    s += "]" * max(brackets, 0)
    try:
        json.loads(s)
        return s
    except (json.JSONDecodeError, TypeError):
        return None


class _JsonRepair:
    def __init__(
        self, *, action: str = "mask"
    ) -> None:
        self.name = "json-repair"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()

        # Valid JSON: pass through
        try:
            json.loads(text.strip())
            elapsed = (
                time.perf_counter() - start
            ) * 1000
            return GuardResult(
                guard_name="json-repair",
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )
        except (json.JSONDecodeError, TypeError):
            pass

        # Attempt repair
        repaired = _try_repair(text)
        elapsed = (time.perf_counter() - start) * 1000

        if repaired is not None:
            return GuardResult(
                guard_name="json-repair",
                passed=True,
                action="override",
                override_text=repaired,
                latency_ms=round(elapsed, 2),
                details={"repaired": True},
            )

        return GuardResult(
            guard_name="json-repair",
            passed=False,
            action="block",
            message="JSON is invalid and cannot"
            " be repaired",
            latency_ms=round(elapsed, 2),
        )


def json_repair(
    *, action: str = "mask"
) -> _JsonRepair:
    return _JsonRepair(action=action)
