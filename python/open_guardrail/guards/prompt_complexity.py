"""Detect overly complex prompts that may be adversarial."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult


def _count_nesting(text: str) -> int:
    max_depth = 0
    depth = 0
    for ch in text:
        if ch in "([{":
            depth += 1
            max_depth = max(max_depth, depth)
        elif ch in ")]}":
            depth = max(0, depth - 1)
    return max_depth


def _special_char_ratio(text: str) -> float:
    if not text:
        return 0.0
    specials = len(re.sub(r"[a-zA-Z0-9\s]", "", text))
    return specials / len(text)


def _punctuation_density(text: str) -> float:
    if not text:
        return 0.0
    puncts = len(re.findall(r"[!?.,;:'\"@#$%^&*(){}[\]<>]", text))
    return puncts / len(text)


def _mixed_scripts(text: str) -> float:
    latin = bool(re.search(r"[a-zA-Z]", text))
    cyrillic = bool(re.search(r"[\u0400-\u04FF]", text))
    cjk = bool(re.search(r"[\u4E00-\u9FFF\u3040-\u30FF]", text))
    arabic = bool(re.search(r"[\u0600-\u06FF]", text))
    count = sum([latin, cyrillic, cjk, arabic])
    return (count - 1) * 0.3 if count > 1 else 0.0


def _unusual_whitespace(text: str) -> float:
    unusual = len(
        re.findall(r"[\t\v\f\r\u00A0\u2000-\u200B\u3000]", text)
    )
    return min(unusual / max(len(text), 1) * 10, 1.0)


class _PromptComplexity:
    def __init__(
        self,
        *,
        action: str = "block",
        max_complexity_score: float = 0.7,
    ) -> None:
        self.name = "prompt-complexity"
        self.action = action
        self._threshold = max_complexity_score

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()

        nest = min(_count_nesting(text) / 10, 1.0)
        spec = _special_char_ratio(text)
        punct = _punctuation_density(text)
        script = _mixed_scripts(text)
        ws = _unusual_whitespace(text)

        score = (
            nest * 0.25
            + spec * 0.25
            + punct * 0.2
            + script * 0.15
            + ws * 0.15
        )
        triggered = score >= self._threshold
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="prompt-complexity",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=round(score, 3),
            message=(
                "Prompt complexity exceeds threshold"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "nesting_depth": _count_nesting(text),
                    "special_char_ratio": round(spec, 2),
                    "punctuation_density": round(punct, 2),
                }
                if triggered
                else None
            ),
        )


def prompt_complexity(
    *,
    action: str = "block",
    max_complexity_score: float = 0.7,
) -> _PromptComplexity:
    return _PromptComplexity(
        action=action,
        max_complexity_score=max_complexity_score,
    )
