"""Detect non-inclusive language and suggest alternatives."""
from __future__ import annotations

import re
import time
from typing import List

from open_guardrail.core import GuardResult

_TERM_MAP = [
    (re.compile(r"\bblacklist(?:ed|ing|s)?\b", re.I), "blacklist", "denylist"),
    (re.compile(r"\bwhitelist(?:ed|ing|s)?\b", re.I), "whitelist", "allowlist"),
    (re.compile(r"\bmaster(?:/|\s*(?:and|&)\s*)slave\b", re.I), "master/slave", "primary/replica"),
    (re.compile(r"\bmankind\b", re.I), "mankind", "humankind"),
    (re.compile(r"\bchairman\b", re.I), "chairman", "chairperson"),
    (re.compile(r"\bmanpower\b", re.I), "manpower", "workforce"),
    (re.compile(r"\b(?:he|she)/(?:she|he)\b", re.I), "he/she", "they"),
    (re.compile(r"\bhandicapped\b", re.I), "handicapped", "person with disability"),
    (re.compile(r"\b(?:that'?s\s+)?(?:crazy|insane)\b", re.I), "crazy/insane", "unexpected/surprising"),
    (re.compile(r"\bhey\s+guys\b|\byou\s+guys\b|\bguys\b(?=\s*[,!?.])", re.I), "guys", "everyone/team/folks"),
    (re.compile(r"\bdummy\s+(?:value|data|variable|text)\b", re.I), "dummy", "placeholder"),
    (re.compile(r"\bsanity\s+check\b", re.I), "sanity check", "validation check"),
    (re.compile(r"\bgrandfathered?\s*(?:in)?\b", re.I), "grandfathered", "legacy/exempted"),
    (re.compile(r"\bcrippled?\b", re.I), "cripple", "disabled/impaired"),
    (re.compile(r"\blame\b", re.I), "lame", "inadequate/unimpressive"),
]


class _InclusiveLanguage:
    def __init__(
        self, *, action: str = "warn"
    ) -> None:
        self.name = "inclusive-language"
        self.action = action

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        found: List[dict] = []

        for pattern, term, suggestion in _TERM_MAP:
            m = pattern.search(text)
            if m:
                found.append(
                    {
                        "term": term,
                        "suggestion": suggestion,
                        "match": m.group(0),
                    }
                )

        triggered = len(found) > 0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="inclusive-language",
            passed=not triggered,
            action=(
                self.action if triggered else "allow"
            ),
            message=(
                f'Non-inclusive language found:'
                f' "{found[0]["match"]}"'
                f' -> consider "{found[0]["suggestion"]}"'
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "found": found,
                    "reason": (
                        "Text contains non-inclusive"
                        " terminology"
                    ),
                }
                if triggered
                else None
            ),
        )


def inclusive_language(
    *, action: str = "warn"
) -> _InclusiveLanguage:
    return _InclusiveLanguage(action=action)
