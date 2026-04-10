"""Detects gradual manipulation toward restricted topics."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

DEFAULT_TOPICS = ["weapons", "drugs", "hacking", "terrorism", "exploitation", "illegal"]

STEERING_PATTERNS = [
    re.compile(r"hypothetically\s+speaking", re.I),
    re.compile(r"in\s+a\s+fictional\s+scenario", re.I),
    re.compile(r"for\s+a\s+novel\s+i'?m\s+writing", re.I),
    re.compile(r"let'?s\s+say\s+someone\s+wanted\s+to", re.I),
    re.compile(r"what\s+if\s+someone\s+needed\s+to", re.I),
    re.compile(r"asking\s+for\s+a\s+friend", re.I),
    re.compile(r"in\s+theory", re.I),
    re.compile(r"academically\s+speaking", re.I),
    re.compile(r"for\s+research\s+purposes", re.I),
]

SHIFT_PATTERNS = [
    re.compile(r"but\s+actually", re.I),
    re.compile(r"changing\s+the\s+subject", re.I),
    re.compile(r"on\s+a\s+different\s+note", re.I),
]


class _ConversationSteering:
    def __init__(
        self,
        *,
        action: str = "block",
        restricted_topics: Optional[List[str]] = None,
    ) -> None:
        self.name = "conversation-steering"
        self.action = action
        self.topics = [t.lower() for t in (restricted_topics or DEFAULT_TOPICS)]

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        lower = text.lower()
        matched_topics = [t for t in self.topics if t in lower]

        if not matched_topics:
            elapsed = (time.perf_counter() - start) * 1000
            return GuardResult(
                guard_name="conversation-steering",
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )

        has_steering = any(p.search(text) for p in STEERING_PATTERNS)
        has_shift = any(p.search(text) for p in SHIFT_PATTERNS)
        triggered = has_steering or has_shift
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="conversation-steering",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Conversation steering detected toward: {', '.join(matched_topics)}" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matched_topics": matched_topics, "steering_detected": has_steering, "topic_shift_detected": has_shift} if triggered else None,
        )


def conversation_steering(
    *,
    action: str = "block",
    restricted_topics: Optional[List[str]] = None,
) -> _ConversationSteering:
    return _ConversationSteering(action=action, restricted_topics=restricted_topics)
