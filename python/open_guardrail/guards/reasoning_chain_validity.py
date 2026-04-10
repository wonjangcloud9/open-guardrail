"""Validate logical coherence of chain-of-thought reasoning."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_STEP_RE = re.compile(r"\bstep\s+(\d+)\b", re.IGNORECASE)
_CONCLUSION_RE = re.compile(
    r"\b(?:therefore|thus|hence"
    r"|in\s+conclusion|consequently)\b",
    re.IGNORECASE,
)
_REASON_RE = re.compile(
    r"\b(?:because|since|as\s+a\s+result)\b",
    re.IGNORECASE,
)
_SEQUENCE_RE = re.compile(
    r"\b(?:first|second|third|then|next|finally)\b",
    re.IGNORECASE,
)


def _check_step_gaps(text: str) -> list[str]:
    issues: list[str] = []
    steps = [int(m.group(1)) for m in _STEP_RE.finditer(text)]
    if len(steps) >= 2:
        sorted_steps = sorted(set(steps))
        for i in range(1, len(sorted_steps)):
            if sorted_steps[i] - sorted_steps[i - 1] > 1:
                missing = list(
                    range(
                        sorted_steps[i - 1] + 1,
                        sorted_steps[i],
                    )
                )
                issues.append(
                    f"Missing step(s): "
                    f"{', '.join(str(n) for n in missing)}"
                )
    return issues


def _check_unsupported_conclusions(
    text: str,
) -> list[str]:
    issues: list[str] = []
    sentences = re.split(r"(?<=[.!?])\s+", text)

    for i, s in enumerate(sentences):
        if not _CONCLUSION_RE.search(s):
            continue
        prior = " ".join(sentences[:i])
        has_reasoning = (
            _REASON_RE.search(prior)
            or _SEQUENCE_RE.search(prior)
            or _STEP_RE.search(prior)
        )
        if not has_reasoning and i > 0:
            issues.append(
                "Conclusion without preceding reasoning steps"
            )
    return issues


def _check_circular_reasoning(text: str) -> list[str]:
    issues: list[str] = []
    sentences = re.split(r"(?<=[.!?])\s+", text)

    for s in sentences:
        lower = s.lower()
        idx = lower.find("because")
        if idx == -1:
            continue
        before = [
            w
            for w in re.split(r"\W+", lower[:idx])
            if len(w) >= 4
        ]
        after = [
            w
            for w in re.split(r"\W+", lower[idx + 7 :])
            if len(w) >= 4
        ]
        if not before or not after:
            continue
        before_set = set(before)
        overlap = [w for w in after if w in before_set]
        if (
            len(overlap) >= 3
            and len(overlap) / len(after) >= 0.7
        ):
            issues.append(
                "Circular reasoning: "
                "conclusion restated as reason"
            )
    return issues


def _check_empty_reasoning(text: str) -> list[str]:
    issues: list[str] = []
    has_conclusion = bool(_CONCLUSION_RE.search(text))
    has_sequence = bool(_SEQUENCE_RE.search(text))
    has_steps = bool(_STEP_RE.search(text))
    has_reason = bool(_REASON_RE.search(text))

    if (
        has_conclusion
        and not has_sequence
        and not has_steps
        and not has_reason
    ):
        issues.append(
            "Empty reasoning: conclusion without any steps"
        )
    return issues


class _ReasoningChainValidity:
    def __init__(
        self, *, action: str = "block"
    ) -> None:
        self.name = "reasoning-chain-validity"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()

        markers = [
            _STEP_RE,
            _CONCLUSION_RE,
            _REASON_RE,
            _SEQUENCE_RE,
        ]
        has_reasoning = any(r.search(text) for r in markers)

        if not has_reasoning:
            elapsed = (time.perf_counter() - start) * 1000
            return GuardResult(
                guard_name="reasoning-chain-validity",
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )

        issues = (
            _check_step_gaps(text)
            + _check_unsupported_conclusions(text)
            + _check_circular_reasoning(text)
            + _check_empty_reasoning(text)
        )

        triggered = len(issues) > 0
        score = (
            min(len(issues) / 3, 1.0) if triggered else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="reasoning-chain-validity",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Reasoning chain issues detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "issues": issues,
                    "issue_count": len(issues),
                }
                if triggered
                else None
            ),
        )


def reasoning_chain_validity(
    *, action: str = "block"
) -> _ReasoningChainValidity:
    return _ReasoningChainValidity(action=action)
