"""Allowed topics only guard."""

import time
from typing import Dict, List, Optional

from open_guardrail.core import GuardResult

_TOPIC_KEYWORDS: dict[str, list[str]] = {
    "technology": ["software", "computer", "programming", "algorithm", "database", "api", "cloud"],
    "science": ["research", "experiment", "hypothesis", "physics", "chemistry", "biology"],
    "business": ["revenue", "profit", "market", "strategy", "customer", "sales", "product"],
    "education": ["learning", "student", "teacher", "course", "curriculum", "study"],
    "health": ["medical", "health", "wellness", "exercise", "nutrition", "therapy"],
    "cooking": ["recipe", "ingredient", "cooking", "baking", "cuisine", "meal"],
}


class _TopicAllow:
    def __init__(
        self, *, topics: List[str], custom_topics: Optional[Dict[str, List[str]]] = None, action: str = "block",
    ) -> None:
        self.name = "topic-allow"
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
        triggered = len(matched) == 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="topic-allow",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message="No allowed topic detected" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matched_topics": matched, "allowed": list(self._topics.keys())} if triggered else None,
        )


def topic_allow(*, topics: List[str], custom_topics: Optional[Dict[str, List[str]]] = None, action: str = "block") -> _TopicAllow:
    return _TopicAllow(topics=topics, custom_topics=custom_topics, action=action)
