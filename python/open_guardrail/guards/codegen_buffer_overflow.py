"""Detect buffer overflow patterns in generated C/C++ code (CWE-120/787)."""
from __future__ import annotations

import re
import time
from typing import Dict, List, Optional

from open_guardrail.core import GuardResult

UNSAFE_FUNCTION_PATTERNS = [
    re.compile(r"\bstrcpy\s*\("),
    re.compile(r"\bstrcat\s*\("),
    re.compile(r"\bsprintf\s*\("),
    re.compile(r"\bgets\s*\("),
    re.compile(r'\bscanf\s*\(\s*"%s"'),
    re.compile(r"\bvsprintf\s*\("),
    re.compile(r"\bwcscpy\s*\("),
    re.compile(r"\bwcscat\s*\("),
]

SAFE_ALTERNATIVES: Dict[str, str] = {
    "strcpy": "strncpy or strlcpy",
    "strcat": "strncat or strlcat",
    "sprintf": "snprintf",
    "gets": "fgets",
    "scanf": "scanf with width specifier",
    "vsprintf": "vsnprintf",
    "wcscpy": "wcsncpy",
    "wcscat": "wcsncat",
}

MISSING_BOUNDS_PATTERNS = [
    re.compile(
        r"malloc\s*\(\s*[^)]*\)\s*;(?![\s\S]{0,80}(?:if\s*\(|assert|check|<=|>=|<|>))"
    ),
    re.compile(r"memcpy\s*\(\s*[^,]+,\s*[^,]+,\s*(?!sizeof\b)[^)]*\)"),
]

FIXED_BUFFER_VARIABLE_INPUT = re.compile(
    r"char\s+\w+\s*\[\s*\d+\s*\]\s*;[\s\S]{0,200}?(?:strcpy|strcat|sprintf|gets)\s*\(\s*\w+\s*,"
)

ARRAY_NO_BOUNDS = re.compile(
    r"\w+\s*\[\s*(?:i|j|k|idx|index|n|count)\s*\]"
    r"(?![\s\S]{0,60}(?:if\s*\(.*(?:i|j|k|idx|index|n|count)\s*<|sizeof|\.length|\.size|bounds))"
)


class _CodegenBufferOverflow:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "codegen-buffer-overflow"
        self.action = action

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        findings: List[str] = []
        suggestions: List[str] = []

        for p in UNSAFE_FUNCTION_PATTERNS:
            if p.search(text):
                m = re.search(r"\\b(\w+)", p.pattern)
                func_name = m.group(1) if m else p.pattern
                findings.append(f"unsafe_function:{func_name}")
                alt = SAFE_ALTERNATIVES.get(func_name)
                if alt:
                    suggestions.append(f"Replace {func_name} with {alt}")

        for p in MISSING_BOUNDS_PATTERNS:
            if p.search(text):
                findings.append(f"missing_bounds:{p.pattern[:30]}")

        if FIXED_BUFFER_VARIABLE_INPUT.search(text):
            findings.append("fixed_buffer_variable_input")

        if ARRAY_NO_BOUNDS.search(text):
            findings.append("array_no_bounds_check")

        triggered = len(findings) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name=self.name,
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Buffer overflow risk: {len(findings)} pattern(s) found" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={
                "matchCount": len(findings),
                "findings": findings,
                "suggestions": suggestions,
                "reason": "CWE-120/787: Buffer overflow via unsafe memory operations",
            } if triggered else None,
        )


def codegen_buffer_overflow(*, action: str = "block") -> _CodegenBufferOverflow:
    return _CodegenBufferOverflow(action=action)
