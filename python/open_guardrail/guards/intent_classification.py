"""Classify user intent and restrict."""
from __future__ import annotations

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_IMPERATIVE = re.compile(
    r"^(?:do|make|create|build|run|execute|delete"
    r"|remove|stop|start|show|list|get|set|put"
    r"|add|update|send|open|close|find|search"
    r"|go|tell|give|write|read|check)\b",
    re.I,
)

_COMPLAINT = [
    re.compile(
        r"\b(?:terrible|horrible|awful|worst|broken"
        r"|useless|frustrat|disappoint|unacceptable"
        r"|ridiculous|angry|furious|annoy|hate)\b",
        re.I,
    ),
    re.compile(
        r"\b(?:problem|issue|bug|error|fail"
        r"|crash|wrong|bad|poor|slow)\b",
        re.I,
    ),
]

_REQUEST = re.compile(
    r"\b(?:please|could\s+you|would\s+you"
    r"|can\s+you|i(?:'d| would) like|kindly)\b",
    re.I,
)


def _classify(text: str) -> str:
    t = text.strip()
    if t.endswith("?"):
        return "question"
    if _REQUEST.search(t):
        return "request"
    score = sum(1 for p in _COMPLAINT if p.search(t))
    if score >= 2:
        return "complaint"
    if _IMPERATIVE.match(t):
        return "command"
    return "unknown"


class _IntentClassification:
    def __init__(
        self,
        *,
        action: str = "block",
        allowed_intents: List[str],
    ) -> None:
        self.name = "intent-classification"
        self.action = action
        self._allowed = allowed_intents

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        intent = _classify(text)
        allowed = intent in self._allowed
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="intent-classification",
            passed=allowed,
            action="allow" if allowed else self.action,
            message=(
                None
                if allowed
                else f'Intent "{intent}" not allowed'
            ),
            latency_ms=round(elapsed, 2),
            details={
                "intent": intent,
                "allowed_intents": self._allowed,
            },
        )


def intent_classification(
    *,
    action: str = "block",
    allowed_intents: List[str],
) -> _IntentClassification:
    return _IntentClassification(
        action=action,
        allowed_intents=allowed_intents,
    )
