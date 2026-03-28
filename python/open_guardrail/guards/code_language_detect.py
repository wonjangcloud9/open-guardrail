"""Detect programming language in code blocks."""
from __future__ import annotations

import re
import time

from open_guardrail.core import GuardResult

_LANG_PATTERNS: dict[str, re.Pattern[str]] = {
    "python": re.compile(
        r"\b(def |import |from \w+ import"
        r"|class \w+:|if __name__)"
    ),
    "javascript": re.compile(
        r"\b(const |let |var |function "
        r"|=>|require\(|module\.exports)"
    ),
    "typescript": re.compile(
        r"\b(interface |type |enum "
        r"|: string|: number|: boolean)"
    ),
    "java": re.compile(
        r"\b(public class |private |protected "
        r"|System\.out|void main)"
    ),
    "go": re.compile(
        r"\b(func |package |import \("
        r"|fmt\.|go |chan )"
    ),
    "rust": re.compile(
        r"\b(fn |let mut |impl "
        r"|pub fn |use std|match \w+ \{)"
    ),
    "cpp": re.compile(
        r"\b(#include|std::|cout|cin"
        r"|nullptr|template<)"
    ),
    "c": re.compile(
        r"\b(#include <stdio|printf\("
        r"|malloc\(|int main\()"
    ),
    "ruby": re.compile(
        r"\b(def |end$|puts |require "
        r"|attr_accessor|class \w+ < )",
        re.MULTILINE,
    ),
    "php": re.compile(
        r"(<\?php|\$\w+\s*="
        r"|function \w+\(.*\$)"
    ),
}


class _CodeLanguageDetect:
    def __init__(
        self,
        *,
        action: str = "warn",
        require_language_tag: bool = False,
    ) -> None:
        self.name = "code-language-detect"
        self.action = action
        self._require_tag = require_language_tag

    def check(
        self, text: str, stage: str = "output"
    ) -> GuardResult:
        start = time.perf_counter()
        issues: list[str] = []
        detected: dict[str, list[str]] = {}
        block_pat = re.compile(
            r"```(\w*)\n([\s\S]*?)```"
        )

        for m in block_pat.finditer(text):
            tag = m.group(1)
            code = m.group(2)
            if self._require_tag and not tag:
                issues.append(
                    "Code block missing language tag"
                )
            for lang, pat in _LANG_PATTERNS.items():
                if pat.search(code):
                    detected.setdefault(lang, []).append(
                        code[:40]
                    )

        triggered = len(issues) > 0
        score = (
            min(len(issues) / 3, 1.0)
            if triggered
            else 0.0
        )
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name="code-language-detect",
            passed=not triggered,
            action=self.action if triggered else "allow",
            score=score,
            message=(
                "Code block issues found"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details={
                "detected_languages": list(
                    detected.keys()
                ),
                "issues": issues,
            },
        )


def code_language_detect(
    *,
    action: str = "warn",
    require_language_tag: bool = False,
) -> _CodeLanguageDetect:
    return _CodeLanguageDetect(
        action=action,
        require_language_tag=require_language_tag,
    )
