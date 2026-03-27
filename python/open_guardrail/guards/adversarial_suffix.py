"""Detects adversarial suffix attacks via entropy analysis."""

import math
import time
from collections import Counter

from open_guardrail.core import GuardResult


class _AdversarialSuffix:
    def __init__(
        self,
        *,
        action: str = "warn",
        entropy_threshold: float = 4.5,
        non_ascii_threshold: float = 0.3,
    ) -> None:
        self.name = "adversarial-suffix"
        self.action = action
        self.entropy_threshold = entropy_threshold
        self.non_ascii_threshold = non_ascii_threshold

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        issues = []

        if len(text) < 10:
            elapsed = (time.perf_counter() - start) * 1000
            return GuardResult(
                guard_name=self.name,
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )

        cutoff = max(1, int(len(text) * 0.7))
        suffix = text[cutoff:]

        entropy = self._char_entropy(suffix)
        if entropy > self.entropy_threshold:
            issues.append(f"high_entropy:{entropy:.2f}")

        non_ascii = sum(1 for c in suffix if ord(c) > 127)
        ratio = non_ascii / len(suffix) if suffix else 0
        if ratio > self.non_ascii_threshold:
            issues.append(f"non_ascii_ratio:{ratio:.2f}")

        triggered = len(issues) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name=self.name,
            passed=not triggered,
            action=self.action if triggered else "allow",
            message="Adversarial suffix detected" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"issues": issues, "entropy": round(entropy, 2)} if triggered else None,
        )

    @staticmethod
    def _char_entropy(text: str) -> float:
        if not text:
            return 0.0
        freq = Counter(text)
        length = len(text)
        return -sum(
            (c / length) * math.log2(c / length)
            for c in freq.values()
        )


def adversarial_suffix(
    *,
    action: str = "warn",
    entropy_threshold: float = 4.5,
    non_ascii_threshold: float = 0.3,
) -> _AdversarialSuffix:
    return _AdversarialSuffix(
        action=action,
        entropy_threshold=entropy_threshold,
        non_ascii_threshold=non_ascii_threshold,
    )
