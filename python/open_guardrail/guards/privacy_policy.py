"""Privacy policy compliance checking."""

import re
import time

from open_guardrail.core import GuardResult

_BASE_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"sell\s+your\s+data", re.IGNORECASE,
    ),
    re.compile(
        r"share\s+with\s+third\s+parties"
        r"\s+without\s+notice",
        re.IGNORECASE,
    ),
    re.compile(
        r"track\s+without\s+consent", re.IGNORECASE,
    ),
    re.compile(
        r"no\s+opt[\-\s]?out", re.IGNORECASE,
    ),
    re.compile(
        r"cannot\s+request\s+deletion", re.IGNORECASE,
    ),
    re.compile(
        r"permanent\s+cookie", re.IGNORECASE,
    ),
]

_COPPA_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"collect\s+data\s+from\s+children"
        r"\s+under\s+13",
        re.IGNORECASE,
    ),
    re.compile(
        r"minors?\s+under\s+13\s+without\s+parental",
        re.IGNORECASE,
    ),
]

_CCPA_PATTERNS: list[re.Pattern[str]] = [
    re.compile(
        r"no\s+right\s+to\s+know", re.IGNORECASE,
    ),
    re.compile(
        r"cannot\s+opt[\-\s]?out\s+of\s+sale",
        re.IGNORECASE,
    ),
    re.compile(
        r"discriminat(e|ion)\s+for\s+exercising"
        r"\s+rights",
        re.IGNORECASE,
    ),
]


class _PrivacyPolicy:
    def __init__(
        self,
        *,
        action: str = "flag",
        check_coppa: bool = True,
        check_ccpa: bool = True,
    ) -> None:
        self.name = "privacy-policy"
        self.action = action
        self._patterns = list(_BASE_PATTERNS)
        if check_coppa:
            self._patterns.extend(_COPPA_PATTERNS)
        if check_ccpa:
            self._patterns.extend(_CCPA_PATTERNS)

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        for pat in self._patterns:
            if pat.search(text):
                matched.append(pat.pattern)

        triggered = len(matched) > 0
        score = min(len(matched) / 3, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="privacy-policy",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Privacy policy violation detected"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {
                    "matched_patterns": len(matched),
                    "reason": (
                        "Text contains language that"
                        " may violate privacy policy"
                        " requirements including COPPA"
                        " and CCPA regulations"
                    ),
                }
                if triggered
                else None
            ),
        )


def privacy_policy(
    *,
    action: str = "flag",
    check_coppa: bool = True,
    check_ccpa: bool = True,
) -> _PrivacyPolicy:
    return _PrivacyPolicy(
        action=action,
        check_coppa=check_coppa,
        check_ccpa=check_ccpa,
    )
