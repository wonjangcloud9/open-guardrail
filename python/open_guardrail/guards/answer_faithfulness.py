"""Verify response is grounded only in provided context."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_ASSERTION_RE = re.compile(
    r"\b(?:is|are|was|were|has|have|had|will|can|does)\b",
    re.IGNORECASE,
)
_NUMBER_RE = re.compile(r"\d+")
_PROPER_NOUN_RE = re.compile(r"\b[A-Z][a-z]{2,}")


def _content_words(text: str) -> list[str]:
    return [
        w
        for w in re.split(r"\W+", text.lower())
        if len(w) >= 4
    ]


def _is_factual(sentence: str) -> bool:
    return bool(
        _ASSERTION_RE.search(sentence)
        or _NUMBER_RE.search(sentence)
        or _PROPER_NOUN_RE.search(sentence)
    )


class _AnswerFaithfulness:
    def __init__(
        self,
        *,
        action: str = "block",
        context_marker: str = "Context:",
        answer_marker: str = "Answer:",
    ) -> None:
        self.name = "answer-faithfulness"
        self.action = action
        self._ctx_marker = context_marker
        self._ans_marker = answer_marker

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()

        ctx_idx = text.find(self._ctx_marker)
        ans_idx = text.find(self._ans_marker)

        if (
            ctx_idx == -1
            or ans_idx == -1
            or ans_idx <= ctx_idx
        ):
            elapsed = (time.perf_counter() - start) * 1000
            return GuardResult(
                guard_name="answer-faithfulness",
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )

        context = text[
            ctx_idx + len(self._ctx_marker) : ans_idx
        ]
        answer = text[ans_idx + len(self._ans_marker) :]
        ctx_words = set(_content_words(context))

        sentences = [
            s
            for s in re.split(r"(?<=[.!?])\s+", answer)
            if s.strip()
        ]
        claims = [s for s in sentences if _is_factual(s)]

        if not claims:
            elapsed = (time.perf_counter() - start) * 1000
            return GuardResult(
                guard_name="answer-faithfulness",
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )

        grounded = 0
        for claim in claims:
            words = _content_words(claim)
            if not words:
                grounded += 1
                continue
            matched = sum(1 for w in words if w in ctx_words)
            if matched / len(words) >= 0.3:
                grounded += 1

        ratio = grounded / len(claims)
        triggered = ratio < 0.5
        score = (1 - ratio) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="answer-faithfulness",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Answer not grounded in context"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "faithfulness_ratio": round(ratio, 2),
                    "grounded_claims": grounded,
                    "total_claims": len(claims),
                }
                if triggered
                else None
            ),
        )


def answer_faithfulness(
    *,
    action: str = "block",
    context_marker: str = "Context:",
    answer_marker: str = "Answer:",
) -> _AnswerFaithfulness:
    return _AnswerFaithfulness(
        action=action,
        context_marker=context_marker,
        answer_marker=answer_marker,
    )
