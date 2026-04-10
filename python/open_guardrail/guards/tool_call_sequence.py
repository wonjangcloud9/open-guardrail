"""Detects dangerous sequential tool call patterns."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_DEFAULT_DANGEROUS_SEQUENCES: List[List[str]] = [
    ["read", "delete"],
    ["query", "drop"],
    ["list", "delete"],
    ["get", "send"],
    ["fetch", "upload"],
    ["read", "execute"],
    ["download", "execute"],
    ["search", "modify"],
    ["access", "transfer"],
    ["view", "export"],
]

_ACTION_PATTERNS = [
    re.compile(r"(?:tool_call|function_call|use_tool|Action)[\s:]*(\w+)", re.IGNORECASE),
    re.compile(r"<tool>\s*(\w+)", re.IGNORECASE),
    re.compile(r"(\w+)\s*\("),
]


def _extract_actions(text: str) -> List[str]:
    actions: List[str] = []
    for pattern in _ACTION_PATTERNS:
        for m in pattern.finditer(text):
            actions.append(m.group(1).lower())
    return actions


class _ToolCallSequence:
    def __init__(
        self,
        *,
        action: str = "block",
        dangerous_sequences: Optional[List[List[str]]] = None,
    ) -> None:
        self.name = "tool-call-sequence"
        self.action = action
        self.sequences = dangerous_sequences or _DEFAULT_DANGEROUS_SEQUENCES

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        actions = _extract_actions(text)
        matched: List[List[str]] = []

        for first, second in self.sequences:
            try:
                first_idx = actions.index(first)
            except ValueError:
                continue
            for i in range(first_idx + 1, len(actions)):
                if actions[i] == second:
                    matched.append([first, second])
                    break

        triggered = len(matched) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="tool-call-sequence",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Dangerous tool sequence detected: {matched}" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matched_sequences": matched, "extracted_actions": actions} if triggered else None,
        )


def tool_call_sequence(
    *,
    action: str = "block",
    dangerous_sequences: Optional[List[List[str]]] = None,
) -> _ToolCallSequence:
    return _ToolCallSequence(
        action=action,
        dangerous_sequences=dangerous_sequences,
    )
