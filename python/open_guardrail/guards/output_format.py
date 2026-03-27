"""Validate output matches expected format."""

import json
import re
import time

from open_guardrail.core import GuardResult


def _is_json(text: str) -> bool:
    try:
        json.loads(text.strip())
        return True
    except (json.JSONDecodeError, TypeError):
        return False


def _is_markdown(text: str) -> bool:
    return bool(
        re.search(r"^#{1,6}\s", text, re.M)
        or re.search(r"\*\*.*\*\*", text)
        or re.search(r"^\s*[-*]\s", text, re.M)
    )


def _is_csv(text: str) -> bool:
    lines = text.strip().split("\n")
    if len(lines) < 2:
        return False
    delim = (
        ","
        if "," in lines[0]
        else "\t"
        if "\t" in lines[0]
        else None
    )
    if not delim:
        return False
    cols = len(lines[0].split(delim))
    return all(
        abs(len(l.split(delim)) - cols) <= 1
        for l in lines[1:4]
    )


class _OutputFormat:
    def __init__(
        self,
        *,
        action: str = "warn",
        expected: str = "json",
    ) -> None:
        self.name = "output-format"
        self.action = action
        self.expected = expected

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        validators = {
            "json": _is_json,
            "markdown": _is_markdown,
            "csv": _is_csv,
            "plain": lambda t: (
                not _is_json(t) and not _is_markdown(t)
            ),
        }
        validator = validators.get(
            self.expected, lambda t: True
        )
        valid = validator(text)
        triggered = not valid
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="output-format",
            passed=not triggered,
            action=(
                self.action if triggered else "allow"
            ),
            message=(
                f"Not valid {self.expected}"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"expected": self.expected}
                if triggered
                else None
            ),
        )


def output_format(
    *,
    action: str = "warn",
    expected: str = "json",
) -> _OutputFormat:
    return _OutputFormat(
        action=action, expected=expected
    )
