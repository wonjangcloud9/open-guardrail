"""Detects excessive or suspicious tool call patterns."""
from __future__ import annotations

import json
import re
import time
from typing import Dict, List, Optional

from open_guardrail.core import GuardResult


def _parse_tool_name(text: str) -> Optional[str]:
    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict) and isinstance(parsed.get("tool"), str):
            return parsed["tool"]
    except (json.JSONDecodeError, TypeError):
        pass
    m = re.search(r"\btool[_\s]*(?:call|use|invoke)\s*[:\-]?\s*[\"']?(\w+)", text, re.I)
    return m.group(1) if m else None


class _ToolAbuse:
    def __init__(
        self,
        *,
        action: str = "block",
        max_calls_in_window: int = 20,
        window_ms: int = 60_000,
        max_same_tool_calls: int = 10,
        deny_sequences: Optional[List[List[str]]] = None,
    ) -> None:
        self.name = "tool-abuse"
        self.action = action
        self.max_calls = max_calls_in_window
        self.window_ms = window_ms
        self.max_same = max_same_tool_calls
        self.deny_sequences = deny_sequences or []
        self._history: List[Dict] = []

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        tool = _parse_tool_name(text)
        if not tool:
            elapsed = (time.perf_counter() - start) * 1000
            return GuardResult(
                guard_name="tool-abuse", passed=True, action="allow", latency_ms=round(elapsed, 2),
            )
        now = time.time() * 1000
        self._history.append({"tool": tool, "ts": now})
        cutoff = now - self.window_ms
        self._history = [h for h in self._history if h["ts"] >= cutoff]
        violations: List[str] = []
        if len(self._history) > self.max_calls:
            violations.append(f"{len(self._history)} calls in window (max {self.max_calls})")
        counts: Dict[str, int] = {}
        for h in self._history:
            counts[h["tool"]] = counts.get(h["tool"], 0) + 1
        for t, c in counts.items():
            if c > self.max_same:
                violations.append(f"{t} called {c} times (max {self.max_same})")
        recent = [h["tool"] for h in self._history]
        for seq in self.deny_sequences:
            if len(recent) >= len(seq) and recent[-len(seq) :] == seq:
                violations.append(f"Denied sequence: {' -> '.join(seq)}")
        triggered = len(violations) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="tool-abuse",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Tool abuse: {'; '.join(violations)}" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"violations": violations} if triggered else None,
        )


def tool_abuse(
    *,
    action: str = "block",
    max_calls_in_window: int = 20,
    window_ms: int = 60_000,
    max_same_tool_calls: int = 10,
    deny_sequences: Optional[List[List[str]]] = None,
) -> _ToolAbuse:
    return _ToolAbuse(
        action=action,
        max_calls_in_window=max_calls_in_window,
        window_ms=window_ms,
        max_same_tool_calls=max_same_tool_calls,
        deny_sequences=deny_sequences,
    )
