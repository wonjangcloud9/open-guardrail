"""Sanitizes input by stripping dangerous characters."""

import re
import time
import unicodedata
from typing import List

from open_guardrail.core import GuardResult


class _InputSanitize:
    def __init__(self, *, action: str = "block", strip_html: bool = True, normalize_unicode: bool = True, remove_null_bytes: bool = True, max_newlines: int = 5) -> None:
        self.name = "input-sanitize"
        self.action = action
        self.strip_html = strip_html
        self.normalize = normalize_unicode
        self.remove_null = remove_null_bytes
        self.max_nl = max_newlines

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        sanitized = text
        changes: List[str] = []
        if self.remove_null and "\0" in sanitized:
            sanitized = sanitized.replace("\0", "")
            changes.append("null-bytes")
        if self.strip_html and re.search(r"<[^>]+>", sanitized):
            sanitized = re.sub(r"<[^>]*>", "", sanitized)
            changes.append("html-tags")
        if self.normalize:
            normalized = unicodedata.normalize("NFC", sanitized)
            if normalized != sanitized:
                sanitized = normalized
                changes.append("unicode-normalization")
        nl_pat = re.compile(r"\n{" + str(self.max_nl + 1) + r",}")
        if nl_pat.search(sanitized):
            sanitized = nl_pat.sub("\n" * self.max_nl, sanitized)
            changes.append("excessive-newlines")
        modified = len(changes) > 0
        elapsed = (time.perf_counter() - start) * 1000
        if not modified:
            return GuardResult(guard_name="input-sanitize", passed=True, action="allow", latency_ms=round(elapsed, 2))
        if self.action == "mask":
            return GuardResult(guard_name="input-sanitize", passed=True, action="override", override_text=sanitized, latency_ms=round(elapsed, 2), details={"sanitized": changes})
        return GuardResult(guard_name="input-sanitize", passed=False, action=self.action, message=f"Input sanitized: {', '.join(changes)}", latency_ms=round(elapsed, 2), details={"sanitized": changes})


def input_sanitize(*, action: str = "block", strip_html: bool = True, normalize_unicode: bool = True, remove_null_bytes: bool = True, max_newlines: int = 5) -> _InputSanitize:
    return _InputSanitize(action=action, strip_html=strip_html, normalize_unicode=normalize_unicode, remove_null_bytes=remove_null_bytes, max_newlines=max_newlines)
