"""Detect XSS vulnerabilities in generated code (CWE-79)."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_XSS_PATTERNS = [
    (re.compile(r'\.innerHTML\s*='), "innerHTML assignment"),
    (re.compile(r'\.outerHTML\s*='), "outerHTML assignment"),
    (re.compile(r'document\.write\s*\('), "document.write"),
    (re.compile(r'document\.writeln\s*\('), "document.writeln"),
    (re.compile(r'dangerouslySetInnerHTML'), "dangerouslySetInnerHTML"),
    (re.compile(r'v-html\s*='), "v-html directive"),
    (re.compile(r'\[innerHTML\]'), "Angular innerHTML binding"),
    (re.compile(r'eval\s*\('), "eval()"),
    (re.compile(r'new\s+Function\s*\('), "new Function()"),
    (
        re.compile(
            r'\$\(\s*[\x27"][^\x27"]*[\x27"]\s*\)\.html\s*\('
            r'\s*[^\x27")[^\)]*\)'
        ),
        "jQuery .html() with variable",
    ),
    (
        re.compile(
            r'\$\(\s*[\x27"][^\x27"]*[\x27"]\s*\)\.append\s*\('
            r'\s*[^\x27")[^\)]*\)'
        ),
        "jQuery .append() with variable",
    ),
    (
        re.compile(r'document\.createElement\s*\(\s*[\x27"]script[\x27"]\s*\)'),
        "dynamic script element",
    ),
    (re.compile(r'\.insertAdjacentHTML\s*\('), "insertAdjacentHTML"),
    (re.compile(r'srcdoc\s*='), "srcdoc attribute"),
]


class _CodegenXss:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "codegen-xss"
        self.action = action

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        findings: List[str] = []

        for pattern, label in _XSS_PATTERNS:
            if pattern.search(text):
                findings.append(label)

        triggered = len(findings) > 0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name=self.name,
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                f"XSS risk: {', '.join(findings)}"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"findings": findings, "reason": "CWE-79"}
                if triggered
                else None
            ),
        )


def codegen_xss(*, action: str = "block") -> _CodegenXss:
    return _CodegenXss(action=action)
