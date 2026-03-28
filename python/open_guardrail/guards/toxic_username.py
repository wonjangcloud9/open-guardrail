"""Detects toxic or offensive usernames."""

import re
import time

from open_guardrail.core import GuardResult

_PROFANITY = [
    re.compile(
        r"(fuck|shit|ass|bitch|damn|dick|cock|pussy|cunt|bastard)",
        re.IGNORECASE,
    ),
    re.compile(
        r"(nigger|nigga|faggot|retard|tranny)",
        re.IGNORECASE,
    ),
]

_IMPERSONATION = [
    re.compile(
        r"(admin|administrator|moderator|mod"
        r"|support|staff|system|root|owner)",
        re.IGNORECASE,
    ),
    re.compile(
        r"(official|verified|helpdesk|service)",
        re.IGNORECASE,
    ),
]

_INJECTION = [
    re.compile(
        r"['\";]|--|\bor\b\s+\d+=\d+|\bunion\b\s+\bselect\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"<script|javascript:|on(load|error|click)=",
        re.IGNORECASE,
    ),
    re.compile(r"\.\./"),
    re.compile(r"\x00|\x0a|\x0d"),
]

_OFFENSIVE = [
    re.compile(
        r"(hitler|nazi|kkk|isis|terrorist)",
        re.IGNORECASE,
    ),
    re.compile(
        r"(kill|murder|rape|molest)",
        re.IGNORECASE,
    ),
    re.compile(
        r"(n[i1]gg[ae3]r|f[a4]gg[o0]t)",
        re.IGNORECASE,
    ),
]


class _ToxicUsername:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "toxic-username"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []

        for p in _PROFANITY:
            if p.search(text):
                issues.append("profanity")
                break
        for p in _IMPERSONATION:
            if p.search(text):
                issues.append("impersonation")
                break
        for p in _INJECTION:
            if p.search(text):
                issues.append("injection")
                break
        for p in _OFFENSIVE:
            if p.search(text):
                issues.append("offensive")
                break

        triggered = len(issues) > 0
        score = min(len(issues) / 2, 1.0) if triggered else 0.0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="toxic-username",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message="Toxic username detected" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"issues": issues} if triggered else None,
        )


def toxic_username(
    *, action: str = "block"
) -> _ToxicUsername:
    return _ToxicUsername(action=action)
