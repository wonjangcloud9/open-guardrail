"""Detect missing input validation in generated code (CWE-20)."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

DIRECT_INPUT_PATTERNS = [
    re.compile(r"req\.body\.\w+"),
    re.compile(r"req\.params\.\w+"),
    re.compile(r"req\.query\.\w+"),
    re.compile(r"request\.form\["),
    re.compile(r"request\.args\["),
    re.compile(r"request\.json\b"),
    re.compile(r"request\.GET\["),
    re.compile(r"request\.POST\["),
]

DANGEROUS_SINK_PATTERNS = [
    re.compile(r"db\.query\s*\(\s*req\."),
    re.compile(r"db\.execute\s*\(\s*req\."),
    re.compile(r"fs\.readFile\w*\s*\(\s*req\."),
    re.compile(r"fs\.writeFile\w*\s*\(\s*req\."),
    re.compile(r"open\s*\(\s*request\."),
    re.compile(r"subprocess\.\w+\(\s*request\."),
    re.compile(r"exec\s*\(\s*req\."),
    re.compile(r"eval\s*\(\s*req\."),
]

UNSAFE_COERCION_PATTERNS = [
    re.compile(r"parseInt\s*\(\s*req\."),
    re.compile(r"Number\s*\(\s*req\."),
    re.compile(r"int\s*\(\s*request\."),
    re.compile(r"float\s*\(\s*request\."),
]

VALIDATION_INDICATORS = [
    re.compile(r"joi\.", re.IGNORECASE),
    re.compile(r"zod\.", re.IGNORECASE),
    re.compile(r"yup\.", re.IGNORECASE),
    re.compile(r"\.validate\s*\("),
    re.compile(r"\.safeParse\s*\("),
    re.compile(r"\.parse\s*\("),
    re.compile(r"assert\s"),
    re.compile(r"if\s*\("),
    re.compile(r"check\s*\("),
    re.compile(r"isNaN\s*\("),
    re.compile(r"Number\.isFinite"),
    re.compile(r"Number\.isNaN"),
    re.compile(r"WTForms", re.IGNORECASE),
    re.compile(r"serializer", re.IGNORECASE),
    re.compile(r"marshmallow", re.IGNORECASE),
    re.compile(r"pydantic", re.IGNORECASE),
]


class _CodegenInputValidation:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "codegen-input-validation"
        self.action = action

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        findings: List[str] = []

        has_validation = any(p.search(text) for p in VALIDATION_INDICATORS)

        if not has_validation:
            for p in DIRECT_INPUT_PATTERNS:
                if p.search(text):
                    findings.append(f"unvalidated_input:{p.pattern}")

        for p in DANGEROUS_SINK_PATTERNS:
            if p.search(text):
                findings.append(f"dangerous_sink:{p.pattern}")

        for p in UNSAFE_COERCION_PATTERNS:
            m = p.search(text)
            if m:
                ctx_start = max(0, m.start() - 80)
                ctx_end = min(len(text), m.end() + 80)
                ctx = text[ctx_start:ctx_end]
                if not re.search(r"isNaN|Number\.isFinite|Number\.isNaN", ctx):
                    findings.append(f"unsafe_coercion:{p.pattern}")

        triggered = len(findings) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name=self.name,
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Input validation missing: {len(findings)} issue(s) found" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={
                "matchCount": len(findings),
                "findings": findings,
                "reason": "CWE-20: Missing input validation on user-supplied data",
            } if triggered else None,
        )


def codegen_input_validation(*, action: str = "block") -> _CodegenInputValidation:
    return _CodegenInputValidation(action=action)
