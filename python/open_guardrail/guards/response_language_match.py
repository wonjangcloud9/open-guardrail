"""Check response language matches input language."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_SCRIPT_RANGES = {
    "latin": re.compile(r"[A-Za-z\u00C0-\u024F]"),
    "cjk": re.compile(
        r"[\u4E00-\u9FFF\u3040-\u309F"
        r"\u30A0-\u30FF\uAC00-\uD7AF]"
    ),
    "cyrillic": re.compile(r"[\u0400-\u04FF]"),
    "arabic": re.compile(r"[\u0600-\u06FF]"),
    "devanagari": re.compile(r"[\u0900-\u097F]"),
}


def _detect_scripts(text: str) -> dict:
    counts: dict[str, int] = {}
    for name, pat in _SCRIPT_RANGES.items():
        c = len(pat.findall(text))
        if c > 0:
            counts[name] = c
    return counts


def _dominant_script(text: str) -> Optional[str]:
    counts = _detect_scripts(text)
    if not counts:
        return None
    return max(counts, key=counts.get)


class _ResponseLanguageMatch:
    def __init__(
        self,
        *,
        action: str = "warn",
        allowed_languages: Optional[List[str]] = None,
    ) -> None:
        self.name = "response-language-match"
        self.action = action
        self.allowed_languages = allowed_languages

    def check(
        self,
        text: str,
        stage: str = "output",
        *,
        input_text: str = "",
    ) -> GuardResult:
        start = time.perf_counter()

        input_script = _dominant_script(input_text)
        output_script = _dominant_script(text)

        mismatch = False
        reason_parts: list[str] = []

        if (
            input_script
            and output_script
            and input_script != output_script
        ):
            mismatch = True
            reason_parts.append(
                f"Input script: {input_script},"
                f" output script: {output_script}"
            )

        if self.allowed_languages and output_script:
            if output_script not in self.allowed_languages:
                mismatch = True
                reason_parts.append(
                    f"Script '{output_script}' not in"
                    " allowed list"
                )

        triggered = mismatch
        score = 1.0 if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="response-language-match",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Response language mismatch"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "input_script": input_script,
                    "output_script": output_script,
                    "reason": "; ".join(reason_parts),
                }
                if triggered
                else None
            ),
        )


def response_language_match(
    *,
    action: str = "warn",
    allowed_languages: Optional[List[str]] = None,
) -> _ResponseLanguageMatch:
    return _ResponseLanguageMatch(
        action=action,
        allowed_languages=allowed_languages,
    )
