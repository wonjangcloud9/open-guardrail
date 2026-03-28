"""Detects API abuse patterns."""

import re
import time

from open_guardrail.core import GuardResult

_ENUM_RE = re.compile(
    r"(?:id|page|offset|index|num)[\s=:]+(\d+)",
    re.IGNORECASE,
)
_SEQ_RE = re.compile(r"(\d+)(?:\s*,\s*|\s+)(\d+)(?:\s*,\s*|\s+)(\d+)")
_BRUTE_RE = [
    re.compile(
        r"(?:password|passwd|pwd|token|key)[\s=:]+\S+",
        re.IGNORECASE,
    ),
    re.compile(r"(?:login|auth|signin)\s", re.IGNORECASE),
]
_FUZZ_RE = [
    re.compile(r"['\"><>{}|\\^~`]"),
    re.compile(r"(\x00|\x0a|\x0d|%00|%0a|%0d)", re.IGNORECASE),
    re.compile(r"\.\./"),
    re.compile(r"(?:AAAA{10,}|xxxx{10,})", re.IGNORECASE),
]


class _ApiAbuseDetect:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "api-abuse-detect"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []

        enum_matches = _ENUM_RE.findall(text)
        if len(enum_matches) >= 3:
            issues.append("enumeration_pattern")

        seq = _SEQ_RE.search(text)
        if seq:
            a, b, c = int(seq.group(1)), int(seq.group(2)), int(seq.group(3))
            if b - a == c - b and 1 <= b - a <= 10:
                issues.append("sequential_ids")

        for pat in _BRUTE_RE:
            if len(pat.findall(text)) >= 3:
                issues.append("brute_force_pattern")
                break

        fuzz_count = sum(1 for p in _FUZZ_RE if p.search(text))
        if fuzz_count >= 2:
            issues.append("parameter_fuzzing")

        triggered = len(issues) > 0
        score = min(len(issues) / 3, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="api-abuse-detect",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message="API abuse pattern detected" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"issues": issues} if triggered else None,
        )


def api_abuse_detect(
    *, action: str = "block"
) -> _ApiAbuseDetect:
    return _ApiAbuseDetect(action=action)
