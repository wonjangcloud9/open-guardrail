"""Check bullet point consistency."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult


class _BulletConsistency:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "bullet-consistency"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []
        styles: set[str] = set()
        bullets: list[dict] = []

        for i, line in enumerate(text.split("\n")):
            m = re.match(r"^(\s*)([-*+])\s", line)
            if m:
                styles.add(m.group(2))
                bullets.append(
                    {
                        "indent": len(m.group(1)),
                        "style": m.group(2),
                        "line": i + 1,
                    }
                )

        if len(styles) > 1:
            issues.append(
                "Mixed bullet styles:"
                f" {', '.join(sorted(styles))}"
            )

        for i, b in enumerate(bullets):
            if i == 0 and b["indent"] > 0:
                issues.append(
                    "Orphaned sub-bullet at"
                    f" line {b['line']}"
                )
            elif (
                i > 0
                and b["indent"]
                > bullets[i - 1]["indent"] + 4
            ):
                issues.append(
                    "Excessive indent jump at"
                    f" line {b['line']}"
                )

        triggered = len(issues) > 0
        score = (
            min(len(issues) / 3, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="bullet-consistency",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Bullet consistency issues found"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "issues": issues,
                    "styles_found": list(styles),
                }
                if triggered
                else None
            ),
        )


def bullet_consistency(
    *, action: str = "warn"
) -> _BulletConsistency:
    return _BulletConsistency(action=action)
