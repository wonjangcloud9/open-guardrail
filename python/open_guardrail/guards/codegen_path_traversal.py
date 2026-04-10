"""Detect path traversal vulnerabilities in generated code (CWE-22)."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

USER_INPUT_SOURCES = [
    re.compile(r"req\.body\.\w+"),
    re.compile(r"req\.params\.\w+"),
    re.compile(r"req\.query\.\w+"),
    re.compile(r"request\.form\["),
    re.compile(r"request\.args\["),
    re.compile(r"request\.json"),
    re.compile(r"params\.\w+"),
    re.compile(r"args\.\w+"),
]

PATH_CONSTRUCTION_WITH_INPUT = [
    re.compile(r"path\.join\s*\([^)]*(?:req\.|request\.|params\.|args\.)"),
    re.compile(r"os\.path\.join\s*\([^)]*(?:request\.|params|args)"),
    re.compile(r"Path\s*\([^)]*(?:request\.|params|args)"),
]

DANGEROUS_FILE_WITH_INPUT = [
    re.compile(r"fs\.readFile\w*\s*\([^)]*(?:req\.|request\.|params|user|input)"),
    re.compile(r"fs\.writeFile\w*\s*\([^)]*(?:req\.|request\.|params|user|input)"),
    re.compile(r"fs\.createReadStream\s*\([^)]*(?:req\.|request\.|params|user|input)"),
    re.compile(r"open\s*\([^)]*(?:request\.|user_|params|input)"),
    re.compile(r"new\s+File\s*\([^)]*(?:req\.|request\.|params)"),
]

TEMPLATE_PATH_PATTERNS = [
    re.compile(r"`[^`]*/[^`]*\$\{[^}]*(?:req|request|params|user|input)[^}]*\}[^`]*`"),
    re.compile(r'f["\'][^"\']*\/[^"\']*\{[^}]*(?:request|params|user|input)[^}]*\}[^"\']*["\']'),
]

SANITIZATION_INDICATORS = [
    re.compile(r"path\.resolve\s*\("),
    re.compile(r"realpath"),
    re.compile(r"\.startsWith\s*\(\s*(?:baseDir|basePath|rootDir|root|UPLOAD)"),
    re.compile(r"\.normalize\s*\("),
    re.compile(r"sanitize", re.IGNORECASE),
    re.compile(r"allowlist", re.IGNORECASE),
    re.compile(r"whitelist", re.IGNORECASE),
    re.compile(r'\.replace\s*\(\s*["\']\.\.'),
    re.compile(r'\.includes\s*\(\s*["\']\.\.'),
    re.compile(r"os\.path\.abspath"),
    re.compile(r"os\.path\.realpath"),
    re.compile(r"os\.path\.commonpath"),
]


class _CodegenPathTraversal:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "codegen-path-traversal"
        self.action = action

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        findings: List[str] = []

        has_sanitization = any(p.search(text) for p in SANITIZATION_INDICATORS)
        has_user_input = any(p.search(text) for p in USER_INPUT_SOURCES)

        if has_user_input and not has_sanitization:
            for p in PATH_CONSTRUCTION_WITH_INPUT:
                if p.search(text):
                    findings.append(f"unsafe_path_construction:{p.pattern}")

            for p in DANGEROUS_FILE_WITH_INPUT:
                if p.search(text):
                    findings.append(f"unsafe_file_access:{p.pattern}")

            for p in TEMPLATE_PATH_PATTERNS:
                if p.search(text):
                    findings.append(f"template_path:{p.pattern}")

        triggered = len(findings) > 0
        elapsed = (time.perf_counter() - start) * 1000
        return GuardResult(
            guard_name=self.name,
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=f"Path traversal risk: {len(findings)} pattern(s) found" if triggered else None,
            latency_ms=round(elapsed, 2),
            details={
                "matchCount": len(findings),
                "findings": findings,
                "reason": "CWE-22: Path traversal via unsanitized user input in file operations",
            } if triggered else None,
        )


def codegen_path_traversal(*, action: str = "block") -> _CodegenPathTraversal:
    return _CodegenPathTraversal(action=action)
