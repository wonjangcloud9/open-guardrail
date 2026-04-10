"""Detect command injection in generated code (CWE-78)."""
from __future__ import annotations

import re
import time
from typing import List, Optional

from open_guardrail.core import GuardResult

_CMD_INJECTION_PATTERNS = [
    (re.compile(r'os\.system\s*\('), "os.system()"),
    (re.compile(r'os\.popen\s*\('), "os.popen()"),
    (
        re.compile(
            r'subprocess\.call\s*\([^)]*shell\s*=\s*True',
            re.IGNORECASE,
        ),
        "subprocess.call(shell=True)",
    ),
    (
        re.compile(
            r'subprocess\.run\s*\([^)]*shell\s*=\s*True',
            re.IGNORECASE,
        ),
        "subprocess.run(shell=True)",
    ),
    (
        re.compile(
            r'subprocess\.Popen\s*\([^)]*shell\s*=\s*True',
            re.IGNORECASE,
        ),
        "subprocess.Popen(shell=True)",
    ),
    (re.compile(r'child_process\.exec\s*\('), "child_process.exec()"),
    (
        re.compile(r'child_process\.execSync\s*\('),
        "child_process.execSync()",
    ),
    (
        re.compile(
            r'child_process\.spawn\s*\([^)]*shell\s*:\s*true',
            re.IGNORECASE,
        ),
        "child_process.spawn(shell)",
    ),
    (
        re.compile(
            r'exec\s*\(\s*["\x27`](?:sh|bash|cmd|powershell)\b'
        ),
        "exec() with shell",
    ),
    (
        re.compile(r'Runtime\.getRuntime\s*\(\s*\)\.exec\s*\('),
        "Runtime.exec()",
    ),
    (re.compile(r'ProcessBuilder\s*\('), "Java ProcessBuilder"),
    (
        re.compile(r'exec\s*\(\s*`[^`]*\$\{'),
        "exec() with template literal",
    ),
    (re.compile(r'popen\s*\('), "popen()"),
    (re.compile(r'shell_exec\s*\('), "shell_exec() (PHP)"),
    (re.compile(r'passthru\s*\('), "passthru() (PHP)"),
    (re.compile(r'proc_open\s*\('), "proc_open() (PHP)"),
]


class _CodegenCommandInjection:
    def __init__(self, *, action: str = "block") -> None:
        self.name = "codegen-command-injection"
        self.action = action

    def check(self, text: str, stage: str = "output") -> GuardResult:
        start = time.perf_counter()
        findings: List[str] = []

        for pattern, label in _CMD_INJECTION_PATTERNS:
            if pattern.search(text):
                findings.append(label)

        triggered = len(findings) > 0
        elapsed = (time.perf_counter() - start) * 1000

        return GuardResult(
            guard_name=self.name,
            passed=not triggered,
            action=self.action if triggered else "allow",
            message=(
                f"Command injection risk: {', '.join(findings)}"
                if triggered
                else None
            ),
            latency_ms=round(elapsed, 2),
            details=(
                {"findings": findings, "reason": "CWE-78"}
                if triggered
                else None
            ),
        )


def codegen_command_injection(
    *, action: str = "block"
) -> _CodegenCommandInjection:
    return _CodegenCommandInjection(action=action)
