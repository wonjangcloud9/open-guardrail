"""Keyword-based toxicity detection guard."""

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_WORD_LISTS: dict[str, list[str]] = {
    "profanity": [
        "damn", "hell", "crap", "shit",
        "fuck", "ass", "bastard", "bitch",
    ],
    "hate": [
        "hate you", "subhuman", "inferior race",
        "go back to your country",
        "white supremacy", "racial slur",
    ],
    "threat": [
        "i will kill", "going to hurt you",
        "i will find you", "you will die",
        "death threat", "i will destroy you",
        "burn your house",
    ],
    "harassment": [
        "you are stupid", "you are worthless",
        "nobody likes you", "you are ugly",
        "loser", "shut up", "go away",
        "you disgust me",
    ],
}

_SEVERITY: dict[str, float] = {
    "profanity": 0.6,
    "hate": 1.0,
    "threat": 1.0,
    "harassment": 0.7,
}

_ALL_CATEGORIES = [
    "profanity", "hate", "threat", "harassment",
]


class _Toxicity:
    def __init__(
        self,
        *,
        action: str = "block",
        categories: Optional[List[str]] = None,
        threshold: float = 0.5,
    ) -> None:
        self.name = "toxicity"
        self.action = action
        self._categories = categories or list(
            _ALL_CATEGORIES
        )
        self._threshold = threshold

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        lower = text.lower()
        matched_cats: dict[str, list[str]] = {}
        max_severity = 0.0

        for cat in self._categories:
            words = _WORD_LISTS.get(cat, [])
            found: list[str] = []
            for w in words:
                escaped = re.escape(w)
                pat = re.compile(rf"\b{escaped}\b")
                if pat.search(lower):
                    found.append(w)
            if found:
                matched_cats[cat] = found
                sev = _SEVERITY.get(cat, 0.5)
                if sev > max_severity:
                    max_severity = sev

        cat_keys = list(matched_cats.keys())
        total_matches = sum(
            len(v) for v in matched_cats.values()
        )
        if cat_keys:
            score = min(
                1.0,
                max_severity
                + (1 - max_severity)
                * min((total_matches - 1) / 4, 1),
            )
        else:
            score = 0.0

        triggered = score >= self._threshold
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="toxicity",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Toxic content detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "matched_categories": matched_cats,
                    "reason": (
                        "Text contains toxic content"
                        " including "
                        + ", ".join(cat_keys)
                    ),
                }
                if cat_keys
                else None
            ),
        )


def toxicity(
    *,
    action: str = "block",
    categories: Optional[List[str]] = None,
    threshold: float = 0.5,
) -> _Toxicity:
    return _Toxicity(
        action=action,
        categories=categories,
        threshold=threshold,
    )
