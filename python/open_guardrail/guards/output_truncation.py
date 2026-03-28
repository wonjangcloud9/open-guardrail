"""Detect if output was likely truncated or incomplete."""

import re
import time

from open_guardrail.core import GuardResult


def _ends_mid_sentence(text: str) -> bool:
    trimmed = text.rstrip()
    if not trimmed:
        return False
    return bool(re.match(r"[a-zA-Z,;:\-]", trimmed[-1]))


def _has_unclosed_brackets(text: str) -> bool:
    opens = {"(": ")", "[": "]", "{": "}"}
    stack: list[str] = []
    for ch in text:
        if ch in opens:
            stack.append(opens[ch])
        elif ch in ")]}":
            if stack and stack[-1] == ch:
                stack.pop()
    return len(stack) > 0


def _has_unclosed_quotes(text: str) -> bool:
    return text.count("'") % 2 != 0 or text.count('"') % 2 != 0


def _has_incomplete_code_block(text: str) -> bool:
    return text.count("```") % 2 != 0


def _ends_with_ellipsis(text: str) -> bool:
    trimmed = text.rstrip()
    return trimmed.endswith("...") or trimmed.endswith("\u2026")


def _has_incomplete_list(text: str) -> bool:
    lines = text.rstrip().split("\n")
    last = lines[-1].strip() if lines else ""
    return bool(
        re.match(r"^\d+\.\s*$", last)
        or re.match(r"^[-*]\s*$", last)
    )


class _OutputTruncation:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "output-truncation"
        self.action = action

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        signals: list[str] = []

        if _ends_mid_sentence(text):
            signals.append("ends-mid-sentence")
        if _has_unclosed_brackets(text):
            signals.append("unclosed-brackets")
        if _has_unclosed_quotes(text):
            signals.append("unclosed-quotes")
        if _has_incomplete_code_block(text):
            signals.append("incomplete-code-block")
        if _ends_with_ellipsis(text):
            signals.append("ends-with-ellipsis")
        if _has_incomplete_list(text):
            signals.append("incomplete-list")

        triggered = len(signals) > 0
        score = min(len(signals) / 3, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="output-truncation",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Output appears truncated"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details={"signals": signals} if triggered else None,
        )


def output_truncation(
    *, action: str = "warn"
) -> _OutputTruncation:
    return _OutputTruncation(action=action)
