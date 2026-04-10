"""Detect race condition patterns in generated code (CWE-362)."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

TOCTOU_PAIRS = [
    {
        "check": re.compile(r"fs\.existsSync\s*\("),
        "act": re.compile(r"fs\.(?:readFileSync|writeFileSync|unlinkSync)\s*\("),
        "label": "fs_toctou",
    },
    {
        "check": re.compile(r"fs\.access\s*\("),
        "act": re.compile(r"fs\.(?:readFile|writeFile|unlink)\s*\("),
        "label": "fs_async_toctou",
    },
    {
        "check": re.compile(r"os\.path\.exists\s*\("),
        "act": re.compile(r"open\s*\("),
        "label": "python_toctou",
    },
    {
        "check": re.compile(r"os\.path\.isfile\s*\("),
        "act": re.compile(r"open\s*\("),
        "label": "python_isfile_toctou",
    },
]

SHARED_STATE_PATTERNS = [
    re.compile(r"\bglobal\s+\w+"),
    re.compile(r"\bstatic\s+mut\s+"),
    re.compile(r"\blet\s+\w+\s*=\s*\{\};\s*[\s\S]*?async\s+function\b"),
]

SELECT_UPDATE_PATTERN = re.compile(
    r"SELECT\b[\s\S]{1,300}?UPDATE\b", re.IGNORECASE
)

LOCK_INDICATORS = [
    re.compile(r"mutex", re.IGNORECASE),
    re.compile(r"\.lock\s*\("),
    re.compile(r"synchronized", re.IGNORECASE),
    re.compile(r"atomic", re.IGNORECASE),
    re.compile(r"BEGIN\s+TRANSACTION", re.IGNORECASE),
    re.compile(r"\.transaction\s*\(", re.IGNORECASE),
    re.compile(r"FOR\s+UPDATE", re.IGNORECASE),
    re.compile(r"asyncio\.Lock", re.IGNORECASE),
    re.compile(r"threading\.Lock", re.IGNORECASE),
    re.compile(r"Semaphore", re.IGNORECASE),
]


class _CodegenRaceCondition:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "codegen-race-condition"
        self.action = action

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        findings: List[str] = []

        has_lock = any(p.search(text) for p in LOCK_INDICATORS)

        for pair in TOCTOU_PAIRS:
            if pair["check"].search(text) and pair["act"].search(text):
                findings.append(f"toctou:{pair['label']}")

        if not has_lock:
            for p in SHARED_STATE_PATTERNS:
                if p.search(text):
                    findings.append(f"shared_state:{p.pattern}")

            if SELECT_UPDATE_PATTERN.search(text):
                findings.append("non_atomic:SELECT_then_UPDATE_without_transaction")

        triggered = len(findings) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name=self.name,
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Race condition risk: {len(findings)} pattern(s) found" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={
                "matchCount": len(findings),
                "findings": findings,
                "reason": "CWE-362: Potential race condition or TOCTOU vulnerability",
            } if triggered else None,
        )


def codegen_race_condition(*, action: str = "block") -> _CodegenRaceCondition:
    return _CodegenRaceCondition(action=action)
