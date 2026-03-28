"""Basic text quality checks."""
from __future__ import annotations

import time
from typing import List, Optional

from open_guardrail.core import GuardResult


class _LanguageQuality:
    def __init__(
        self,
        *,
        action: str = "warn",
        min_alpha_ratio: float = 0.5,
        max_whitespace_ratio: float = 0.4,
        max_short_word_ratio: float = 0.6,
    ) -> None:
        self.name = "language-quality"
        self.action = action
        self.min_alpha_ratio = min_alpha_ratio
        self.max_whitespace_ratio = max_whitespace_ratio
        self.max_short_word_ratio = max_short_word_ratio

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        issues: List[str] = []
        total = len(text) if text else 1
        alpha_count = sum(1 for c in text if c.isalpha())
        alpha_ratio = alpha_count / total
        if alpha_ratio < self.min_alpha_ratio:
            issues.append(f"Low alphabetic ratio: {alpha_ratio:.2f}")
        ws_count = sum(1 for c in text if c.isspace())
        ws_ratio = ws_count / total
        if ws_ratio > self.max_whitespace_ratio:
            issues.append(f"Excessive whitespace: {ws_ratio:.2f}")
        words = text.split()
        if words:
            short = sum(1 for w in words if len(w) <= 2)
            short_ratio = short / len(words)
            if short_ratio > self.max_short_word_ratio:
                issues.append(f"Too many short words: {short_ratio:.2f}")
        triggered = len(issues) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name=self.name,
            passed=not triggered,
            action=self.action if triggered else "allow",
            message="; ".join(issues) if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"issues": issues} if triggered else None,
        )


def language_quality(
    *,
    action: str = "warn",
    min_alpha_ratio: float = 0.5,
    max_whitespace_ratio: float = 0.4,
    max_short_word_ratio: float = 0.6,
) -> _LanguageQuality:
    return _LanguageQuality(
        action=action,
        min_alpha_ratio=min_alpha_ratio,
        max_whitespace_ratio=max_whitespace_ratio,
        max_short_word_ratio=max_short_word_ratio,
    )
