"""Check if provided context was used in the response."""
from __future__ import annotations

import re
import time
from typing import Optional

from open_guardrail.core import GuardResult


def _tokenize(text: str) -> set[str]:
    cleaned = re.sub(r"[^a-z0-9\s]", "", text.lower())
    return {
        w for w in cleaned.split() if len(w) > 2
    }


class _ContextUtilization:
    def __init__(
        self,
        *,
        action: str = "warn",
        min_overlap: float = 0.1,
    ) -> None:
        self.name = "context-utilization"
        self.action = action
        self._min_overlap = min_overlap

    def check(
        self,
        text: str,
        stage: str = "output",
        context: Optional[str] = None,
    ) -> GuardResult:
        start = time.perf_counter()

        if not context:
            elapsed = (
                time.perf_counter() - start
            ) * 1000
            return GuardResult(
                guard_name="context-utilization",
                passed=True,
                action="allow",
                score=0.0,
                latency_ms=round(elapsed, 2),
            )

        ctx_tokens = _tokenize(context)
        resp_tokens = _tokenize(text)

        if not ctx_tokens:
            elapsed = (
                time.perf_counter() - start
            ) * 1000
            return GuardResult(
                guard_name="context-utilization",
                passed=True,
                action="allow",
                score=0.0,
                latency_ms=round(elapsed, 2),
            )

        overlap = sum(
            1 for t in ctx_tokens
            if t in resp_tokens
        )
        ratio = overlap / len(ctx_tokens)
        triggered = ratio < self._min_overlap
        score = (
            1.0 - ratio if triggered else 0.0
        )
        elapsed = (
            time.perf_counter() - start
        ) * 1000

        return GuardResult(
            guard_name="context-utilization",
            passed=not triggered,
            action=(
                self.action if triggered else "allow"
            ),
            score=score,
            message=(
                "Response does not utilize"
                " provided context"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details={
                "overlap_ratio": round(ratio, 2)
            },
        )


def context_utilization(
    *,
    action: str = "warn",
    min_overlap: float = 0.1,
) -> _ContextUtilization:
    return _ContextUtilization(
        action=action, min_overlap=min_overlap
    )
