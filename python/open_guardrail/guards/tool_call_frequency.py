"""Rate-limits tool calls within a sliding window."""
from __future__ import annotations

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_TOOL_CALL_PATTERNS = [
    re.compile(r"tool_call", re.IGNORECASE),
    re.compile(r"function_call", re.IGNORECASE),
    re.compile(r"use_tool", re.IGNORECASE),
    re.compile(r"<tool>", re.IGNORECASE),
    re.compile(r"Action:\s*\w+", re.IGNORECASE),
]


def _count_tool_calls(text: str) -> int:
    count = 0
    for pattern in _TOOL_CALL_PATTERNS:
        count += len(pattern.findall(text))
    return count


class _ToolCallFrequency:
    def __init__(
        self,
        *,
        action: str = "block",
        max_calls: int = 10,
        window_seconds: int = 60,
    ) -> None:
        self.name = "tool-call-frequency"
        self.action = action
        self.max_calls = max_calls
        self.window_seconds = window_seconds
        self._timestamps: List[float] = []

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        now = time.time()
        call_count = _count_tool_calls(text)
        window = self.window_seconds

        for _ in range(call_count):
            self._timestamps.append(now)

        while self._timestamps and self._timestamps[0] < now - window:
            self._timestamps.pop(0)

        triggered = len(self._timestamps) > self.max_calls
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="tool-call-frequency",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Tool call rate exceeded: {len(self._timestamps)} calls in {window}s window" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"calls_in_window": len(self._timestamps), "max_calls": self.max_calls, "window_seconds": window} if triggered else None,
        )


def tool_call_frequency(
    *,
    action: str = "block",
    max_calls: int = 10,
    window_seconds: int = 60,
) -> _ToolCallFrequency:
    return _ToolCallFrequency(
        action=action,
        max_calls=max_calls,
        window_seconds=window_seconds,
    )
