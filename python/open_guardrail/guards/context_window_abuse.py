"""Detect context window abuse: padding, many-shot, dilution."""
from __future__ import annotations

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult


class _ContextWindowAbuse:
    def __init__(
        self,
        *,
        action: str = "block",
        max_padding_ratio: float = 0.3,
        min_unique_ratio: float = 0.1,
    ) -> None:
        self.name = "context-window-abuse"
        self.action = action
        self._max_padding = max_padding_ratio
        self._min_unique = min_unique_ratio

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []

        total_len = len(text)
        if total_len == 0:
            elapsed = (time.perf_counter() - start) * 1000
            return GuardResult(
                guard_name="context-window-abuse",
                passed=True,
                action="allow",
                score=0.0,
                latency_ms=round(elapsed, 2),
            )

        ws = len(re.findall(r"\s", text))
        padding_ratio = ws / total_len
        if padding_ratio > self._max_padding:
            issues.append(
                f"excessive whitespace: {padding_ratio:.2f}"
            )

        unique_chars = len(set(text))
        unique_ratio = unique_chars / total_len
        if unique_ratio < self._min_unique:
            issues.append(
                f"low char diversity: {unique_ratio:.4f}"
            )

        block_size = 50
        if total_len > block_size * 3:
            blocks: list[str] = []
            for i in range(
                0, total_len - block_size + 1, block_size
            ):
                blocks.append(text[i : i + block_size])
            seen: set[str] = set()
            repeats = 0
            for b in blocks:
                if b in seen:
                    repeats += 1
                seen.add(b)
            if len(blocks) > 0:
                repeat_ratio = repeats / len(blocks)
                if repeat_ratio > 0.3:
                    issues.append(
                        f"repeated blocks: {repeat_ratio:.2f}"
                    )

        triggered = len(issues) > 0
        score = (
            min(len(issues) / 3, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="context-window-abuse",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Context window abuse detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "issues": issues,
                    "reason": (
                        "Input shows signs of context"
                        " window abuse through padding,"
                        " repetition, or dilution"
                    ),
                }
                if triggered
                else None
            ),
        )


def context_window_abuse(
    *,
    action: str = "block",
    max_padding_ratio: float = 0.3,
    min_unique_ratio: float = 0.1,
) -> _ContextWindowAbuse:
    return _ContextWindowAbuse(
        action=action,
        max_padding_ratio=max_padding_ratio,
        min_unique_ratio=min_unique_ratio,
    )
