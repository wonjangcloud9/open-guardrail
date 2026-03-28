"""Cross-site scripting (XSS) detection guard."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_XSS_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"<script[\s>]", re.I), "script-tag"),
    (
        re.compile(r"javascript\s*:", re.I),
        "javascript-uri",
    ),
    (
        re.compile(
            r"on(load|error|click|mouseover|focus"
            r"|blur|submit|change|input"
            r"|keyup|keydown)\s*=",
            re.I,
        ),
        "event-handler",
    ),
    (re.compile(r"<iframe[\s>]", re.I), "iframe-tag"),
    (re.compile(r"<object[\s>]", re.I), "object-tag"),
    (re.compile(r"<embed[\s>]", re.I), "embed-tag"),
    (
        re.compile(r"<svg[\s>].*?on\w+\s*=", re.I),
        "svg-event",
    ),
    (
        re.compile(r"expression\s*\(", re.I),
        "css-expression",
    ),
    (
        re.compile(
            r"url\s*\(\s*['\"]?\s*javascript", re.I
        ),
        "css-javascript",
    ),
    (
        re.compile(r"<img[^>]+onerror", re.I),
        "img-onerror",
    ),
    (
        re.compile(
            r"document\.(cookie|domain|write)", re.I
        ),
        "dom-access",
    ),
    (
        re.compile(r"window\.(location|open)", re.I),
        "window-access",
    ),
    (re.compile(r"eval\s*\(", re.I), "eval-call"),
    (
        re.compile(r"innerHTML\s*=", re.I),
        "innerhtml-assign",
    ),
    (
        re.compile(r"fromCharCode", re.I),
        "char-encode",
    ),
    (re.compile(r"<\/?\s*body", re.I), "body-tag"),
    (re.compile(r"<\/?\s*html", re.I), "html-tag"),
    (re.compile(r"<base[\s>]", re.I), "base-tag"),
    (re.compile(r"<form[\s>]", re.I), "form-tag"),
    (re.compile(r"<meta[\s>]", re.I), "meta-tag"),
]


def _sanitize(text: str) -> str:
    result = text
    result = re.sub(
        r"<script[^>]*>[\s\S]*?</script>",
        "",
        result,
        flags=re.I,
    )
    result = re.sub(
        r"<iframe[^>]*>[\s\S]*?</iframe>",
        "",
        result,
        flags=re.I,
    )
    result = re.sub(
        r"on\w+\s*=\s*(['\"])[^'\"]*\1",
        "",
        result,
        flags=re.I,
    )
    result = re.sub(
        r"javascript\s*:[^\s\"']+",
        "",
        result,
        flags=re.I,
    )
    result = result.replace("<", "&lt;").replace(
        ">", "&gt;"
    )
    return result


class _XssGuard:
    def __init__(
        self, *, action: str = "block"
    ) -> None:
        self.name = "xss-guard"
        self.action = action

    def check(
        self, text: str, stage: str = "input"
    ) -> GuardResult:
        start = time.perf_counter()
        matched: list[str] = []

        for pat, label in _XSS_PATTERNS:
            if pat.search(text):
                matched.append(label)

        unique = list(dict.fromkeys(matched))
        triggered = len(unique) > 0
        elapsed = (time.perf_counter() - start) * 1000

        if not triggered:
            return GuardResult(
                guard_name="xss-guard",
                passed=True,
                action="allow",
                latency_ms=round(elapsed, 2),
            )

        if self.action == "sanitize":
            return GuardResult(
                guard_name="xss-guard",
                passed=True,
                action="override",
                override_text=_sanitize(text),
                latency_ms=round(elapsed, 2),
                details={"matched": unique},
            )

        return GuardResult(
            guard_name="xss-guard",
            passed=False,
            action=self.action,
            message=(
                "XSS patterns detected: "
                + ", ".join(unique)
            ),
            latency_ms=round(elapsed, 2),
            details={
                "matched": unique,
                "reason": (
                    "Text contains cross-site scripting"
                    " patterns that could execute"
                    " malicious code"
                ),
            },
        )


def xss_guard(*, action: str = "block") -> _XssGuard:
    return _XssGuard(action=action)
