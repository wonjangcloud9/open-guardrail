"""Check if AI output appears complete."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_CONTINUATION = [
    re.compile(
        r"I'?ll\s+continue\s+in\s+the\s+next\s+message",
        re.I,
    ),
    re.compile(r"to\s+be\s+continued", re.I),
    re.compile(r"continued\s+in\s+(part|next)", re.I),
    re.compile(
        r"see\s+part\s+\d+\s+for\s+the\s+rest", re.I
    ),
    re.compile(r"I'?ll\s+finish\s+this\s+in", re.I),
]

_MID_SENTENCE_RE = re.compile(r"[a-zA-Z,]\s*$")

_UNCLOSED_TAG_RE = re.compile(
    r"<(\w+)[^>]*>(?:(?!</\1>).)*$", re.S
)

_TERMINAL = set(".!?:;)]}'\"`")


class _OutputCompleteness:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "output-completeness"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []
        trimmed = text.strip()

        if not trimmed:
            elapsed = (
                time.perf_counter() - start
            ) * 1000
            return GuardResult(
                guard_name="output-completeness",
                passed=True,
                action="allow",
                score=0.0,
                latency_ms=round(elapsed, 2),
            )

        for p in _CONTINUATION:
            if p.search(trimmed):
                issues.append("continuation_phrase")
                break

        if (
            _MID_SENTENCE_RE.search(trimmed)
            and len(trimmed) > 20
        ):
            last = trimmed[-1]
            if last not in _TERMINAL:
                issues.append("mid_sentence_cutoff")

        if _UNCLOSED_TAG_RE.search(trimmed):
            issues.append("unclosed_tag")

        triggered = len(issues) > 0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="output-completeness",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=(
                min(len(issues) / 3, 1.0)
                if triggered
                else 0.0
            ),
            message=(
                "Output appears incomplete"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"issues": issues} if triggered else None
            ),
        )


def output_completeness(
    *, action: str = "block"
) -> _OutputCompleteness:
    return _OutputCompleteness(action=action)
