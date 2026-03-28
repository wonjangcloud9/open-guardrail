"""Check if AI followed specific format instructions."""
from __future__ import annotations

import json
import re
import time
from typing import Optional

from open_guardrail.core import GuardResult


def _detect_format(text: str) -> str:
    trimmed = text.strip()
    try:
        json.loads(trimmed)
        return "json"
    except (json.JSONDecodeError, ValueError):
        pass
    if re.search(
        r"^```[\s\S]*```$", trimmed, re.MULTILINE
    ) or re.match(
        r"^(import |const |let |var |def |class "
        r"|function )",
        trimmed,
        re.MULTILINE,
    ):
        return "code"
    if re.search(
        r"^[\s]*[-*\d][\s.)]",
        trimmed,
        re.MULTILINE,
    ):
        return "list"
    return "prose"


class _InstructionFollowing:
    def __init__(
        self,
        *,
        action: str = "warn",
        expected_format: str = "any",
    ) -> None:
        self.name = "instruction-following"
        self.action = action
        self._expected = expected_format

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []

        if self._expected != "any":
            actual = _detect_format(text)
            if actual != self._expected:
                issues.append(
                    f"expected {self._expected}"
                    f" but got {actual}"
                )

        if len(text.split()) > 500:
            issues.append("response-too-long")

        triggered = len(issues) > 0
        score = (
            min(len(issues) / 2, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (
            time.perf_counter() - start
        ) * 1000

        return GuardResult(
            guard_name="instruction-following",
            passed=not triggered,
            action=(
                self.action if triggered else "allow"
            ),
            score=score,
            message=(
                "Format instruction not followed"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"issues": issues}
                if triggered
                else None
            ),
        )


def instruction_following(
    *,
    action: str = "warn",
    expected_format: str = "any",
) -> _InstructionFollowing:
    return _InstructionFollowing(
        action=action,
        expected_format=expected_format,
    )
