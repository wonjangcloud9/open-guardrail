"""Multi-category safety classifier for harmful content."""

import re
import time
from typing import Dict, List, Optional

from open_guardrail.core import GuardResult

_CATEGORY_PATTERNS: dict[str, list[re.Pattern[str]]] = {
    "harmful-instructions": [
        re.compile(r"\b(?:how\s+to\s+(?:make|build|create|synthesize))\s+(?:a\s+)?(?:bomb|explosive|weapon|poison|drug)", re.I),
        re.compile(r"\b(?:instructions?\s+(?:for|to)\s+(?:hack|break\s+into|exploit))", re.I),
    ],
    "self-harm": [
        re.compile(r"\b(?:suicide|kill\s+myself|end\s+my\s+life|self[_\-\s]*harm|cut\s+myself)\b", re.I),
        re.compile(r"\b(?:ways?\s+to\s+die|painless\s+death|methods?\s+of\s+suicide)\b", re.I),
    ],
    "harassment": [
        re.compile(r"\b(?:you\s+(?:are|should)\s+(?:die|kill|stupid|worthless|ugly|fat))\b", re.I),
        re.compile(r"\b(?:threaten|intimidat|bully|harass|stalk)\w*\b", re.I),
    ],
    "deception": [
        re.compile(r"\b(?:pretend|impersonat|disguise\s+as|pose\s+as|fake\s+(?:identity|account))\b", re.I),
        re.compile(r"\b(?:catfish|scam|fraud|phishing|social\s+engineer)\b", re.I),
    ],
    "illegal-activity": [
        re.compile(r"\b(?:money\s+launder|tax\s+evas|insider\s+trad|brib|counterfeit)\w*\b", re.I),
        re.compile(r"\b(?:identity\s+theft|credit\s+card\s+fraud|wire\s+fraud)\b", re.I),
    ],
}


class _SafetyClassifier:
    def __init__(self, *, action: str = "block", categories: Optional[List[str]] = None, threshold: float = 0.5) -> None:
        self.name = "safety-classifier"
        self.action = action
        self.categories = categories or list(_CATEGORY_PATTERNS.keys())
        self.threshold = threshold

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        scores: Dict[str, float] = {}
        matched: List[str] = []
        for cat in self.categories:
            patterns = _CATEGORY_PATTERNS.get(cat, [])
            hits = sum(1 for p in patterns if p.search(text))
            score = hits / max(len(patterns), 1)
            scores[cat] = round(score, 2)
            if score >= self.threshold:
                matched.append(cat)
        triggered = len(matched) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name="safety-classifier",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Safety: {', '.join(matched)}" if triggered else None,
            score=max(scores[c] for c in matched) if matched else 0.0,
            latency_ms=round(elapsed, 2),
            details={"flagged_categories": matched, "scores": scores} if triggered else None,
        )


def safety_classifier(*, action: str = "block", categories: Optional[List[str]] = None, threshold: float = 0.5) -> _SafetyClassifier:
    return _SafetyClassifier(action=action, categories=categories, threshold=threshold)
