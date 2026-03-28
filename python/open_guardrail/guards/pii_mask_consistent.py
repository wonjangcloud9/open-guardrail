"""Ensures consistent PII masking across a response."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_MASK_RE = re.compile(r"\[([A-Z_]+)\]")
_PARTIAL_RE = re.compile(r"\b\w+\*{2,}\w*\b|\b\w*\*{2,}\w+\b")
_LENGTH_RE = re.compile(r"\[([A-Z_]+):?\d+\]")


class _PiiMaskConsistent:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "pii-mask-consistent"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []

        partials = _PARTIAL_RE.findall(text)
        if partials:
            issues.append(f"partial_masks_found:{len(partials)}")

        length_reveals = _LENGTH_RE.findall(text)
        if length_reveals:
            issues.append(
                f"length_revealing_masks:{len(length_reveals)}"
            )

        masks: dict[str, int] = {}
        for m in _MASK_RE.finditer(text):
            label = m.group(1)
            masks[label] = masks.get(label, 0) + 1

        mask_types = list(masks.keys())
        similar = [
            a
            for a in mask_types
            if any(
                a != b and (a in b or b in a)
                for b in mask_types
            )
        ]
        if similar:
            issues.append(
                f"overlapping_mask_types:{','.join(similar)}"
            )

        triggered = len(issues) > 0
        score = min(len(issues) / 3, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="pii-mask-consistent",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message="Inconsistent PII masking detected" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"issues": issues} if triggered else None,
        )


def pii_mask_consistent(
    *, action: str = "warn"
) -> _PiiMaskConsistent:
    return _PiiMaskConsistent(action=action)
