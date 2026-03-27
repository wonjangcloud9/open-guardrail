"""Detect ASCII art patterns in text."""

import re
import time

from open_guardrail.core import GuardResult

_BOX_CHARS = set("─│┌┐└┘├┤┬┴┼═║╔╗╚╝╠╣╦╩╬")
_REPEAT_RE = re.compile(r"(.)\1{4,}")
_SEPARATOR_RE = re.compile(r"[=\-*~#]{5,}")


class _AsciiArt:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "ascii-art"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        reasons: list[str] = []

        for line in text.splitlines():
            stripped = line.strip()
            if not stripped:
                continue
            non_alnum = sum(
                1 for c in stripped
                if not c.isalnum() and not c.isspace()
            )
            if len(stripped) > 0 and non_alnum / len(stripped) > 0.5:
                reasons.append("high-symbol-density")
                break

        if any(c in _BOX_CHARS for c in text):
            reasons.append("box-drawing-chars")

        if _SEPARATOR_RE.search(text):
            reasons.append("repeated-separators")

        if _REPEAT_RE.search(text):
            reasons.append("repeated-patterns")

        triggered = len(reasons) > 0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="ascii-art",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                "ASCII art detected" if triggered else None
            ),
            latency_ms=round(elapsed, 2),
            details={"reasons": reasons} if triggered else None,
        )


def ascii_art(*, action: str = "warn") -> _AsciiArt:
    return _AsciiArt(action=action)
