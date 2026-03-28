"""Check text for accessibility issues."""

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult


def _check_accessibility(text: str) -> list[str]:
    issues: list[str] = []

    caps = re.findall(r"\b[A-Z][A-Z\s]{19,}[A-Z]\b", text)
    if any(
        len(b.replace(" ", "")) > 20 for b in caps
    ):
        issues.append("all_caps_block")

    if re.search(r"[!@#$%^&*~+=<>]{5,}", text):
        issues.append("excessive_special_chars")

    if re.search(r"!\[\s*\]\(", text):
        issues.append("missing_alt_text")

    if re.search(r"[\u0300-\u036f]{3,}", text):
        issues.append("zalgo_text")

    if re.search(r"([!?.])\1{4,}", text):
        issues.append("repeated_punctuation")

    return issues


class _AccessibilityText:
    def __init__(
        self, *, action: str = "warn"
    ) -> None:
        self.name = "accessibility-text"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        issues = _check_accessibility(text)

        triggered = len(issues) > 0
        score = (
            min(len(issues) / 3, 1.0) if triggered else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="accessibility-text",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Accessibility issues detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"issues": issues} if triggered else None
            ),
        )


def accessibility_text(
    *, action: str = "warn"
) -> _AccessibilityText:
    return _AccessibilityText(action=action)
