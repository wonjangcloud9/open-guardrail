"""Detect ReDoS-vulnerable regex patterns (CWE-1333)."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_REGEX_DECL: list[re.Pattern[str]] = [
    re.compile(r"new\s+RegExp\s*\(\s*(['\"`])(.*?)\1"),
    re.compile(r"re\.compile\s*\(\s*r?(['\"])(.*?)\1"),
    re.compile(r"/([^/\n]+)/[gimsuy]*"),
]

_EVIL: list[re.Pattern[str]] = [
    re.compile(r"\([^()]*[+*]\s*\)\s*[+*]"),
    re.compile(r"\(\.\*\)\s*[+*]"),
    re.compile(r"\(\.[+*]\)\s*[+*]"),
    re.compile(r"\(\[[\w\-]+\]\s*[+*]\s*\)\s*[+*]"),
    re.compile(r"\(\w\|\w+\)\s*[+*]"),
    re.compile(r"\(\\[wd]\|\\[wd]\)\s*[+*]"),
]


def _is_evil(pattern: str) -> bool:
    return any(e.search(pattern) for e in _EVIL)


class _CodegenUnsafeRegex:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "codegen-unsafe-regex"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        for decl in _REGEX_DECL:
            for m in decl.finditer(text):
                inner = m.group(2) if m.lastindex and m.lastindex >= 2 else m.group(1)
                if inner and _is_evil(inner):
                    matched.append(inner)

        unique = list(dict.fromkeys(matched))
        triggered = len(unique) > 0
        elapsed = (time.perf_counter() - start) * 1000

        preview = ", ".join(unique[:3])
        if len(unique) > 3:
            preview += f" (+{len(unique) - 3} more)"

        return GuardResult(
            guard_name="codegen-unsafe-regex",
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                f"Unsafe regex detected: {preview}"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "matched": unique,
                    "reason": (
                        "Code contains regex patterns"
                        " vulnerable to catastrophic"
                        " backtracking (ReDoS)"
                    ),
                }
                if triggered
                else None
            ),
        )


def codegen_unsafe_regex(
    *, action: str = "block"
) -> _CodegenUnsafeRegex:
    return _CodegenUnsafeRegex(action=action)
