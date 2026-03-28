"""Validate mathematical expressions."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult


class _MathExpressionValidate:
    def __init__(self, *, action: str = "warn") -> None:
        self.name = "math-expression-validate"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []

        math_blocks = re.findall(
            r"\$[^$]+\$|\\\(.*?\\\)|\\\[.*?\\\]", text
        )
        inline = re.findall(
            r"(?<!\w)[\d(][^a-zA-Z\n]*"
            r"[+\-*/^=][^a-zA-Z\n]*[\d)]",
            text,
        )
        expressions = math_blocks + inline

        for expr in expressions:
            depth = 0
            unbalanced = False
            for ch in expr:
                if ch in "([{":
                    depth += 1
                elif ch in ")]}":
                    depth -= 1
                if depth < 0:
                    issues.append(
                        "Unbalanced parentheses in:"
                        f" {expr[:40]}"
                    )
                    unbalanced = True
                    break
            if not unbalanced and depth > 0:
                issues.append(
                    "Unclosed parenthesis in:"
                    f" {expr[:40]}"
                )

            cleaned = expr.replace("**", "")
            cleaned = cleaned.replace("++", "")
            cleaned = cleaned.replace("--", "")
            if re.search(r"[+\-*/^]{2,}", cleaned):
                issues.append(
                    "Invalid operator sequence in:"
                    f" {expr[:40]}"
                )

        triggered = len(issues) > 0
        score = (
            min(len(issues) / 3, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="math-expression-validate",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Math expression issues found"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"issues": issues} if triggered else None
            ),
        )


def math_expression_validate(
    *, action: str = "warn"
) -> _MathExpressionValidate:
    return _MathExpressionValidate(action=action)
