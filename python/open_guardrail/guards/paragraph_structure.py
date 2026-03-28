"""Validate paragraph structure."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult


def _count_words(s: str) -> int:
    return len(
        [w for w in s.strip().split() if w]
    )


class _ParagraphStructure:
    def __init__(
        self,
        *,
        action: str = "warn",
        max_words: int = 200,
    ) -> None:
        self.name = "paragraph-structure"
        self.action = action
        self._max_words = max_words

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []
        paragraphs = [
            p.strip()
            for p in re.split(r"\n\s*\n", text)
            if p.strip()
        ]

        for i, p in enumerate(paragraphs):
            if re.match(r"^#{1,6}\s", p):
                continue
            if re.match(r"^[-*+]\s", p):
                continue
            if p.startswith("|"):
                continue

            wc = _count_words(p)
            if wc > self._max_words:
                issues.append(
                    f"Paragraph {i+1} too long"
                    f" ({wc} words,"
                    f" max {self._max_words})"
                )

            sents = [
                s.strip()
                for s in re.split(
                    r"(?<=[.!?])\s+", p
                )
                if s.strip()
            ]
            if len(sents) == 1 and wc > 10:
                issues.append(
                    f"Paragraph {i+1} has"
                    " only one sentence"
                )

        triggered = len(issues) > 0
        score = (
            min(len(issues) / 3, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="paragraph-structure",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Paragraph structure issues found"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "issues": issues,
                    "paragraph_count": len(paragraphs),
                }
                if triggered
                else None
            ),
        )


def paragraph_structure(
    *,
    action: str = "warn",
    max_words: int = 200,
) -> _ParagraphStructure:
    return _ParagraphStructure(
        action=action, max_words=max_words
    )
