"""Blocked topics detection guard."""
from __future__ import annotations

import time
from typing import Dict, List, Optional

from open_guardrail.core import GuardResult

_TOPIC_KEYWORDS: dict[str, list[str]] = {
    "politics": ["election", "democrat", "republican", "liberal", "conservative", "ballot", "congress", "parliament"],
    "religion": ["church", "mosque", "temple", "prayer", "scripture", "bible", "quran", "buddhism"],
    "violence": ["murder", "assault", "weapon", "gun", "shoot", "stab", "bomb", "explosive"],
    "drugs": ["cocaine", "heroin", "marijuana", "meth", "narcotic", "opioid", "drug dealer"],
    "gambling": ["casino", "betting", "poker", "slot machine", "wager", "jackpot"],
    "adult": ["pornography", "explicit", "nsfw", "xxx", "escort", "strip club"],
}


class _TopicDeny:
    def __init__(
        self, *, topics: List[str], custom_topics: Optional[Dict[str, List[str]]] = None, action: str = "block",
    ) -> None:
        self.name = "topic-deny"
        self.action = action
        self._topics: dict[str, list[str]] = {}
        all_topics = {**_TOPIC_KEYWORDS, **(custom_topics or {})}
        for t in topics:
            if t in all_topics:
                self._topics[t] = all_topics[t]

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        lower = text.lower()
        matched: List[str] = []
        for topic, keywords in self._topics.items():
            if any(kw in lower for kw in keywords):
                matched.append(topic)
        triggered = len(matched) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="topic-deny",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Denied topic(s): {', '.join(matched)}" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matched_topics": matched} if triggered else None,
        )


def topic_deny(*, topics: List[str], custom_topics: Optional[Dict[str, List[str]]] = None, action: str = "block") -> _TopicDeny:
    return _TopicDeny(topics=topics, custom_topics=custom_topics, action=action)
