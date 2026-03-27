"""Detects code execution patterns."""

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_PATTERNS = {
    "python": [
        re.compile(r"\beval\s*\(", re.I),
        re.compile(r"\bexec\s*\(", re.I),
        re.compile(r"\bos\.system\s*\(", re.I),
        re.compile(r"\bsubprocess\.", re.I),
    ],
    "javascript": [
        re.compile(r"\bnew\s+Function\s*\(", re.I),
        re.compile(r"\bchild_process\b", re.I),
        re.compile(r"\beval\s*\(", re.I),
    ],
    "shell": [
        re.compile(r"\|\s*bash\b", re.I),
        re.compile(r"\|\s*sh\b", re.I),
    ],
}


class _CodeExecutionDetect:
    def __init__(
        self,
        *,
        action: str = "block",
        languages: Optional[List[str]] = None,
    ) -> None:
        self.name = "code-execution-detect"
        self.action = action
        self.languages = languages or list(_PATTERNS.keys())

    def check(self, text: str, stage: str = "input") -> GuardResult:
        start = time.perf_counter()
        matched: List[str] = []
        for lang in self.languages:
            for p in _PATTERNS.get(lang, []):
                m = p.search(text)
                if m:
                    matched.append(m.group()[:60])
        triggered = len(matched) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name=self.name,
            passed=not triggered,
            action=self.action if triggered else "allow",
            message="Code execution detected" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={"matched": matched} if triggered else None,
        )


def code_execution_detect(
    *,
    action: str = "block",
    languages: Optional[List[str]] = None,
) -> _CodeExecutionDetect:
    return _CodeExecutionDetect(action=action, languages=languages)
