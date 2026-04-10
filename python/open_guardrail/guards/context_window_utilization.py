"""Detect inefficient context window usage or overflow."""
from __future__ import annotations

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_CTX_SECTIONS: list[re.Pattern[str]] = [
    re.compile(
        r"(?:^|\n)Context:\s*([\s\S]+?)(?:\n\n|$)",
        re.IGNORECASE,
    ),
    re.compile(
        r"(?:^|\n)Retrieved:\s*([\s\S]+?)(?:\n\n|$)",
        re.IGNORECASE,
    ),
    re.compile(
        r"(?:^|\n)Documents?:\s*([\s\S]+?)(?:\n\n|$)",
        re.IGNORECASE,
    ),
    re.compile(
        r"(?:^|\n)Passages?:\s*([\s\S]+?)(?:\n\n|$)",
        re.IGNORECASE,
    ),
    re.compile(
        r"(?:^|\n)Sources?:\s*([\s\S]+?)(?:\n\n|$)",
        re.IGNORECASE,
    ),
]


def _count_words(text: str) -> int:
    return len(text.split())


def _estimate_tokens(text: str) -> int:
    import math

    return math.ceil(_count_words(text) * 1.3)


def _detect_repetition(text: str) -> int:
    sentences = [
        s
        for s in re.split(r"[.!?]\s+", text)
        if len(s) > 20
    ]
    if len(sentences) < 4:
        return 0
    seen: set[str] = set()
    dupes = 0
    for s in sentences:
        norm = s.lower().strip()
        if norm in seen:
            dupes += 1
        else:
            seen.add(norm)
    return dupes


class _ContextWindowUtilization:
    def __init__(
        self,
        *,
        action: str = "warn",
        max_context_ratio: float = 0.8,
        estimated_window_size: int = 128000,
    ) -> None:
        self.name = "context-window-utilization"
        self.action = action
        self._max_ratio = max_context_ratio
        self._window = estimated_window_size

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: List[str] = []

        est_tokens = _estimate_tokens(text)
        utilization = est_tokens / self._window

        if utilization > self._max_ratio:
            pct = round(utilization * 100)
            issues.append(
                f"Near context overflow: ~{est_tokens}"
                f" tokens ({pct}% of {self._window})"
            )

        dupes = _detect_repetition(text)
        if dupes > 3:
            issues.append(
                f"Repeated content: {dupes}"
                " duplicate sentences"
            )

        ctx_words = 0
        for pat in _CTX_SECTIONS:
            m = pat.search(text)
            if m:
                ctx_words += _count_words(m.group(1))

        total_words = _count_words(text)
        if ctx_words > 0 and total_words > 0:
            resp_words = total_words - ctx_words
            if ctx_words > 500 and resp_words < 20:
                issues.append(
                    f"Poor utilization: {ctx_words}"
                    f" context words but only"
                    f" {resp_words} response words"
                )

        triggered = len(issues) > 0
        score = (
            min(utilization, 1.0) if triggered else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="context-window-utilization",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Context window utilization issue"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "issues": issues,
                    "estimated_tokens": est_tokens,
                    "utilization": round(utilization, 2),
                    "window_size": self._window,
                }
                if triggered
                else None
            ),
        )


def context_window_utilization(
    *,
    action: str = "warn",
    max_context_ratio: float = 0.8,
    estimated_window_size: int = 128000,
) -> _ContextWindowUtilization:
    return _ContextWindowUtilization(
        action=action,
        max_context_ratio=max_context_ratio,
        estimated_window_size=estimated_window_size,
    )
