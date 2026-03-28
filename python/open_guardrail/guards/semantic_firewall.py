"""Semantic-level content filtering with categories."""
from __future__ import annotations

import re
import time
from typing import Dict, List, Optional

from open_guardrail.core import GuardResult

_DEFAULT_CATEGORIES: Dict[str, list[re.Pattern[str]]] = {
    "weapons-creation": [
        re.compile(r"how\s+to\s+(make|build|create)\s+(a\s+)?(bomb|weapon|explosive)", re.IGNORECASE),
        re.compile(r"(assemble|construct)\s+(firearm|gun|rifle)", re.IGNORECASE),
        re.compile(r"3D\s+print\s+(gun|weapon|firearm)", re.IGNORECASE),
    ],
    "illegal-drugs": [
        re.compile(r"how\s+to\s+(make|synthesize|cook|produce)\s+(meth|cocaine|heroin|fentanyl|LSD)", re.IGNORECASE),
        re.compile(r"(drug|narcotic)\s+(recipe|synthesis|manufacturing)", re.IGNORECASE),
    ],
    "cyberattack": [
        re.compile(r"(DDoS|denial.of.service)\s+(attack|tool|script)", re.IGNORECASE),
        re.compile(r"(ransomware|malware|trojan)\s+(code|payload|create)", re.IGNORECASE),
        re.compile(r"exploit\s+(vulnerability|zero.day)", re.IGNORECASE),
    ],
    "self-harm": [
        re.compile(r"how\s+to\s+(commit\s+suicide|kill\s+(myself|yourself))", re.IGNORECASE),
        re.compile(r"(method|way)s?\s+to\s+(self.harm|end\s+(my|your)\s+life)", re.IGNORECASE),
    ],
    "hate-extremism": [
        re.compile(r"(racial|ethnic)\s+superiority", re.IGNORECASE),
        re.compile(r"(genocide|ethnic\s+cleansing)\s+(is\s+)?(good|necessary|justified)", re.IGNORECASE),
        re.compile(r"recruit\s+(for|to)\s+(extremis|terrorist|supremacist)", re.IGNORECASE),
    ],
}


class _SemanticFirewall:
    def __init__(
        self,
        *,
        action: str = "block",
        denied_categories: Optional[List[str]] = None,
        custom_categories: Optional[
            Dict[str, List[re.Pattern[str]]]
        ] = None,
    ) -> None:
        self.name = "semantic-firewall"
        self.action = action
        self._categories: Dict[str, list[re.Pattern[str]]] = {}
        active = (
            denied_categories
            if denied_categories
            else list(_DEFAULT_CATEGORIES.keys())
        )
        for cat in active:
            if cat in _DEFAULT_CATEGORIES:
                self._categories[cat] = _DEFAULT_CATEGORIES[cat]
        if custom_categories:
            for cat, patterns in custom_categories.items():
                self._categories[cat] = patterns

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        triggered_cats: list[str] = []

        for cat, patterns in self._categories.items():
            for pat in patterns:
                if pat.search(text):
                    triggered_cats.append(cat)
                    break

        triggered = len(triggered_cats) > 0
        score = (
            min(len(triggered_cats) / 3, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="semantic-firewall",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Denied content category detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "triggered_categories": triggered_cats,
                    "reason": (
                        "Text matches semantic patterns"
                        " in denied content categories"
                    ),
                }
                if triggered
                else None
            ),
        )


def semantic_firewall(
    *,
    action: str = "block",
    denied_categories: Optional[List[str]] = None,
    custom_categories: Optional[
        Dict[str, List[re.Pattern[str]]]
    ] = None,
) -> _SemanticFirewall:
    return _SemanticFirewall(
        action=action,
        denied_categories=denied_categories,
        custom_categories=custom_categories,
    )
