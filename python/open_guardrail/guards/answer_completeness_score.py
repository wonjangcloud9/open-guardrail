"""Evaluate if answer addresses all parts of a question."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_QUESTION_WORDS_RE = re.compile(
    r"\b(?:what|how|why|when|where|who|which)\b",
    re.IGNORECASE,
)


def _extract_sub_topics(question: str) -> list[str]:
    topics: list[str] = []

    parts = [
        s.strip()
        for s in question.split("?")
        if s.strip()
    ]
    if len(parts) > 1:
        return parts

    numbered = re.findall(
        r"(?:^|\n)\s*\d+[.)]\s*.+", question
    )
    if len(numbered) > 1:
        return [
            re.sub(r"^\s*\d+[.)]\s*", "", item).strip()
            for item in numbered
        ]

    and_parts = re.split(r"\band\b", question, flags=re.I)
    if len(and_parts) > 1:
        result = [
            p.strip() for p in and_parts if len(p.strip()) > 5
        ]
        if result:
            return result

    matches = list(_QUESTION_WORDS_RE.finditer(question))
    if len(matches) > 1:
        for i, m in enumerate(matches):
            end = (
                matches[i + 1].start()
                if i + 1 < len(matches)
                else None
            )
            topics.append(question[m.start() : end].strip())
        return topics

    if question.strip():
        topics.append(question.strip())
    return topics


def _topic_addressed(topic: str, answer: str) -> bool:
    words = [
        w
        for w in re.split(r"\W+", topic.lower())
        if len(w) >= 4
    ]
    if not words:
        return True
    ans_lower = answer.lower()
    matched = sum(1 for w in words if w in ans_lower)
    return matched / len(words) >= 0.3


class _AnswerCompletenessScore:
    def __init__(
        self,
        *,
        action: str = "block",
        min_completeness: float = 0.5,
    ) -> None:
        self.name = "answer-completeness-score"
        self.action = action
        self._min_comp = min_completeness

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()

        q_idx = text.find("Question:")
        a_idx = text.find("Answer:")

        if q_idx == -1 or a_idx == -1 or a_idx <= q_idx:
            elapsed = (time.perf_counter() - start) * 1000
            return GuardResult(
                guard_name="answer-completeness-score",
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )

        question = text[q_idx + 9 : a_idx]
        answer = text[a_idx + 7 :]
        topics = _extract_sub_topics(question)

        if not topics:
            elapsed = (time.perf_counter() - start) * 1000
            return GuardResult(
                guard_name="answer-completeness-score",
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )

        addressed = sum(
            1 for t in topics if _topic_addressed(t, answer)
        )
        completeness = addressed / len(topics)
        triggered = completeness < self._min_comp
        score = (1 - completeness) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="answer-completeness-score",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Answer is incomplete"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "completeness_score": round(
                        completeness, 2
                    ),
                    "addressed_topics": addressed,
                    "total_topics": len(topics),
                    "min_completeness": self._min_comp,
                }
                if triggered
                else None
            ),
        )


def answer_completeness_score(
    *,
    action: str = "block",
    min_completeness: float = 0.5,
) -> _AnswerCompletenessScore:
    return _AnswerCompletenessScore(
        action=action,
        min_completeness=min_completeness,
    )
