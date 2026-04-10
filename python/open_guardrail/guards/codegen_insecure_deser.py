"""Detect insecure deserialization patterns (CWE-502)."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_DESER_PATTERNS = [
    # Python
    (re.compile(r'pickle\.loads?\s*\('), "Python pickle.load(s)"),
    (
        re.compile(r'yaml\.load\s*\(\s*[^,)]+\s*\)'),
        "Python yaml.load (no Loader arg)",
    ),
    (re.compile(r'marshal\.loads?\s*\('), "Python marshal.load(s)"),
    (re.compile(r'shelve\.open\s*\('), "Python shelve.open"),
    # Java
    (re.compile(r'ObjectInputStream'), "Java ObjectInputStream"),
    (re.compile(r'\.readObject\s*\('), "Java readObject()"),
    (re.compile(r'XMLDecoder'), "Java XMLDecoder"),
    (re.compile(r'XStream\s*\(\s*\)'), "Java XStream"),
    # PHP
    (re.compile(r'\bunserialize\s*\('), "PHP unserialize()"),
    (re.compile(r'maybe_unserialize\s*\('), "PHP maybe_unserialize()"),
    # Ruby
    (re.compile(r'Marshal\.load\s*\('), "Ruby Marshal.load"),
    (
        re.compile(r'YAML\.load\s*\([^)]*(?!safe)[^)]*\)', re.IGNORECASE),
        "Ruby YAML.load (unsafe)",
    ),
    # Node.js
    (
        re.compile(r'eval\s*\(\s*JSON\.parse\s*\('),
        "eval(JSON.parse())",
    ),
    (re.compile(r'node-serialize'), "node-serialize (known vulnerable)"),
    (re.compile(r'serialize-javascript'), "serialize-javascript"),
    # .NET
    (re.compile(r'BinaryFormatter'), ".NET BinaryFormatter"),
    (re.compile(r'SoapFormatter'), ".NET SoapFormatter"),
]


class _CodegenInsecureDeser:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "codegen-insecure-deser"
        self.action = action

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        findings: List[str] = []

        for pattern, label in _DESER_PATTERNS:
            if pattern.search(text):
                findings.append(label)

        triggered = len(findings) > 0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name=self.name,
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                f"Insecure deserialization risk: {', '.join(findings)}"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"findings": findings, "reason": "CWE-502"}
                if triggered
                else None
            ),
        )


def codegen_insecure_deser(
    *, action: str = "block"
) -> _CodegenInsecureDeser:
    return _CodegenInsecureDeser(action=action)
